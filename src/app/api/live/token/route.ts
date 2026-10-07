import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

// Server-side JaaS JWT generation endpoint
// Generates secure RS256 signed JWTs for 8x8 JaaS without exposing private keys to client
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      sessionId,
      roomName,
      isModerator = false,
      userId,
      userName,
      userEmail,
      userAvatarUrl
    } = body;

    const appId = process.env.NEXT_PUBLIC_JAAS_APP_ID?.trim();
    const keyId = process.env.JAAS_KEY_ID?.trim();
    let privateKey = process.env.JAAS_PRIVATE_KEY?.trim();

    // Check if JaaS is configured
    if (!appId) {
      return NextResponse.json({
        success: false,
        token: null,
        configured: false,
        error: 'NEXT_PUBLIC_JAAS_APP_ID is not configured in environment variables.'
      });
    }

    if (!keyId || !privateKey) {
      return NextResponse.json({
        success: false,
        token: null,
        configured: false,
        error: 'JaaS private key credentials (JAAS_KEY_ID / JAAS_PRIVATE_KEY) are not configured in server environment variables.'
      });
    }

    // Normalize PEM newlines if passed with escaped \n in Vercel or .env
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Standard JaaS kid format is: <appId>/<keyId>
    const kid = keyId.startsWith(`${appId}/`) ? keyId : `${appId}/${keyId}`;

    // Standard JaaS JWT Header
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: kid
    };

    const now = Math.floor(Date.now() / 1000);

    // Standard JaaS JWT Payload
    const payload = {
      aud: 'jitsi',
      iss: 'chat',
      sub: appId,
      room: '*', // Wildcard or specific room allows joining designated room
      iat: now,
      nbf: now - 10,
      exp: now + 7200, // Valid for 2 hours (covers 40m and 60m classes)
      context: {
        user: {
          id: userId || 'user_' + Math.random().toString(36).slice(2, 9),
          name: userName || 'Participant',
          email: userEmail || '',
          avatar: userAvatarUrl || '',
          moderator: Boolean(isModerator)
        },
        features: {
          recording: Boolean(isModerator),
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
      configured: true,
      appId,
      roomName,
      isModerator: Boolean(isModerator)
    });
  } catch (error: any) {
    console.error('Server JaaS token generation error:', error);
    return NextResponse.json({
      success: false,
      token: null,
      configured: false,
      error: error?.message || 'Failed to generate JaaS token'
    }, { status: 500 });
  }
}
