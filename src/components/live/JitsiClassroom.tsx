'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface JitsiClassroomProps {
  sessionId?: string;
  userId?: string;
  roomName: string;
  displayName: string;
  userEmail?: string;
  userAvatarUrl?: string;
  isInstructor?: boolean;
  sessionTitle?: string;
  onJoined?: () => void;
  onLeft?: () => void;
  onParticipantJoined?: (participant: { id: string; displayName: string }) => void;
  onParticipantLeft?: (participant: { id: string }) => void;
  onParticipantCountChanged?: (count: number) => void;
}

const JitsiClassroom: React.FC<JitsiClassroomProps> = ({
  sessionId,
  userId,
  roomName,
  displayName,
  userEmail,
  userAvatarUrl,
  isInstructor = false,
  sessionTitle,
  onJoined,
  onLeft,
  onParticipantJoined,
  onParticipantLeft,
  onParticipantCountChanged
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Strict domain resolution: NEVER fall back to meet.jit.si in production
  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN?.trim();
  const jaasAppId = process.env.NEXT_PUBLIC_JAAS_APP_ID?.trim();

  // Compute script URL from configured domain and optional tenant App ID
  const scriptUrl = domain
    ? jaasAppId
      ? `https://${domain}/${jaasAppId}/external_api.js`
      : `https://${domain}/external_api.js`
    : null;

  // Runtime logging for verification
  useEffect(() => {
    if (domain && scriptUrl) {
      console.log('Jitsi domain:', domain);
      console.log('Jitsi external API URL:', scriptUrl);
    }
  }, [domain, scriptUrl]);

  // Load external API script and instantiate JitsiMeetExternalAPI
  useEffect(() => {
    if (!domain || !scriptUrl) {
      return;
    }

    let isMounted = true;
    let countInterval: any = null;

    const initMeeting = async () => {
      try {
        setLoading(true);
        setInitError(null);

        // 1. Fetch server-signed JaaS JWT if JaaS credentials exist
        let jwtToken: string | null = null;
        try {
          const tokenRes = await fetch('/api/live/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              roomName,
              isModerator: isInstructor,
              userId,
              userName: displayName,
              userEmail,
              userAvatarUrl
            })
          });

          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            if (tokenData.success && tokenData.token) {
              jwtToken = tokenData.token;
            } else if (tokenData.configured === false) {
              console.info('JaaS Token Notice:', tokenData.error);
            }
          }
        } catch (tokenErr) {
          console.warn('Could not contact /api/live/token, proceeding with direct room:', tokenErr);
        }

        // 2. Ensure external_api.js script is loaded from configured domain
        await new Promise<void>((resolve, reject) => {
          if ((window as any).JitsiMeetExternalAPI) {
            return resolve();
          }

          // Check if script tag already exists
          const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
          if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${scriptUrl}`)));
            return;
          }

          const script = document.createElement('script');
          script.src = scriptUrl;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load Jitsi API script from ${scriptUrl}`));
          document.head.appendChild(script);
        });

        if (!isMounted || !containerRef.current) return;

        // Clean up any existing instance in container
        if (apiRef.current) {
          try {
            apiRef.current.dispose();
          } catch {}
          apiRef.current = null;
        }
        containerRef.current.innerHTML = '';

        // In 8x8 JaaS, both instructor and students must use: <appId>/<roomName>
        const effectiveRoom = jaasAppId && !roomName.startsWith(`${jaasAppId}/`)
          ? `${jaasAppId}/${roomName}`
          : roomName;

        const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
        if (!JitsiMeetExternalAPI) {
          throw new Error('JitsiMeetExternalAPI is undefined after script load.');
        }

        const options = {
          roomName: effectiveRoom,
          parentNode: containerRef.current,
          jwt: jwtToken || undefined,
          userInfo: {
            displayName,
            email: userEmail || ''
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            enableNoisyMicDetection: true,
            prejoinPageEnabled: false,
            prejoinConfig: { enabled: false },
            skipPrejoinScreen: true,
            subject: sessionTitle || 'BookKeep-It Live Class',
            requireDisplayName: true,
            toolbarButtons: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'participants-pane',
              'raisehand',
              'tileview',
              'chat',
              'videoquality',
              'filmstrip',
              'stats',
              'shortcuts',
              'mute-everyone'
            ]
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            HIDE_INVITE_MORE_HEADER: true,
            TOOLBAR_ALWAYS_VISIBLE: false,
            MOBILE_APP_PROMO: false,
            DISABLE_RINGING: true
          }
        };

        const api = new JitsiMeetExternalAPI(domain, options);
        apiRef.current = api;
        setLoading(false);

        // Update participant count helper
        const updateCount = () => {
          try {
            if (api && typeof api.getNumberOfParticipants === 'function') {
              const count = api.getNumberOfParticipants();
              if (typeof count === 'number' && count >= 0) {
                onParticipantCountChanged?.(count);
              }
            }
          } catch {}
        };

        api.addEventListener('videoConferenceJoined', () => {
          onJoined?.();
          updateCount();
        });

        api.addEventListener('videoConferenceLeft', () => {
          onLeft?.();
          updateCount();
        });

        api.addEventListener('participantJoined', (e: any) => {
          onParticipantJoined?.({ id: e.id, displayName: e.displayName || 'Participant' });
          updateCount();
        });

        api.addEventListener('participantLeft', (e: any) => {
          onParticipantLeft?.({ id: e.id });
          updateCount();
        });

        countInterval = setInterval(updateCount, 1500);
        setTimeout(updateCount, 600);
      } catch (err: any) {
        console.error('Jitsi initialization failure:', err);
        if (isMounted) {
          setInitError(err?.message || 'Failed to initialize live conference.');
          setLoading(false);
        }
      }
    };

    initMeeting();

    return () => {
      isMounted = false;
      if (countInterval) clearInterval(countInterval);
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch {}
        apiRef.current = null;
      }
    };
  }, [domain, scriptUrl, roomName, jaasAppId, displayName, userEmail, userAvatarUrl, isInstructor, sessionId, userId, sessionTitle]);

  // FAIL HARD IF DOMAIN IS NOT CONFIGURED: Do NOT silently fall back to meet.jit.si
  if (!domain) {
    return (
      <div className="w-full h-full flex-1 min-h-[450px] flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="max-w-md bg-rose-950/80 border border-rose-500/50 rounded-2xl p-6 text-rose-200 space-y-3 shadow-xl">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="font-bold text-lg text-white">Live Classroom Configuration Error</h3>
          <p className="text-sm text-rose-300">
            The Jitsi conference domain is not configured (<code className="bg-black/50 px-1 py-0.5 rounded text-rose-100">NEXT_PUBLIC_JITSI_DOMAIN</code> is missing).
          </p>
          <p className="text-xs text-rose-400 leading-relaxed">
            Production will not silently fall back to the public demo server (<code className="bg-black/40 px-1 rounded">meet.jit.si</code>). Please configure <code className="bg-black/40 px-1 rounded text-white">NEXT_PUBLIC_JITSI_DOMAIN=8x8.vc</code> in your Vercel Environment Variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col bg-slate-950 relative">
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-white/80 text-sm font-semibold">Connecting to Live Classroom ({domain})...</p>
          </div>
        </div>
      )}

      {/* Initialization Error State */}
      {initError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/95 p-6">
          <div className="max-w-md bg-rose-950/80 border border-rose-500/50 rounded-2xl p-6 text-rose-200 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h4 className="font-bold text-white text-base">Conference Connection Failed</h4>
            <p className="text-xs text-rose-300">{initError}</p>
            <p className="text-[11px] text-rose-400">Target Domain: {domain}</p>
          </div>
        </div>
      )}

      {/* Conference Container */}
      <div
        ref={containerRef}
        id="jaas-container"
        className="w-full h-full flex-1 min-h-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-none [&>iframe]:flex-1"
      />
    </div>
  );
};

export default JitsiClassroom;
