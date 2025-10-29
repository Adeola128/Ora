import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { ai } from '../lib/supabaseClient';
import { decode, createBlob, decodeAudioData, blobToBase64 } from './lib/audioUtils';
import { AnalysisContext } from '../types';
import FeedbackDisplay from './FeedbackDisplay';
import LiveAnalysisModal from './LiveAnalysisModal';

interface SessionSummaryData {
    duration: number;
    feedback: string[];
    fillerWords: Map<string, number>;
    avgWpm: number;
}

interface LivePracticeSessionPageProps {
    topic: string;
    onEndSession: (summary: SessionSummaryData) => void;
    onBackToDashboard: () => void;
    onAnalyzeLiveSession: (audio: Blob, context: AnalysisContext) => void;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString();
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface SessionSummaryProps {
    summary: SessionSummaryData;
    onBackToDashboard: () => void;
    onAnalyzeClick: () => void;
    isAnalyzing: boolean;
    hasRecording: boolean;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ summary, onBackToDashboard, onAnalyzeClick, isAnalyzing, hasRecording }) => {
    const { duration, feedback, fillerWords, avgWpm } = summary;
    const topFillers = Array.from(fillerWords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
        
    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center bg-background-dark p-4 font-display text-white animate-fade-in">
             <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0YsacrjJzddx_7Gz2gqJ_6FyKCQDvS_VokPgASdmy5CpQ7C0pKBx0mGH0i1jqp--FN14sk_a0pUp2jShhhB5nBOmH6k6K9cQ_iOWG0wspDxHLsxBX7f5T0hBgI2fWmihqQ8NzHfIH2_YowPP1JQnwuQ_Nkkn6XL5UAnxYOHweb8GoSfeyaUBVnvxO6l_TZitGm_YVVvUSSXzfP3k7spudMh6SMHM6cgkNRpvA7CwPMFX7pjOtBK8GQC4CdqwfIEsiuZqUWYK0HWo')" }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
            </div>
            <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
                <div className="mb-8">
                    <span className="material-symbols-outlined text-7xl text-primary">task_alt</span>
                </div>
                <h1 className="text-4xl font-bold">Session Complete!</h1>
                <p className="mt-2 text-lg text-text-muted-dark">Great work on your practice session.</p>

                <div className="my-8 w-full rounded-xl bg-card-dark/50 border border-border-dark p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-border-dark text-center">
                        <div className="px-4">
                            <p className="text-sm text-text-muted-dark">Duration</p>
                            <p className="text-3xl font-bold text-primary">{formatTime(duration)}</p>
                        </div>
                        <div className="px-4">
                            <p className="text-sm text-text-muted-dark">Avg. Pace</p>
                            <p className="text-3xl font-bold text-primary">{avgWpm > 0 ? avgWpm : 'N/A'}<span className="text-base"> WPM</span></p>
                        </div>
                        <div className="px-4 col-span-2 md:col-span-1 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-dark">
                            <p className="text-sm text-text-muted-dark">Total Filler Words</p>
                            <p className="text-3xl font-bold text-primary">{Array.from(fillerWords.values()).reduce((a: number, b: number) => a + b, 0)}</p>
                        </div>
                    </div>
                </div>
                
                <div className="w-full grid md:grid-cols-2 gap-8 text-left">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Key Feedback from Oratora</h2>
                        {feedback.length > 0 ? (
                            <div className="space-y-3">
                                {feedback.map((tip, index) => (
                                    <div key={index} className="flex items-start gap-3 rounded-lg bg-card-dark/50 p-3">
                                        <span className="material-symbols-outlined text-primary mt-1">lightbulb</span>
                                        <p className="text-text-dark">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center rounded-lg bg-card-dark/50 p-6 h-full flex items-center justify-center">
                                <p className="text-text-muted-dark">No specific tips were given this session. Keep up the great work!</p>
                            </div>
                        )}
                    </div>
                     <div>
                        <h2 className="text-xl font-semibold mb-4">Top Filler Words</h2>
                        {topFillers.length > 0 ? (
                            <div className="space-y-3">
                                {topFillers.map(([word, count]) => (
                                     <div key={word} className="flex items-center justify-between rounded-lg bg-card-dark/50 p-3">
                                        <span className="font-mono text-lg text-gray-300">"{word}"</span>
                                        <span className="text-2xl font-bold text-yellow-400">{count} times</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center rounded-lg bg-card-dark/50 p-6 h-full flex items-center justify-center">
                                <p className="text-text-muted-dark">No filler words detected. Fantastic job!</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <button onClick={onBackToDashboard} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-8 bg-card-dark/60 text-white border border-border-dark text-base font-bold transition-transform hover:scale-105">
                        <span className="truncate">Back to Dashboard</span>
                    </button>
                    <button onClick={onAnalyzeClick} disabled={!hasRecording || isAnalyzing} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-8 bg-primary text-white text-base font-bold transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                       {isAnalyzing ? (
                           <>
                                <LoadingSpinner />
                                <span>Analyzing...</span>
                           </>
                       ) : (
                           <>
                                <span className="material-symbols-outlined mr-2">analytics</span>
                                <span className="truncate">Get Full Analysis</span>
                           </>
                       )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper function for pitch detection
const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
    const SIZE = buf.length;
    let max_samples = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;

    for (let i = 0; i < SIZE; i++) {
        const val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Not enough signal

    let lastCorrelation = 1;
    for (let offset = 70; offset < max_samples; offset++) {
        let correlation = 0;
        for (let i = 0; i < max_samples; i++) {
            correlation += Math.abs(buf[i] - buf[i + offset]);
        }
        correlation = 1 - (correlation / max_samples);
        if (correlation > 0.9 && correlation > lastCorrelation) {
            foundGoodCorrelation = true;
            if (correlation > best_correlation) {
                best_correlation = correlation;
                best_offset = offset;
            }
        } else if (foundGoodCorrelation) {
            return sampleRate / best_offset;
        }
        lastCorrelation = correlation;
    }
    if (best_correlation > 0.8) {
        return sampleRate / best_offset;
    }
    return -1;
};

// Function declarations for AI
const updateToneFunction: FunctionDeclaration = {
    name: 'updateTone',
    parameters: {
        type: Type.OBJECT,
        description: "Updates the UI with the detected vocal tone.",
        properties: {
            tone: { type: Type.STRING, description: 'The detected vocal tone (e.g., Energetic, Monotone, Confident, Anxious).' },
        },
        required: ['tone'],
    },
};

const updateBodyLanguageFunction: FunctionDeclaration = {
    name: 'updateBodyLanguage',
    description: "Updates the UI with body language feedback.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            posture: { type: Type.STRING, description: 'Feedback on posture (e.g., Upright, Slumped, Confident).' },
            gestures: { type: Type.STRING, description: 'Feedback on gestures (e.g., Effective, Limited, Distracting).' },
            eyeContact: { type: Type.STRING, description: 'Feedback on eye contact (e.g., Good, Wandering, Fixed).' },
        },
    },
};

type SessionStatus = 'connecting' | 'active' | 'paused' | 'stopped' | 'error';

const LivePracticeSessionPage: React.FC<LivePracticeSessionPageProps> = ({ topic, onEndSession, onBackToDashboard, onAnalyzeLiveSession }) => {
    // Session and UI State
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>('connecting');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    
    // AI Feedback State
    const [wpm, setWpm] = useState(0);
    const [volume, setVolume] = useState(0);
    const [fillerWords, setFillerWords] = useState<Map<string, number>>(new Map());
    const [feedbackTips, setFeedbackTips] = useState<{ id: number; text: string }[]>([]);
    const [feedbackCycleProgress, setFeedbackCycleProgress] = useState(0);
    const [pitchVariation, setPitchVariation] = useState(0);
    const [tone, setTone] = useState('...');
    const [bodyLanguage, setBodyLanguage] = useState({ posture: '...', gestures: '...', eyeContact: '...' });

    // Technical State
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const frameIntervalRef = useRef<number | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const inputNodeRef = useRef<GainNode | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextAudioStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    const recordedChunksRef = useRef<Blob[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const finalAudioBlobRef = useRef<Blob | null>(null);
    const wordTimestampsRef = useRef<{ word: string, time: number }[]>([]);
    const pitchHistoryRef = useRef<number[]>([]);

    // Callbacks for Gemini Live
    const onOpen = useCallback(() => {
        console.log('Live session opened.');
        setSessionStatus('active');
    }, []);

    const onMessage = useCallback(async (message: LiveServerMessage) => {
        // Handle audio output from AI
        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioData && outputAudioContextRef.current && outputNodeRef.current) {
            setIsAiSpeaking(true);
            const outputCtx = outputAudioContextRef.current;
            nextAudioStartTimeRef.current = Math.max(nextAudioStartTimeRef.current, outputCtx.currentTime);
            const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNodeRef.current);
            source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setIsAiSpeaking(false);
            });
            source.start(nextAudioStartTimeRef.current);
            nextAudioStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
        }
        
        // Handle function calls
        if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
                console.log('Function call received:', fc.name, fc.args);
                if (fc.name === 'updateTone' && fc.args.tone) {
                    setTone(fc.args.tone as string);
                } else if (fc.name === 'updateBodyLanguage') {
                    setBodyLanguage(prev => ({ ...prev, ...fc.args }));
                }

                // IMPORTANT: Respond to the model that the function was called.
                sessionPromiseRef.current?.then((session) => {
                    session.sendToolResponse({
                        functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { result: "ok" },
                        }
                    });
                });
            }
        }

        const outputTranscription = message.serverContent?.outputTranscription?.text;
        if(outputTranscription) {
            setFeedbackTips(prev => [...prev, { id: Date.now(), text: outputTranscription }]);
        }

        const inputTranscription = message.serverContent?.inputTranscription?.text;
        if (inputTranscription) {
             const words = inputTranscription.toLowerCase().split(/\s+/).filter(Boolean);
             words.forEach(word => {
                wordTimestampsRef.current.push({ word, time: Date.now() });
                if (['um', 'uh', 'like', 'you know', 'so', 'actually'].includes(word)) {
                    setFillerWords(prev => new Map(prev).set(word, (prev.get(word) || 0) + 1));
                }
             });
        }

    }, []);

    const onError = useCallback((e: ErrorEvent) => {
        console.error('Live session error:', e);
        setSessionStatus('error');
    }, []);

    const onClose = useCallback(() => {
        console.log('Live session closed.');
        setSessionStatus('stopped');
    }, []);
    
    // Setup and teardown effect
    useEffect(() => {
        const systemInstruction = `You are Oratora, an expert public speaking coach. Your user is practicing a speech on "${topic}". A video stream of the user is also being provided. Your role is to provide real-time, interactive coaching. Listen to the user speak and watch their body language. Approximately every 30 seconds, provide concise, spoken audio feedback based on their performance in that interval. Analyze their pacing, filler words, clarity, tone, posture, eye contact, and gestures. After giving spoken feedback, you can ask a brief question to keep it conversational. CRITICAL: In addition to spoken feedback, you MUST use the provided functions to send structured data. When you have feedback on their tone, call 'updateTone'. When you have feedback on their body language, call 'updateBodyLanguage'. Call these functions as soon as you have a confident analysis, even between the 30-second spoken feedback intervals.`;

        const setup = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                micStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                inputAudioContextRef.current = inputCtx;
                const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                outputAudioContextRef.current = outputCtx;
                inputNodeRef.current = inputCtx.createGain();
                outputNodeRef.current = outputCtx.createGain();
                outputNodeRef.current.connect(outputCtx.destination);
                
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) recordedChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    finalAudioBlobRef.current = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                };

                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: { onopen: onOpen, onmessage: onMessage, onerror: onError, onclose: onClose },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                        systemInstruction,
                        outputAudioTranscription: {},
                        inputAudioTranscription: {},
                        tools: [{ functionDeclarations: [updateToneFunction, updateBodyLanguageFunction] }],
                    },
                });

                const source = inputCtx.createMediaStreamSource(stream);
                const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = scriptProcessor;

                scriptProcessor.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0);
                    
                    // Volume calculation
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                    const rms = Math.sqrt(sum / inputData.length);
                    const volume = Math.min(100, Math.floor(rms * 350));
                    setVolume(volume);

                    // Pitch calculation
                    const pitch = autoCorrelate(inputData, inputCtx.sampleRate);
                    if (pitch !== -1) pitchHistoryRef.current.push(pitch);

                    // Send to Gemini
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputNodeRef.current);
                inputNodeRef.current.connect(inputCtx.destination);
                inputNodeRef.current.gain.value = 0;
                
                mediaRecorderRef.current.start();
                
                // Start sending video frames
                const canvasEl = document.createElement('canvas');
                const ctx = canvasEl.getContext('2d');
                frameIntervalRef.current = window.setInterval(() => {
                    if (videoRef.current && ctx) {
                        canvasEl.width = videoRef.current.videoWidth;
                        canvasEl.height = videoRef.current.videoHeight;
                        ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
                        canvasEl.toBlob(async (blob) => {
                            if (blob) {
                                const base64Data = await blobToBase64(blob);
                                sessionPromiseRef.current?.then((session) => {
                                    session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                                });
                            }
                        }, 'image/jpeg', 0.8);
                    }
                }, 500); // Send 2 frames per second
                
            } catch (err) {
                console.error('Setup failed:', err);
                setSessionStatus('error');
            }
        };

        setup();

        return () => {
            micStreamRef.current?.getTracks().forEach(track => track.stop());
            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
            inputAudioContextRef.current?.close();
            outputAudioContextRef.current?.close();
            sessionPromiseRef.current?.then(session => session.close());
            mediaRecorderRef.current?.stop();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topic]);

    // Timers for UI updates
    useEffect(() => {
        let timer: number, wpmInterval: number, feedbackCycleInterval: number, pitchInterval: number;

        if (sessionStatus === 'active') {
            timer = window.setInterval(() => setElapsedTime((prev: number) => prev + 1), 1000);
            wpmInterval = window.setInterval(() => { /* ... */ }, 2000);
            feedbackCycleInterval = window.setInterval(() => setFeedbackCycleProgress(prev => (prev >= 100 ? 0 : prev + (100 / 300))), 100);
            
            pitchInterval = window.setInterval(() => {
                if (pitchHistoryRef.current.length > 1) {
                    const pitches = pitchHistoryRef.current;
                    const mean = pitches.reduce((a, b) => a + b) / pitches.length;
                    const stdDev = Math.sqrt(pitches.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / pitches.length);
                    // Normalize stdDev to 0-100 range. Typical speech std dev is around 20-60 Hz.
                    setPitchVariation(Math.min(100, (stdDev / 50) * 100));
                } else {
                    setPitchVariation(0);
                }
                pitchHistoryRef.current = [];
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
            if (wpmInterval) clearInterval(wpmInterval);
            if (feedbackCycleInterval) clearInterval(feedbackCycleInterval);
            if (pitchInterval) clearInterval(pitchInterval);
        };
    }, [sessionStatus]);

    const handleEndSession = () => {
        setSessionStatus('stopped');
        mediaRecorderRef.current?.stop();
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
        sessionPromiseRef.current?.then(session => session.close());

        const totalWords = wordTimestampsRef.current.length;
        const avgWpm = elapsedTime > 0 ? Math.round((totalWords / elapsedTime) * 60) : 0;
        
        const summaryData: SessionSummaryData = {
            duration: elapsedTime,
            feedback: feedbackTips.map(f => f.text),
            fillerWords: fillerWords,
            avgWpm: avgWpm
        };
        onEndSession(summaryData);
    };
    
    const handleAnalyzeSession = (context: AnalysisContext) => {
        if (finalAudioBlobRef.current) {
            onAnalyzeLiveSession(finalAudioBlobRef.current, { ...context, duration: elapsedTime });
        }
    };
    
    if (sessionStatus === 'stopped') {
        const totalWords = wordTimestampsRef.current.length;
        const avgWpm = elapsedTime > 0 ? Math.round((totalWords / elapsedTime) * 60) : 0;
        return <SessionSummary summary={{ duration: elapsedTime, feedback: feedbackTips.map(f => f.text), fillerWords, avgWpm }} onBackToDashboard={onBackToDashboard} onAnalyzeClick={() => setIsAnalysisModalOpen(true)} isAnalyzing={false} hasRecording={!!finalAudioBlobRef.current} />;
    }
    
    if (sessionStatus === 'connecting') {
        return <div className="flex h-screen w-full items-center justify-center bg-background-dark text-white"><LoadingSpinner /> Connecting to Live Coach...</div>
    }
    
    if (sessionStatus === 'error') {
         return <div className="flex flex-col h-screen w-full items-center justify-center bg-background-dark text-white gap-4"><span className="material-symbols-outlined text-red-500 text-5xl">error</span><p>Connection failed. Please check your microphone permissions and try again.</p><button onClick={onBackToDashboard} className="px-4 py-2 bg-primary text-white rounded-lg">Back to Dashboard</button></div>
    }

    return (
        <>
            <div className="flex h-screen w-full bg-background-dark font-display">
                {/* Main Content (Video/Avatar) */}
                <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
                    <div className="absolute top-6 left-6 z-10">
                        <h1 className="text-2xl font-bold text-white">{topic}</h1>
                        <div className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white bg-red-500 mt-2">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                            <span>REC {formatTime(elapsedTime)}</span>
                        </div>
                    </div>
                    
                    <div className="relative w-full max-w-4xl aspect-video rounded-xl bg-black overflow-hidden shadow-2xl shadow-primary/20">
                         <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
                    </div>
                    
                    {/* Controls */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full bg-black/30 backdrop-blur-md p-3 border border-white/10 z-10">
                        <button onClick={() => setIsMuted(!isMuted)} className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center transition-colors hover:bg-white/30">
                            <span className="material-symbols-outlined text-3xl">{isMuted ? 'mic_off' : 'mic'}</span>
                        </button>
                         <button onClick={handleEndSession} className="w-20 h-14 rounded-full bg-red-500 text-white flex items-center justify-center transition-colors hover:bg-red-600">
                            <span className="material-symbols-outlined text-3xl">call_end</span>
                        </button>
                        <button className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center transition-colors hover:bg-white/30">
                            <span className="material-symbols-outlined text-3xl">pause</span>
                        </button>
                    </div>
                </main>

                {/* Right Sidebar (Feedback) */}
                <aside className="w-96 bg-card-dark/50 border-l border-border-dark">
                    <FeedbackDisplay
                        wpm={wpm}
                        volume={volume}
                        fillerWordCount={fillerWords}
                        feedbackTips={feedbackTips}
                        isAiSpeaking={isAiSpeaking}
                        feedbackCycleProgress={feedbackCycleProgress}
                        pitchVariation={pitchVariation}
                        tone={tone}
                        bodyLanguage={bodyLanguage}
                    />
                </aside>
            </div>
            <LiveAnalysisModal
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
                onSubmit={handleAnalyzeSession}
                initialTopic={topic}
            />
        </>
    );
};

export default LivePracticeSessionPage;