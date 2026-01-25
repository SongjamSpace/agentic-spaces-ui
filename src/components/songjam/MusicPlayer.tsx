import React, { useEffect, useRef } from 'react';
import type { DailyCall, DailyEventObjectTrack } from '@daily-co/daily-js';

interface MusicPlayerProps {
    dailyCallObject: DailyCall | null;
}

/**
 * MusicPlayer component handles receiving and playing custom audio tracks
 * (music) streamed by the host via Daily.co's custom track API.
 * 
 * This component listens for the 'track-started' event from Daily.co and
 * automatically plays any custom audio track with the name 'music-stream'.
 */
export default function MusicPlayer({ dailyCallObject }: MusicPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!dailyCallObject) return;

        const handleTrackStarted = (event: DailyEventObjectTrack) => {
            console.log('Track started event received:', event);

            // Check if this is our custom music track
            if (event.track && event.track.kind === 'audio') {
                // The custom track name is stored in event.type property
                const trackType = (event as any).type;

                // Only handle the music-stream custom track
                if (trackType === 'music-stream') {
                    console.log('Music stream track detected, setting up audio playback...');

                    try {
                        // Create a new MediaStream with the audio track
                        const mediaStream = new MediaStream([event.track]);
                        mediaStreamRef.current = mediaStream;

                        // Create audio element if it doesn't exist
                        if (!audioRef.current) {
                            audioRef.current = new Audio();
                            audioRef.current.autoplay = true;
                        }

                        // Attach the media stream to the audio element
                        audioRef.current.srcObject = mediaStream;
                        
                        // Play the audio
                        audioRef.current.play()
                            .catch((error) => {
                                console.error('Failed to play music:', error);
                            });
                    } catch (error) {
                        console.error('Error setting up music playback:', error);
                    }
                }
            }
        };

        const handleTrackStopped = (event: DailyEventObjectTrack) => {
            // The custom track name is stored in event.type property
            const trackType = (event as any).type;
            
            if (trackType === 'music-stream') {
                
                // Stop and cleanup the audio element
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.srcObject = null;
                }

                // Clear the media stream reference
                mediaStreamRef.current = null;
            }
        };

        // Register event listeners
        dailyCallObject.on('track-started', handleTrackStarted);
        dailyCallObject.on('track-stopped', handleTrackStopped);

        // Cleanup on unmount
        return () => {
            dailyCallObject.off('track-started', handleTrackStarted);
            dailyCallObject.off('track-stopped', handleTrackStopped);

            // Stop audio playback
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.srcObject = null;
                audioRef.current = null;
            }

            mediaStreamRef.current = null;
        };
    }, [dailyCallObject]);

    // This component doesn't render anything visible
    return null;
}
