import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { ai, isGeminiConfigured } from '../lib/supabaseClient';
import { AnalysisContext } from '../types';
import FeedbackDisplay from './FeedbackDisplay';
import LiveAnalysisModal from './LiveAnalysisModal';
import { decodeAudioData, createBlob, decode } from './lib/audioUtils';

interface LivePracticeSessionPageProps {
    topic: string;
    onEndSession: (summary: any) => void;
    onBackToDashboard: () => void;
    onAnalyzeLiveSession: (audio: Blob, context: AnalysisContext) => void;
}

const FILLER_WORDS = new Set(['um', 'uh', 'ah', 'er', 'like', 'you know', 'so', 'well', 'basically', 'actually', 'literally']);

const LivePracticeSessionPage: React.FC<LivePracticeSessionPageProps> = ({ topic, onBackToDashboard, onAnalyzeLiveSession }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'ended'>('connecting');
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    
    // Media and stream refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const recordedAudioChunks = useRef<Float32Array[]>([]);
    
    // Real-time metrics state
    const [wpm, setWpm] = useState(0);
    const [volume, setVolume] = useState(0);
    const [fillerWordCount, setFillerWordCount] = useState(new Map<string, number>());
    const [feedbackTips, setFeedbackTips] = useState<{ id: number; text: string }[]>([]);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const wordCountHistory = useRef<{ time: number, count: number }[]>([]);
    const lastWordTimestamp = useRef(Date.now());

    // Audio processing refs
    const outputAudioContext = useRef<AudioContext | null>(null);
    const nextStartTime = useRef(0);
    const aiAudioSources = useRef(new Set<AudioBufferSourceNode>());

    const handleBack = () => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
        }
        onBackToDashboard();
    };
    
    const handleEndAndAnalyze = () => {
        setShowAnalysisModal(true);
    };

    const handleAnalysisSubmit = (context: AnalysisContext) => {
        setShowAnalysisModal(false);
        setStatus('ended');
        
        // Stop the session and process the recording
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                session.close();
                
                const totalLength = recordedAudioChunks.current.reduce((acc, chunk) => acc + chunk.length, 0);
                const combined = new Float32Array(totalLength);
                let offset = 0;
                for (const chunk of recordedAudioChunks.current) {
                    combined.set(chunk, offset);
                    offset += chunk.length;
                }

                // Convert Float32Array to Int16Array and then to Blob
                const int16 = new Int16Array(combined.length);
                for (let i = 0; i < combined.length; i++) {
                    int16[i] = Math.max(-32768, Math.min(32767, combined[i] * 32768));
                }
                const audioBlob = new Blob([int16.buffer], { type: 'audio/wav' });

                onAnalyzeLiveSession(audioBlob, {
                    ...context,
                    duration: Math.round(totalLength / 16000)
                });
            });
        }
    };
    
    const cleanup = useCallback(() => {
        // This function is critical for releasing all resources.
        const cleanupPromise = sessionPromiseRef.current;
        if (cleanupPromise) {
            cleanupPromise.then(session => {
                if (session) {
                    try {
                        session.close();
                    } catch (e) { console.warn("Session already closed or failed to close."); }
                }
            }).catch(e => console.warn("Error getting session for cleanup:", e));
        }
        
        // Stop all tracks on the stream attached to the video element.
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        if (outputAudioContext.current) {
            outputAudioContext.current.close().catch(e => console.warn("Audio context already closed."));
        }
        
        for (const source of aiAudioSources.current) {
            try {
                source.stop();
            } catch (e) {}
        }
        aiAudioSources.current.clear();
        recordedAudioChunks.current = [];
        
        console.log("Live session cleanup complete.");
    }, []);
    
    useEffect(() => {
        if (!isGeminiConfigured) {
            setStatus('error');
            return;
        }

        outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        const initializeSession = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
                    video: true,
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                
                const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const source = inputAudioContext.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    // Store for final analysis
                    recordedAudioChunks.current.push(new Float32Array(inputData)); 
                    const pcmBlob = createBlob(inputData);
                    
                    if (sessionPromiseRef.current) {
                        sessionPromiseRef.current.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    }
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination); // Connect to destination to start processing

                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => setStatus('connected'),
                        onmessage: async (message: LiveServerMessage) => {
                            if (message.serverContent?.inputTranscription) {
                                const text = message.serverContent.inputTranscription.text;
                                const words = text.split(/\s+/).filter(Boolean);
                                for (const word of words) {
                                    const lowerWord = word.toLowerCase().replace(/[.,?!]/g, '');
                                    if (FILLER_WORDS.has(lowerWord)) {
                                        setFillerWordCount(prev => new Map(prev).set(lowerWord, (prev.get(lowerWord) || 0) + 1));
                                    }
                                }

                                const now = Date.now();
                                wordCountHistory.current.push({ time: now, count: words.length });
                                wordCountHistory.current = wordCountHistory.current.filter(entry => now - entry.time < 5000); // 5-second window
                                const wordsInWindow = wordCountHistory.current.reduce((sum, entry) => sum + entry.count, 0);
                                const timeSpan = (now - wordCountHistory.current[0].time) / 1000;
                                if (timeSpan > 0) {
                                    setWpm(Math.round((wordsInWindow / timeSpan) * 60));
                                }
                            }

                            if (message.serverContent?.outputTranscription) {
                                setFeedbackTips(prev => [...prev, {id: Date.now(), text: message.serverContent!.outputTranscription!.text}]);
                            }

                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio && outputAudioContext.current) {
                                setIsAiSpeaking(true);
                                nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.current.currentTime);
                                
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext.current, 24000, 1);
                                const sourceNode = outputAudioContext.current.createBufferSource();
                                sourceNode.buffer = audioBuffer;
                                sourceNode.connect(outputAudioContext.current.destination);
                                
                                sourceNode.onended = () => {
                                    aiAudioSources.current.delete(sourceNode);
                                    if(aiAudioSources.current.size === 0) setIsAiSpeaking(false);
                                };

                                sourceNode.start(nextStartTime.current);
                                nextStartTime.current += audioBuffer.duration;
                                aiAudioSources.current.add(sourceNode);
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            console.error('Live session error:', e);
                            setStatus('error');
                        },
                        onclose: () => {
                            console.log('Live session closed.');
                            if(status !== 'ended') setStatus('ended');
                        },
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        systemInstruction: `You are Oratora, a friendly and encouraging public speaking coach. Your topic today is "${topic}". As the user speaks, provide real-time, concise, spoken feedback. Keep your tips very short (1-2 sentences). Focus on pacing, filler words, clarity, and vocal tone. Do not greet the user, just start providing feedback as they speak.`,
                    },
                });

            } catch (err) {
                console.error("Failed to initialize media devices or session:", err);
                setStatus('error');
            }
        };

        initializeSession();

        return () => {
            cleanup();
        };
    }, [topic, cleanup]);
    
    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-background-dark text-white">
            <main className="flex-1 flex flex-col p-4 gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold">{topic}</h1>
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                        <span className="text-sm font-semibold capitalize">{status}</span>
                    </div>
                </div>

                <div className="flex-1 bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
                    {status === 'error' && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4">
                            <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
                            <h2 className="text-2xl font-bold mt-4">Connection Error</h2>
                            <p className="mt-2 text-text-muted-dark max-w-sm">Could not connect to the live coaching service. Please check your internet connection and microphone permissions.</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-auto pt-4">
                    <button onClick={handleBack} className="w-full sm:w-auto h-12 px-6 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors">
                        Exit Practice
                    </button>
                    <button onClick={handleEndAndAnalyze} className="w-full sm:w-auto h-12 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">analytics</span>
                        End & Analyze Session
                    </button>
                </div>
            </main>
            <aside className="w-full lg:w-96 bg-slate-900 border-l border-border-dark flex-shrink-0">
                 <FeedbackDisplay
                    wpm={wpm}
                    volume={volume}
                    fillerWordCount={fillerWordCount}
                    feedbackTips={feedbackTips}
                    isAiSpeaking={isAiSpeaking}
                    feedbackCycleProgress={50} // Placeholder
                    pitchVariation={40} // Placeholder
                    tone={'Neutral'} // Placeholder
                />
            </aside>
            {showAnalysisModal && (
                <LiveAnalysisModal
                    isOpen={showAnalysisModal}
                    onClose={() => setShowAnalysisModal(false)}
                    onSubmit={handleAnalysisSubmit}
                    initialTopic={topic}
                />
            )}
        </div>
    );
};

export default LivePracticeSessionPage;