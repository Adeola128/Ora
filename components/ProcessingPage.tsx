import React, { useEffect, useState } from 'react';
import { generateAnalysisReport } from './lib/google-cloud/speech';
import { AnalysisContext, AnalysisReport } from '../types';

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

const progressSteps = [
  'Warming up the AI coach...',
  'Securely uploading your media...',
  'Transcribing your speech to text...',
  'Analyzing vocal patterns & delivery...',
  'Generating personalized feedback...',
  'Finalizing your report...',
];


const ProcessingPage: React.FC<ProcessingPageProps> = ({ media, context, onAnalysisComplete, onAnalysisError, onRetry, onBackToUpload, error }) => {
    const [progress, setProgress] = useState(0);
    const [currentInsight, setCurrentInsight] = useState(insights[0]);

    useEffect(() => {
        if (error) return;

        let isCancelled = false;
        
        const startAnalysis = async () => {
            if (!media || !context) {
                onAnalysisError("Missing media or context for analysis.");
                return;
            }

            // This interval simulates progress for the user, making the wait more engaging.
            // The actual API call runs in parallel.
            const progressInterval = setInterval(() => {
                if (isCancelled) {
                    clearInterval(progressInterval);
                    return;
                }
                setProgress(p => {
                    const newProgress = p + 1;
                    if (newProgress >= progressSteps.length -1) {
                        clearInterval(progressInterval);
                        return p;
                    }
                    setCurrentInsight(insights[newProgress % insights.length]);
                    return newProgress;
                });
            }, 3500); // Advance progress every 3.5 seconds

            try {
                // The single, powerful API call that handles everything.
                const report = await generateAnalysisReport(media, context);
                
                if (!isCancelled) {
                    clearInterval(progressInterval);
                    setProgress(progressSteps.length); // Complete progress
                    await new Promise(res => setTimeout(res, 1000)); // Brief pause on completion
                    onAnalysisComplete(report);
                }

            } catch (err) {
                 if (isCancelled) return;
                clearInterval(progressInterval);
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
    }, [media, context, error]);


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
    
    const progressPercentage = Math.min(100, (progress / (progressSteps.length - 1)) * 100);

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
                        <h2 className="text-[#111818] dark:text-gray-100 tracking-tight text-4xl font-bold leading-tight font-heading">{progressSteps[progress] || 'Finalizing...'}</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md text-lg">Our AI is on an exciting journey to find those golden nuggets for your speech. Almost there!</p>
                    </div>
                    <div className="flex flex-col items-center gap-6 w-full max-w-lg p-4 bg-white rounded-lg shadow-md border border-playful_green/20">
                        <div className="flex gap-4 items-center justify-between w-full">
                            <p className="text-[#111818] dark:text-gray-200 text-lg font-bold leading-normal font-heading">Analysis Progress</p>
                             <div className="flex items-center gap-2 text-mustard font-semibold">
                                <span className="material-symbols-outlined text-mustard">star</span>
                                <span className="text-xl">{Math.round(progressPercentage)}%</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                           <div className="bg-playful_green h-2.5 rounded-full transition-all duration-1000 ease-linear" style={{width: `${progressPercentage}%`}}></div>
                        </div>

                        <div className={`w-full bg-insight-card-bg p-4 rounded-lg shadow-inner border border-playful_green/30 text-left insight-card ${progress > 0 ? 'active' : ''}`}>
                            <p className="text-playful_green font-semibold text-base mb-1 font-heading">Insight Unlocked!</p>
                            <p className="text-slate-700 text-sm">"{currentInsight}"</p>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal mt-2">Just a few more steps to unlock all your personalized tips!</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProcessingPage;