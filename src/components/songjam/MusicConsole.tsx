'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Music2, Loader2 } from 'lucide-react';
import { getMusicUploadsByUserId } from '@/services/storage/dj.storage';
import type { DailyCall } from '@daily-co/daily-js';
import { db } from '@/services/firebase.service';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface MusicTrack {
    name: string;
    audioUrl: string;
}

interface MusicConsoleProps {
    hostTwitterUsername: string;
    dailyCallObject: DailyCall | null;
}

export default function MusicConsole({ hostTwitterUsername, dailyCallObject }: MusicConsoleProps) {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const customTrackNameRef = useRef<string | null>(null);

    // Fetch music tracks
    useEffect(() => {
        const fetchMusic = async () => {
            try {
                setIsLoading(true);
                setError(null);
                // Query users collection by twitterUsername
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('twitterUsername', '==', hostTwitterUsername));
                const querySnapshot = await getDocs(q);
                
                // if (querySnapshot.empty) {
                //     setError('User not found');
                //     setTracks([]);
                //     return;
                // }

                // Get the document ID (first matching user)
                const userDoc = querySnapshot.docs[0];
                // const userId = userDoc.id;

                // Fetch music uploads using the document ID
                const musicTracks = await getMusicUploadsByUserId('0198bf03-b96b-4ed1-928a-2faa127e67a5');
                setTracks(musicTracks);

                if (musicTracks.length === 0) {
                    setError('No music uploaded yet');
                }
            } catch (err) {
                console.error('Error fetching music:', err);
                setError('Failed to load music');
            } finally {
                setIsLoading(false);
            }
        };

        if (hostTwitterUsername) {
            fetchMusic();
        }
    }, [hostTwitterUsername]);

    // Setup and stream audio to Daily.co when playing
    useEffect(() => {
        if (!isPlaying || !tracks.length || !dailyCallObject) {
            // Stop audio if not playing and restore original mic
            if (audioRef.current) {
                audioRef.current.pause();
            }
            
            // Restore microphone input
            if (dailyCallObject && customTrackNameRef.current) {
                dailyCallObject.setInputDevicesAsync({
                    audioSource: false
                }).catch(console.error);
                customTrackNameRef.current = null;
            }
            return;
        }

        const setupAudioBroadcast = async () => {
            try {
                console.log('Setting up music broadcast to Daily.co room...');
                
                // Create or reuse audio element
                if (!audioRef.current) {
                    audioRef.current = new Audio();
                    audioRef.current.loop = true;
                    audioRef.current.volume = 0.7;
                }

                // Set the audio source
                const audioUrl = tracks[currentTrackIndex].audioUrl;
                console.log('Loading audio from:', audioUrl);
                audioRef.current.src = audioUrl;
                audioRef.current.crossOrigin = 'anonymous';
                
                // Load and play the audio
                await audioRef.current.play();
                console.log('Audio playing locally');

                // Small delay to ensure audio is playing
                await new Promise(resolve => setTimeout(resolve, 200));

                // Create MediaStream from audio element
                // @ts-ignore - captureStream exists but not in TS types
                const mediaStream = audioRef.current.captureStream() as MediaStream;
                
                if (!mediaStream) {
                    throw new Error('captureStream not supported by browser');
                }

                const audioTracks = mediaStream.getAudioTracks();
                if (audioTracks.length === 0) {
                    throw new Error('No audio tracks in MediaStream');
                }

                console.log('MediaStream created with audio track');

                // Replace the microphone input with the music stream
                // This makes the music broadcast like the host's voice
                await dailyCallObject.updateInputSettings({
                    audio: {
                        processor: {
                            type: 'none'
                        }
                    }
                });

                // Set the custom audio track as input
                await dailyCallObject.setInputDevicesAsync({
                    audioSource: audioTracks[0]
                });
                
                customTrackNameRef.current = 'music-active';
                console.log('Music is now broadcasting to all participants through main audio channel');

            } catch (err) {
                console.error('Error broadcasting music:', err);
                setIsPlaying(false);
                setError('Failed to broadcast audio');
            }
        };

        setupAudioBroadcast();

        // Cleanup on unmount or when stopping
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            
            // Restore microphone when stopping
            if (dailyCallObject && customTrackNameRef.current) {
                console.log('Restoring microphone input');
                dailyCallObject.setInputDevicesAsync({
                    audioSource: false
                }).catch(console.error);
                customTrackNameRef.current = null;
            }
        };
    }, [isPlaying, currentTrackIndex, tracks, dailyCallObject]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleTrackChange = (index: number) => {
        setCurrentTrackIndex(index);
        // Keep playing if already playing
        if (isPlaying) {
            setIsPlaying(false);
            setTimeout(() => setIsPlaying(true), 100);
        }
    };

    const currentTrack = tracks[currentTrackIndex];

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                <span className="text-xs text-slate-400">Loading music...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
                <Music2 className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400">{error}</span>
            </div>
        );
    }

    if (!tracks.length) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
                <Music2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400">No music uploaded</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <button
                onClick={handlePlayPause}
                className={`p-2 rounded-full transition-all ${
                    isPlaying 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title={isPlaying ? 'Pause music' : 'Play music'}
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4 text-white fill-white" />
                ) : (
                    <Play className="w-4 h-4 text-white fill-white" />
                )}
            </button>

            {/* Track Selector Dropdown */}
            <div className="relative">
                <select
                    value={currentTrackIndex}
                    onChange={(e) => handleTrackChange(Number(e.target.value))}
                    className="pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white hover:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors cursor-pointer appearance-none"
                    style={{ minWidth: '150px' }}
                >
                    {tracks.map((track, index) => (
                        <option key={index} value={index}>
                            {track.name.replace(/\.[^/.]+$/, '')}
                        </option>
                    ))}
                </select>
                <Music2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}
