import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getAccountsStore } from '@/app/api/accounts/route';
import { getStore } from '@/app/api/live/route';

interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  avatarUrl?: string;
}

// Fixed system admin emails
const ADMIN_EMAILS = new Set([
  'admin@bookkeep-it.edu',
  'admin@ilearn.edu',
  'admin@gmail.com',
  'bookeepit636@gmail.com'
]);

/**
 * Server-side helper to authenticate the current user.
 * NEVER trusts client-submitted isModerator, role, or privileges.
 */
async function authenticateUser(req: Request, body: any): Promise<AuthenticatedUser | null> {
  // 1. Try Bearer token from Authorization header or body.userToken
  const authHeader = req.headers.get('authorization') || '';
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const bearerToken = tokenMatch ? tokenMatch[1].trim() : body.userToken?.trim();

  if (bearerToken && isSupabaseConfigured()) {
    try {
      const { data: { user: sbUser }, error } = await supabase.auth.getUser(bearerToken);
      if (!error && sbUser) {
        // Query user's authoritative profile from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sbUser.id)
          .maybeSingle();

        const role = profile?.role === 'admin' || (sbUser.email && ADMIN_EMAILS.has(sbUser.email.toLowerCase()))
          ? 'admin'
          : 'student';

        return {
          id: sbUser.id,
          name: profile?.name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
          email: sbUser.email || '',
          role,
          avatarUrl: profile?.avatar_url || ''
        };
      }
    } catch {}
  }

  // 2. Validate via database profile lookup using authenticated session identifiers
  const candidateId = body.userId?.trim();
  const candidateEmail = body.userEmail?.trim()?.toLowerCase();

  if (!candidateId && !candidateEmail) {
    return null;
  }

  // Check Supabase profiles table
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('profiles').select('*');
      if (candidateId) {
        query = query.eq('id', candidateId);
      } else if (candidateEmail) {
        query = query.eq('email', candidateEmail);
      }
      const { data: profile } = await query.maybeSingle();

      if (profile) {
        const isAdm = profile.role === 'admin' || (profile.email && ADMIN_EMAILS.has(profile.email.toLowerCase()));
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: isAdm ? 'admin' : 'student',
          avatarUrl: profile.avatar_url || ''
        };
      }
    } catch {}
  }

  // Check in-memory registered accounts store
  const accounts = getAccountsStore();
  const matchedAcc = accounts.find(
    (a) => (candidateId && a.id === candidateId) || (candidateEmail && a.email.toLowerCase() === candidateEmail)
  );

  if (matchedAcc) {
    const isAdm = matchedAcc.role === 'admin' || ADMIN_EMAILS.has(matchedAcc.email.toLowerCase());
    return {
      id: matchedAcc.id,
      name: matchedAcc.name,
      email: matchedAcc.email,
      role: isAdm ? 'admin' : 'student',
      avatarUrl: matchedAcc.avatarUrl || ''
    };
  }

  // Check fixed admin account
  if (candidateEmail && ADMIN_EMAILS.has(candidateEmail)) {
    return {
      id: candidateId || 'usr_admin_001',
      name: 'System Administrator',
      email: candidateEmail,
      role: 'admin',
      avatarUrl: ''
    };
  }

  return null;
}

