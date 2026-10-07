'use client';

import dynamic from 'next/dynamic';
import React, { useRef } from 'react';
import type { IJitsiMeetingProps } from '@jitsi/react-sdk/lib/types';
import { AlertCircle } from 'lucide-react';

// Dynamically import with ssr: false since Jitsi uses browser-only window APIs
const JitsiMeeting = dynamic(
  () => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-900 min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/70 text-sm font-medium">Initializing Live Classroom...</p>
        </div>
      </div>
    )
  }
);

export interface JitsiClassroomProps {
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
  const apiRef = useRef<any>(null);

  // Configurable conference domain via NEXT_PUBLIC_JITSI_DOMAIN / NEXT_PUBLIC_JAAS_APP_ID
  const configuredDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN?.trim();
  const jaasAppId = process.env.NEXT_PUBLIC_JAAS_APP_ID?.trim();
  const jitsiDomain = configuredDomain || (jaasAppId ? '8x8.vc' : 'meet.jit.si');
  const isPublicMeetJitsi = jitsiDomain === 'meet.jit.si' && !jaasAppId;

  // In 8x8 JaaS, room names must be prefixed by the tenant App ID: <AppId>/<roomName>
  const effectiveRoomName =
    jaasAppId && !roomName.startsWith(`${jaasAppId}/`)
      ? `${jaasAppId}/${roomName}`
      : roomName;

  const handleApiReady = (api: any) => {
    apiRef.current = api;

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

    // Attach event listeners
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

    // Periodic count check to guarantee accuracy
    const countTimer = setInterval(updateCount, 1500);
    // Initial query
    setTimeout(updateCount, 500);
  };

  const configOverwrite: IJitsiMeetingProps['configOverwrite'] = {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    disableDeepLinking: true,
    enableNoisyMicDetection: true,
    prejoinPageEnabled: false,
    prejoinConfig: {
      enabled: false
    },
    skipPrejoinScreen: true,
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
      'mute-everyone',
    ],
    subject: sessionTitle || 'BookKeep-It Live Class',
    requireDisplayName: true,
  };

  const interfaceConfigOverwrite: IJitsiMeetingProps['interfaceConfigOverwrite'] = {
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    HIDE_INVITE_MORE_HEADER: true,
    TOOLBAR_ALWAYS_VISIBLE: false,
    MOBILE_APP_PROMO: false,
    DISABLE_RINGING: true,
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col bg-slate-950 relative">
      {/* Informative warning banner when using public meet.jit.si for transparency */}
      {isInstructor && isPublicMeetJitsi && (
        <div className="bg-amber-950/90 border-b border-amber-600/40 px-3 py-1.5 text-[11px] text-amber-200 flex items-center justify-between gap-2 shrink-0 z-20">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>Notice:</strong> Conference is using public <code className="bg-black/30 px-1 py-0.5 rounded">meet.jit.si</code> (has ~5m embedded demo restriction). Set <code className="bg-black/30 px-1 py-0.5 rounded">NEXT_PUBLIC_JITSI_DOMAIN</code> for custom production Jitsi/JaaS.
            </span>
          </div>
        </div>
      )}

      <div className="w-full h-full flex-1 min-h-0">
        <JitsiMeeting
          domain={jitsiDomain}
          roomName={effectiveRoomName}
          configOverwrite={configOverwrite}
          interfaceConfigOverwrite={interfaceConfigOverwrite}
          userInfo={{
            displayName,
            email: userEmail || ''
          }}
          onApiReady={handleApiReady}
          getIFrameRef={(node) => {
            if (node) {
              node.style.width = '100%';
              node.style.height = '100%';
              node.style.flex = '1';
              node.style.border = 'none';
            }
          }}
        />
      </div>
    </div>
  );
};

export default JitsiClassroom;
