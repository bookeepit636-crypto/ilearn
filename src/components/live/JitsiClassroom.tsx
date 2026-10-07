'use client';

import dynamic from 'next/dynamic';
import React, { useRef } from 'react';
import type { IJitsiMeetingProps } from '@jitsi/react-sdk/lib/types';

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
  onParticipantLeft
}) => {
  const apiRef = useRef<any>(null);

  const handleApiReady = (api: any) => {
    apiRef.current = api;

    // Attach event listeners
    api.addEventListener('videoConferenceJoined', () => {
      onJoined?.();
    });

    api.addEventListener('videoConferenceLeft', () => {
      onLeft?.();
    });

    api.addEventListener('participantJoined', (e: any) => {
      onParticipantJoined?.({ id: e.id, displayName: e.displayName || 'Participant' });
    });

    api.addEventListener('participantLeft', (e: any) => {
      onParticipantLeft?.({ id: e.id });
    });
  };

  const configOverwrite: IJitsiMeetingProps['configOverwrite'] = {
    startWithAudioMuted: !isInstructor,
    startWithVideoMuted: false,
    disableDeepLinking: true,
    enableNoisyMicDetection: true,
    prejoinPageEnabled: false,           // We handle pre-join UI ourselves
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
      'videoquality',
      'filmstrip',
      'stats',
      'shortcuts',
      'mute-everyone',
    ],
    // Subject shown in the meeting header
    subject: sessionTitle || 'BookKeep-It Live Class',
    // Prevent guests who know the room name from entering without joining flow
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
    <div className="w-full flex-1 min-h-0 flex flex-col">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
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
            node.style.minHeight = '500px';
            node.style.border = 'none';
            node.style.borderRadius = '1rem';
          }
        }}
      />
    </div>
  );
};

export default JitsiClassroom;
