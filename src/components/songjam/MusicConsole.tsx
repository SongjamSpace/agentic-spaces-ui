import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Music2, Loader2 } from 'lucide-react';
import { getMusicUploadsByUserId } from '@/services/storage/dj.storage';
import { updateMusicState, clearMusicState } from '@/services/db/liveSpaces.db';
import type { DailyCall } from '@daily-co/daily-js';
import { db } from '@/services/firebase.service';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface MusicTrack {
    name: string;
    audioUrl: string;
}

interface MusicConsoleProps {
    hostTwitterId: string;
    dailyCallObject: DailyCall | null;
    hostUsername: string;
}

export default function MusicConsole({ hostTwitterId, dailyCallObject, hostUsername }: MusicConsoleProps) {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

    // Fetch music tracks
    useEffect(() => {
        const fetchMusic = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('accountId', '==', hostTwitterId));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    setError('User not found');
                    setTracks([]);
                    return;
                }

                // Get the document ID (first matching user)
                const userDoc = querySnapshot.docs[0];
                const userId = userDoc.id;

                // Fetch music uploads using the document ID
                const musicTracks = await getMusicUploadsByUserId(userId);
                setTracks(musicTracks);

                if (musicTracks.length === 0) {
                    setError('Playlist not found');
                }
            } catch (err) {
                console.error('Error fetching music:', err);
                setError('Failed to load music');
            } finally {
                setIsLoading(false);
            }
        };

        if (hostTwitterId) {
            fetchMusic();
        } else {
            setError('Account not found');
            setTracks([]);
        }
    }, [hostTwitterId]);

    // Download and stream music to Daily.co
    useEffect(() => {
        if (!isPlaying || !tracks.length || !dailyCallObject) {
            // Stop playback
            if (sourceNodeRef.current) {
                sourceNodeRef.current.stop();
                sourceNodeRef.current = null;
            }
            return;
        }

        const streamMusicToDaily = async () => {
            try {
                
                // Create or reuse audio context
                if (!audioContextRef.current) {
                    audioContextRef.current = new AudioContext();
                }
                const audioContext = audioContextRef.current;

                // Download the audio file
                const audioUrl = tracks[currentTrackIndex].audioUrl;
                
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();

                // Decode the audio data
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Create source node
                const sourceNode = audioContext.createBufferSource();
                sourceNode.buffer = audioBuffer;
                sourceNode.loop = true; // Loop the track
                sourceNodeRef.current = sourceNode;

                // Create gain node for volume control
                const gainNode = audioContext.createGain();
                gainNode.gain.value = 0.7; // 70% volume

                // Create media stream destination for Daily.co
                if (!destinationRef.current) {
                    destinationRef.current = audioContext.createMediaStreamDestination();
                }
                const destination = destinationRef.current;

                // Connect: source -> gain -> destination (for Daily.co broadcast)
                sourceNode.connect(gainNode);
                gainNode.connect(destination);
                
                // ALSO connect to local speakers so host can hear it
                gainNode.connect(audioContext.destination);

                // Get the media stream
                const mediaStream = destination.stream;
                const audioTrack = mediaStream.getAudioTracks()[0];

                // Send to Daily.co as custom track with music mode for better quality
                await dailyCallObject.startCustomTrack({
                    track: audioTrack,
                    trackName: 'music-stream',
                    mode: 'music'
                });

                // Start playback
                sourceNode.start(0);

                // Save music state to database
                await updateMusicState(hostUsername, true, 'music-stream'); //TODO: fix this bs

                // Handle when track ends (though loop=true should prevent this)
                sourceNode.onended = () => {
                    if (isPlaying) {
                        setIsPlaying(false);
                    }
                };

            } catch (err) {
                console.error('Error streaming music:', err);
                setError('Failed to stream audio');
                setIsPlaying(false);
            }
        };

        streamMusicToDaily();

        // Cleanup
        return () => {
            if (sourceNodeRef.current) {
                try {
                    sourceNodeRef.current.stop();
                } catch (e) {
                    // Already stopped
                }
                sourceNodeRef.current = null;
            }
            
            if (dailyCallObject) {
                dailyCallObject.stopCustomTrack('music-stream').catch(() => {
                    // Track might not exist
                });
            }

            // Clear music state from database
            clearMusicState(hostUsername).catch(err => {
                console.error('Error clearing music state:', err);
            });
        };
    }, [isPlaying, currentTrackIndex, tracks, dailyCallObject]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleTrackChange = (index: number) => {
        setCurrentTrackIndex(index);
        // Restart playback if already playing
        if (isPlaying) {
            setIsPlaying(false);
            setTimeout(() => setIsPlaying(true), 100);
        }
    };

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
            <button
                onClick={handlePlayPause}
                className={`p-2 rounded-full transition-all ${
                    isPlaying 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title={isPlaying ? 'Stop music' : 'Play music'}
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4 text-white fill-white" />
                ) : (
                    <Play className="w-4 h-4 text-white fill-white" />
                )}
            </button>

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