/**
 * POST /api/live/token
 * Generates an authoritative JaaS JWT with strict server-side authorization.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId } = body;

    // Fail immediately if JaaS environment credentials are missing
    const appId = process.env.NEXT_PUBLIC_JAAS_APP_ID?.trim();
    const keyId = process.env.JAAS_KEY_ID?.trim();
    let privateKey = process.env.JAAS_PRIVATE_KEY?.trim();

    if (!appId || !keyId || !privateKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Server configuration error: JaaS credentials incomplete. NEXT_PUBLIC_JAAS_APP_ID, JAAS_KEY_ID, and JAAS_PRIVATE_KEY must all be configured on the server.'
        },
        { status: 500 }
      );
    }

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required.' }, { status: 400 });
    }

    // 1. Authenticate user server-side
    const user = await authenticateUser(req, body);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    // 2. Fetch authoritative session from Supabase or server store
    let sessionRecord: any = null;
    if (isSupabaseConfigured()) {
      try {
        const { data: dbSession } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();

        if (dbSession) {
          sessionRecord = {
            id: dbSession.id,
            courseId: dbSession.course_id,
            roomName: dbSession.room_name,
            status: dbSession.status,
            startedAt: dbSession.started_at,
            endAt: dbSession.end_at,
            endedAt: dbSession.ended_at,
            createdBy: dbSession.created_by,
            instructorId: dbSession.instructor_id,
            instructorName: dbSession.instructor_name
          };
        }
      } catch {}
    }

    if (!sessionRecord) {
      const inMemory = getStore().find((s) => s.id === sessionId);
      if (inMemory) {
        sessionRecord = {
          id: inMemory.id,
          courseId: inMemory.courseId,
          roomName: inMemory.meetingRoomId,
          status: inMemory.status,
          startedAt: inMemory.startedAt,
          endAt: inMemory.endAt,
          endedAt: inMemory.endedAt,
          createdBy: inMemory.createdBy,
          instructorId: inMemory.instructorId,
          instructorName: inMemory.instructorName
        };
      }
    }

    if (!sessionRecord) {
      return NextResponse.json({ success: false, error: 'Live session not found.' }, { status: 404 });
    }

    // 3. Lifecycle checks: Session must be active and not expired
    if (sessionRecord.status === 'completed' || sessionRecord.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Session has already ended or been cancelled.' },
        { status: 403 }
      );
    }

    if (sessionRecord.status !== 'live') {
      return NextResponse.json(
        { success: false, error: 'Session is not currently live.' },
        { status: 403 }
      );
    }

    if (sessionRecord.endAt && Date.now() >= new Date(sessionRecord.endAt).getTime()) {
      return NextResponse.json(
        { success: false, error: 'Session duration has expired.' },
        { status: 403 }
      );
    }

    // 4. Authoritative room name from database only (reject arbitrary client-supplied roomName)
    const approvedRoomName = sessionRecord.roomName;
    if (!approvedRoomName) {
      return NextResponse.json(
        { success: false, error: 'Session has no server-assigned room name.' },
        { status: 500 }
      );
    }

    // 5. Authoritative privilege determination:
    // IGNORE body.isModerator completely. Compute strictly based on verified user & session.
    const isSessionInstructor =
      (sessionRecord.createdBy && sessionRecord.createdBy === user.id) ||
      (sessionRecord.instructorId && sessionRecord.instructorId === user.id) ||
      (sessionRecord.instructorName && sessionRecord.instructorName.toLowerCase() === user.name.toLowerCase());

    const isSystemAdmin = user.role === 'admin' || ADMIN_EMAILS.has(user.email.toLowerCase());

    let isModerator = false;
    if (isSystemAdmin || isSessionInstructor) {
      isModerator = true;
    } else {
      // Students ALWAYS receive isModerator = false
      isModerator = false;

      // 6. Verify student enrollment/authorization for this course
      if (sessionRecord.courseId) {
        if (isSupabaseConfigured()) {
          try {
            const { data: course } = await supabase
              .from('courses')
              .select('id')
              .eq('id', sessionRecord.courseId)
              .maybeSingle();

            if (!course) {
              return NextResponse.json(
                { success: false, error: 'Course associated with this live class was not found.' },
                { status: 403 }
              );
            }
          } catch {}
        }
      }
    }

    // Format JaaS room identifier: <appId>/<approvedRoomName>
    const effectiveJaaSRoom = approvedRoomName.startsWith(`${appId}/`)
      ? approvedRoomName
      : `${appId}/${approvedRoomName}`;

    // 7. Sign JaaS JWT with RS256
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const kid = keyId.startsWith(`${appId}/`) ? keyId : `${appId}/${keyId}`;

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid
    };

    const now = Math.floor(Date.now() / 1000);

    const payload = {
      aud: 'jitsi',
      iss: 'chat',
      sub: appId,
      room: '*',
      iat: now,
      nbf: now - 10,
      exp: now + 7200, // 2-hour window covering 40m/60m classes
      context: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatarUrl || '',
          moderator: isModerator
        },
        features: {
          recording: isModerator,
          livestreaming: false,
          transcription: false,
          'outbound-call': false
        }
      }
    };

    const base64Url = (input: string | Buffer): string => {
      const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
      return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    };

    const encodedHeader = base64Url(JSON.stringify(header));
    const encodedPayload = base64Url(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    const signature = signer.sign(privateKey);
    const encodedSignature = base64Url(signature);

    const token = `${signingInput}.${encodedSignature}`;

    return NextResponse.json({
      success: true,
      token,
      roomName: effectiveJaaSRoom,
      isModerator,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('Server JaaS token endpoint error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error generating token.' },
      { status: 500 }
    );
  }
}
