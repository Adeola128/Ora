
import React from 'react';
import { AnalysisContext } from '../types';

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

const LivePracticeSessionPage: React.FC<LivePracticeSessionPageProps> = ({ onBackToDashboard }) => {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background-dark p-4 text-center text-white animate-fade-in">
            <div className="w-48 h-48 rounded-full flex items-center justify-center bg-primary/10 mb-8">
                <span className="material-symbols-outlined text-primary text-9xl">podcasts</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Live Practice is Warming Up!</h1>
            <p className="mt-4 max-w-lg text-lg text-text-muted-dark">
                Our real-time coaching feature is under active development and will be launching soon. We're tuning up the AI to give you the best live feedback experience possible.
            </p>
            <button
                onClick={onBackToDashboard}
                className="mt-8 flex h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105"
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default LivePracticeSessionPage;
