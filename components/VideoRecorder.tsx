import React, { useState, useRef, useCallback, useEffect } from 'react';

type RecordingStatus = 'idle' | 'getting_devices' | 'permission_denied' | 'preview' | 'countdown' | 'recording' | 'paused' | 'stopped';

interface VideoRecorderProps {
    onRecordingUpdate: (videoBlob: Blob | null) => void;
}

const AudioLevelIndicator: React.FC<{ level: number }> = ({ level }) => (
    <div className="flex items-center gap-1 w-20 h-6">
        {Array.from({ length: 10 }).map((_, i) => (
            <div
                key={i}
                className="w-1 h-full rounded-full transition-all duration-75"
                style={{
                    backgroundColor: level > (i * 10) ? '#4ade80' : 'rgba(255, 255, 255, 0.2)',
                    transform: `scaleY(${Math.max(0.1, (level / 100) * (i / 5) + 0.1)})`
                }}
            ></div>
        ))}
    </div>
);


const VideoRecorder: React.FC<VideoRecorderProps> = ({ onRecordingUpdate }) => {
    const [status, setStatus] = useState<RecordingStatus>('getting_devices');
    const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    const cleanup = useCallback(() => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    }, []);

    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const streamData = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: { echoCancellation: true, noiseSuppression: true }
                });
                streamRef.current = streamData;

                if (videoRef.current) {
                    videoRef.current.srcObject = streamData;
                }
                
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = audioContext;
                const source = audioContext.createMediaStreamSource(streamData);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyserRef.current = analyser;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateAudioLevel = () => {
                    if (analyserRef.current) {
                        analyserRef.current.getByteFrequencyData(dataArray);
                        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                        setAudioLevel(Math.min(100, (avg / 128) * 100));
                    }
                    animationFrameIdRef.current = requestAnimationFrame(updateAudioLevel);
                };
                animationFrameIdRef.current = requestAnimationFrame(updateAudioLevel);

                setStatus('preview');

            } catch (err: any) {
                console.error("Error accessing media devices.", err);
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    setError("Camera and microphone access denied. Please enable them in your browser settings to use this feature.");
                } else {
                    setError("Could not access camera and microphone. Please check if they are connected and not in use by another application.");
                }
                setStatus('permission_denied');
            }
        };
        
        initializeMedia();
        return cleanup;
    }, [cleanup]);

     // Countdown timer
    useEffect(() => {
        if (status === 'countdown') {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setStatus('recording');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [status]);


    // Recording timer
    useEffect(() => {
        let timer: number;
        if (status === 'recording') {
            timer = window.setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [status]);
    
     // MediaRecorder state machine
    useEffect(() => {
        if (status === 'recording' && streamRef.current) {
            if (mediaRecorderRef.current?.state === 'paused') {
                mediaRecorderRef.current.resume();
            } else if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                recordedChunksRef.current = [];
                const options = { mimeType: 'video/webm; codecs=vp9' };
                const mediaRecorder = new MediaRecorder(streamRef.current, MediaRecorder.isTypeSupported(options.mimeType) ? options : { mimeType: 'video/webm' });
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) recordedChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    setVideoBlobUrl(url);
                    onRecordingUpdate(blob);
                };

                mediaRecorder.start(1000);
            }
        } else if (status === 'paused' && mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.pause();
        } else if (status === 'stopped' && mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
            mediaRecorderRef.current.stop();
        }
    }, [status, onRecordingUpdate]);

    const handleStartRecording = () => {
        if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
        setVideoBlobUrl(null);
        onRecordingUpdate(null);
        setCountdown(3);
        setElapsedTime(0);
        setStatus('countdown');
    };

    const handlePauseRecording = () => setStatus('paused');
    const handleResumeRecording = () => setStatus('recording');
    const handleStopRecording = () => setStatus('stopped');
    
    const handleRecordAgain = () => {
        if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
        setVideoBlobUrl(null);
        onRecordingUpdate(null);
        setElapsedTime(0);
        mediaRecorderRef.current = null;
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
        setStatus('preview');
    };
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString();
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const renderContent = () => {
        switch (status) {
            case 'getting_devices':
                return <div className="text-white flex items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>Accessing camera...</div>;
            case 'permission_denied':
                return (
                    <div className="text-center text-white p-4 bg-red-900/50 rounded-lg">
                        <span className="material-symbols-outlined text-4xl text-red-400">no_photography</span>
                        <h3 className="font-bold mt-2">Permission Denied</h3>
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                );
            case 'preview':
            case 'countdown':
            case 'recording':
            case 'paused':
                return (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                );
            case 'stopped':
                return (
                    <video
                        src={videoBlobUrl || undefined}
                        controls
                        playsInline
                        autoPlay
                        className="w-full h-full object-cover"
                    />
                );
            default:
                return null;
        }
    };

    const renderControls = () => {
        switch (status) {
            case 'preview':
                return (
                    <button onClick={handleStartRecording} className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                        <span className="material-symbols-outlined text-4xl">videocam</span>
                    </button>
                );
            case 'recording':
                return (
                    <div className="flex items-center gap-4">
                        <button onClick={handlePauseRecording} className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-transform hover:scale-110">
                            <span className="material-symbols-outlined text-4xl">pause</span>
                        </button>
                        <button onClick={handleStopRecording} className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <span className="material-symbols-outlined text-4xl">stop</span>
                        </button>
                    </div>
                );
            case 'paused':
                return (
                     <div className="flex items-center gap-4">
                        <button onClick={handleResumeRecording} className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-transform hover:scale-110">
                            <span className="material-symbols-outlined text-4xl">play_arrow</span>
                        </button>
                        <button onClick={handleStopRecording} className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
                            <span className="material-symbols-outlined text-4xl">stop</span>
                        </button>
                    </div>
                );
            case 'stopped':
                 return (
                     <button onClick={handleRecordAgain} className="px-8 py-4 bg-slate-200 dark:bg-slate-700 text-text-light dark:text-text-dark font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined">refresh</span>
                        Record Again
                    </button>
                 );
            default:
                return null;
        }
    }
    
    const getStatusText = () => {
        switch (status) {
            case 'recording':
                return `REC ${formatTime(elapsedTime)}`;
            case 'paused':
                return `PAUSED ${formatTime(elapsedTime)}`;
            case 'preview':
                return 'PREVIEW';
            case 'stopped':
                 return 'REVIEWING';
            default:
                return '';
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center gap-4 h-full">
            <style>{`
                @keyframes countdown-pulse {
                    0% { transform: scale(1); opacity: 1; }
                    80%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
            <div className={`w-full aspect-video bg-slate-900 rounded-xl overflow-hidden relative shadow-inner border-2 flex items-center justify-center transition-colors ${status === 'recording' ? 'border-red-500 animate-pulse-border' : 'border-transparent'}`}>
                {renderContent()}

                {status === 'countdown' && countdown > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-9xl font-bold text-white" style={{ animation: 'countdown-pulse 1s ease-out infinite' }}>{countdown}</div>
                    </div>
                )}
                
                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center justify-between">
                         <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity ${status === 'recording' ? 'bg-red-500' : 'bg-black/50'}`}>
                            {status === 'recording' && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                            <span>{getStatusText()}</span>
                        </div>
                    </div>
                </div>
                 <div className="absolute bottom-3 right-3">
                    <AudioLevelIndicator level={audioLevel} />
                 </div>
            </div>
            
            {status === 'stopped' && (
                <div className="w-full p-3 bg-primary/10 rounded-lg flex items-center justify-center gap-3 text-sm font-medium text-primary animate-fade-in">
                    <span className="material-symbols-outlined">check_circle</span>
                    Your recording is ready. Click "Analyze Speech" below to continue.
                </div>
            )}

            <div className="flex items-center justify-center gap-4 h-20">
                 {renderControls()}
            </div>
        </div>
    );
};

export default VideoRecorder;
