import React, { useEffect, useState } from 'react';
import { generateAnalysisReport, transcribeMediaWithTimestamps } from './lib/google-cloud/speech';
import { AnalysisContext, AnalysisReport, TranscriptionResult } from '../types';

interface ProcessingPageProps {
    media: Blob | File | null;
    context: AnalysisContext | null;
    history: AnalysisReport[];
    onAnalysisComplete: (report: AnalysisReport) => void;
    onAnalysisError: (error: string) => void;
    onRetry: () => void;
    onBackToUpload: () => void;
    error: string | null;
}

const insights = [
    "Great speakers aren't born, they're trained! Every practice makes you stronger.",
    "Did you know? Varying your vocal tone can make your speech 2x more engaging.",
    "The ideal speaking pace is around 150 words per minute. Oratora is checking yours now!",
    "Using strategic pauses can dramatically increase the impact of your key points.",
    "Confidence is key! Your posture and gestures speak volumes before you even say a word."
];


const ProcessingPage: React.FC<ProcessingPageProps> = ({ media, context, history, onAnalysisComplete, onAnalysisError, onRetry, onBackToUpload, error }) => {
    const [progress, setProgress] = useState(0); // From 0 to 5
    const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

    useEffect(() => {
        if (error) return;

        let isCancelled = false;
        
        const startAnalysis = async () => {
            if (!media || !context) {
                onAnalysisError("Missing media or context for analysis.");
                return;
            }

            // A more robust progress simulator that handles cancellation and stale state.
            const simulateProgress = (targetStep: number, duration: number) => {
                return new Promise<void>(resolve => {
                    const progressAtCallTime = progress; // Capture progress from closure for delay calculation
                    const progressDelta = targetStep - progressAtCallTime;
                    
                    if (progressDelta <= 0) {
                        return resolve();
                    }
                    
                    const intervalDelay = duration / progressDelta;
                    const intervalId = setInterval(() => {
                        if (isCancelled) {
                            clearInterval(intervalId);
                            resolve(); // Resolve promise on cancellation to prevent hanging
                            return;
                        }
                        
                        setProgress(p => {
                            if (p >= targetStep) {
                                clearInterval(intervalId);
                                resolve();
                                return p;
                            }
                            
                            const newProgress = p + 1;
                            setCurrentInsightIndex(Math.min(insights.length - 1, newProgress - 1));
                            
                            if (newProgress >= targetStep) {
                                clearInterval(intervalId);
                                resolve();
                            }
                            return newProgress;
                        });
                    }, intervalDelay);
                });
            };

            try {
                // Step 1: Initial warm-up
                await simulateProgress(2, 4000); // Takes 4 seconds to reach step 2
                if (isCancelled) return;
                
                // Step 2: Transcription
                const transcriptionResults = await transcribeMediaWithTimestamps(media);
                if (isCancelled) return;
                
                const transcription = transcriptionResults[0];
                if (!transcription || !transcription.transcript) {
                    throw new Error('Transcription failed to return a result.');
                }
                await simulateProgress(4, 6000); // Takes 6 seconds to reach step 4
                if (isCancelled) return;

                // Step 3: Analysis
                const report = await generateAnalysisReport(transcription, context, media, history);
                if (isCancelled) return;
                
                await simulateProgress(5, 2000); // Takes 2 seconds to finish
                if (isCancelled) return;

                // Step 4: Finalize and complete
                await new Promise(res => setTimeout(res, 1500));
                if (!isCancelled) onAnalysisComplete(report);

            } catch (err) {
                 if (isCancelled) return;
                console.error("Analysis Pipeline Error:", err);
                const errorMsg = err instanceof Error ? err.message : "Sorry, an unknown error occurred during analysis.";
                onAnalysisError(errorMsg);
            }
        };

        startAnalysis();
        
        return () => {
            isCancelled = true;
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [media, context, error, history]);


    if (error) {
        return (
             <div className="absolute inset-0 bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-4 z-50 animate-fade-in">
                <div className="w-48 h-48 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 mb-8">
                    <span className="material-symbols-outlined text-red-500 text-9xl">error_outline</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-center pb-4 text-text-light dark:text-text-dark">Oops! Something went wrong.</h1>
                <p className="text-center text-text-muted-light dark:text-text-muted-dark max-w-md mb-8">{error}</p>
                <div className="flex gap-4">
                    <button onClick={onRetry} className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">Retry Analysis</button>
                    <button onClick={onBackToUpload} className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Back to Upload</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-muted_bg dark:bg-background-dark font-body text-slate-800 dark:text-slate-200 min-h-screen">
            <main className="flex min-h-screen flex-1 flex-col items-center justify-center p-6 text-center">
                <div className="flex max-w-2xl flex-col items-center gap-10">
                    <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-white shadow-xl p-4 border-4 border-mustard">
                        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-muted_bg border border-mustard/50">
                            <div className="h-full w-full bg-center bg-no-repeat bg-cover transform scale-110" data-alt="A friendly, abstract mascot for the Oratora application" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCoI4AMcwIGH0Vi28UGwiTN3qxTt-jX4mDTwYXpL1I2CjC5_QmkxfojGhGq5-Z4H9R8c3p-bvvdUjumEFWEKOTO6sE5ZdhwQT9rR6ohrOAETRyFq4EELSqD6LpxHgJ2aBLxqrUnv8XklWr3fArSOQ6WozL-5fjrfJXs7xiXTqQ7qrVrjW3pbt9TiaQqAarps1lXR26FJUGBLgFAFp8AYaKqUCqPsAyvOLMLEPniAeNUpA5W-ngEV0oHQIRyPE6s0OdY8RSEbhXSp0M")'}}></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-full w-full rounded-full animate-pulse border-4 border-playful_green/30 border-t-playful_green border-r-playful_green" style={{animationDuration: '1.5s'}}></div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-[#111818] dark:text-gray-100 tracking-tight text-4xl font-bold leading-tight font-heading">Oratora is collecting insights for you!</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg">Our AI is on an exciting journey to find those golden nuggets for your speech. Almost there!</p>
                    </div>
                    <div className="flex flex-col items-center gap-6 w-full max-w-lg p-4 bg-white rounded-lg shadow-md border border-playful_green/20">
                        <div className="flex gap-4 items-center justify-between w-full">
                            <p className="text-[#111818] dark:text-gray-200 text-lg font-bold leading-normal font-heading">Your journey so far:</p>
                            <div className="flex items-center gap-2 text-mustard font-semibold">
                                <span className="material-symbols-outlined text-mustard">star</span>
                                <span className="text-xl">{progress}/5 Insights collected!</span>
                            </div>
                        </div>
                        <div className="relative flex items-center w-full justify-between gap-1 h-path-segment-h">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className={`path-segment w-path-segment-w h-full rounded-full bg-primary/30 ${i < progress ? 'completed' : ''} ${i === progress - 1 ? 'active' : ''}`}></div>
                            ))}
                        </div>
                        <div className={`w-full bg-insight-card-bg p-4 rounded-lg shadow-inner border border-playful_green/30 text-left insight-card ${progress > 0 ? 'active' : ''}`}>
                            <p className="text-playful_green font-semibold text-base mb-1 font-heading">Insight Unlocked!</p>
                            <p className="text-slate-700 text-sm">"{insights[currentInsightIndex]}"</p>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal mt-2">Just a few more steps to unlock all your personalized tips!</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProcessingPage;