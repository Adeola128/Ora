import React, { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import AudioWaveform from './AudioWaveform';

interface Step3BaselineProps {
    onBack: () => void;
    onSubmit: (recording: Blob | null) => void;
}

const RECORD_DURATION = 30;

const prompts = [
    "What's a movie you recently watched and what did you think of it?",
    "Describe your favorite meal in delicious detail.",
    "If you could have any superpower, what would it be and why?",
    "Talk about a place you'd love to travel to someday.",
];

const Step3Baseline: React.FC<Step3BaselineProps> = ({ onBack, onSubmit }) => {
    const { status, startRecording, stopRecording, audioBlob, resetRecording, audioData } = useAudioRecorder();
    const [timeLeft, setTimeLeft] = useState(RECORD_DURATION);
    const [showPrompts, setShowPrompts] = useState(false);
    
    const timerRef = useRef<number | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    
    useEffect(() => {
        if (status === 'recording') {
            setTimeLeft(RECORD_DURATION);
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        stopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);
    
    useEffect(() => {
        if (audioBlob && audioPlayerRef.current) {
            audioPlayerRef.current.src = URL.createObjectURL(audioBlob);
        }
    }, [audioBlob]);

    const handleRecordClick = () => {
        if (status === 'recording') {
            stopRecording();
        } else {
            resetRecording();
            startRecording();
        }
    };
    
    const handleRetake = () => {
        resetRecording();
        setTimeLeft(RECORD_DURATION);
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.src = "";
        }
    };

    const isFinished = status === 'stopped' && audioBlob;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (timeLeft / RECORD_DURATION) * circumference;

    return (
        <div className="flex flex-col items-center text-center animate-fade-in">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark md:text-4xl lg:text-5xl">
                Let's get a baseline
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-text-secondary-light dark:text-text-secondary-dark">
                Talk about your day or a hobby for 30 seconds. This helps Oratora understand your natural speaking style.
            </p>
             <button onClick={() => setShowPrompts(!showPrompts)} className="mt-2 text-sm font-semibold text-primary hover:underline">
                {showPrompts ? 'Hide prompts' : 'Stuck? Get a prompt'}
            </button>
            {showPrompts && (
                <div className="mt-4 max-w-xl w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-left text-sm space-y-2 animate-fade-in-up-small">
                    <p className="font-bold">Try one of these:</p>
                    {prompts.map((p, i) => <p key={i} className="text-text-secondary-light dark:text-text-secondary-dark">- {p}</p>)}
                </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-8">
                <div className="relative size-52 flex items-center justify-center">
                    <svg className="absolute inset-0 size-full" viewBox="0 0 200 200">
                        <circle className="text-border-light dark:text-border-dark" cx="100" cy="100" fill="transparent" r={radius} stroke="currentColor" strokeWidth="10"></circle>
                        <circle
                            className="text-primary -rotate-90 origin-center transition-all duration-1000"
                            cx="100"
                            cy="100"
                            fill="transparent"
                            r={radius}
                            stroke="currentColor"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            strokeWidth="10"
                        ></circle>
                    </svg>
                    <div className="relative z-10 flex flex-col">
                        <span className="font-display text-5xl font-bold text-text-primary-light dark:text-text-primary-dark">{timeLeft}</span>
                        <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">seconds</span>
                    </div>
                </div>

                <div className="w-full max-w-md h-20">
                     <AudioWaveform audioData={audioData} color="#06f9e0" />
                </div>
                
                {!isFinished ? (
                    <button
                        onClick={handleRecordClick}
                        className={`flex size-20 transform cursor-pointer items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 ease-in-out hover:scale-105 ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-primary'} `}
                    >
                        <span className="material-symbols-outlined text-5xl">{status === 'recording' ? 'stop' : 'mic'}</span>
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-4 animate-fade-in">
                        <audio ref={audioPlayerRef} controls className="w-full max-w-sm" />
                        <button onClick={handleRetake} className="mt-2 flex h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-border-light dark:border-border-dark bg-transparent px-8 font-bold text-text-primary-light dark:text-text-primary-dark transition-all duration-200 ease-in-out hover:scale-105 hover:bg-primary/10">
                            <span className="truncate">Record Again</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-16 flex w-full flex-col-reverse items-center justify-between gap-4 sm:flex-row">
                <button onClick={onBack} className="flex h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-transparent px-8 font-bold text-text-secondary-light transition-all duration-200 ease-in-out hover:bg-gray-500/10 dark:text-text-secondary-dark hover:dark:bg-white/10">
                    <span className="truncate">Back</span>
                </button>
                <div className="flex w-full flex-col-reverse items-center gap-4 sm:w-auto sm:flex-row">
                    <button onClick={() => onSubmit(null)} className="font-semibold text-text-secondary-light dark:text-text-secondary-dark transition-colors hover:text-primary dark:hover:text-primary text-sm sm:order-first px-4 py-2">
                        Skip for now
                    </button>
                    <button onClick={() => onSubmit(audioBlob)} disabled={!isFinished} className="flex h-12 w-full transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                        <span className="truncate">Finish & Analyze</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step3Baseline;
