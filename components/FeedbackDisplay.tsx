
import React, { useState, useEffect } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

interface FeedbackDisplayProps {
    wpm: number;
    volume: number;
    fillerWordCount: Map<string, number>;
    feedbackTips: { id: number; text: string }[];
    isAiSpeaking: boolean;
    feedbackCycleProgress: number;
    pitchVariation: number;
    tone: string;
    bodyLanguage?: {
        posture: string;
        gestures: string;
        eyeContact: string;
    };
}

const getWpmColor = (wpm: number) => {
    if (wpm > 0 && wpm < 120) return 'text-blue-400';
    if (wpm > 180) return 'text-red-400';
    if (wpm > 0) return 'text-green-400';
    return 'text-gray-400';
};

const getWpmLabel = (wpm: number) => {
    if (wpm > 0 && wpm < 120) return 'A bit slow';
    if (wpm > 180) return 'A bit fast';
    if (wpm > 0) return 'Great!';
    return '...';
}

const FillerWordTracker: React.FC<{ fillerWordCount: Map<string, number> }> = ({ fillerWordCount }) => {
    const topFillers = Array.from(fillerWordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return (
        <div className="bg-white/5 p-3 rounded-lg">
            <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2">Filler Words</h3>
            {topFillers.length > 0 ? (
                <div className="space-y-1">
                    {topFillers.map(([word, count]) => (
                        <div key={word} className="flex justify-between items-center text-sm">
                            <span className="font-mono text-gray-300">"{word}"</span>
                            <span className="font-bold text-lg text-yellow-400">{count}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-center text-gray-400 py-2">None detected yet!</p>
            )}
        </div>
    );
};

const FeedbackCycleTimer: React.FC<{ progress: number }> = ({ progress }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-14 h-14">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 52 52">
                <circle className="text-white/10" strokeWidth="4" stroke="currentColor" fill="transparent" r={radius} cx="26" cy="26" />
                <circle
                    className="text-primary"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="26"
                    cy="26"
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">
                    history
                </span>
            </div>
        </div>
    );
};

interface BodyLanguageMetricProps {
    icon: string;
    label: string;
    value: string;
}

const BodyLanguageMetric: React.FC<BodyLanguageMetricProps> = ({ icon, label, value }) => (
    <div className="bg-white/5 p-2 rounded-lg text-center">
        <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
        <p className="text-xs text-text-muted-dark uppercase tracking-wider mt-1">{label}</p>
        <p className="text-sm font-semibold text-white h-5 truncate" title={value}>{value}</p>
    </div>
);


const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ wpm, volume, fillerWordCount, feedbackTips, isAiSpeaking, feedbackCycleProgress, pitchVariation, tone, bodyLanguage }) => {
    const [newestTipId, setNewestTipId] = useState<number | null>(null);

    useEffect(() => {
        if (feedbackTips.length > 0) {
            const latestTip = feedbackTips[feedbackTips.length - 1];
            // Check if the latest tip is different from the currently highlighted one
            if (latestTip.id !== newestTipId) {
                setNewestTipId(latestTip.id);
                // Set a timer to remove the highlight
                const timer = setTimeout(() => {
                    setNewestTipId(currentId => (currentId === latestTip.id ? null : currentId));
                }, 3000); // Highlight for 3 seconds
                return () => clearTimeout(timer);
            }
        }
    }, [feedbackTips, newestTipId]);


    return (
        <div className={`w-full h-full p-4 flex flex-col gap-4 text-white transition-all duration-300 border-l-4 ${isAiSpeaking ? 'border-primary' : 'border-transparent'}`}>
            <div className="flex items-center justify-center gap-3 border-b border-white/10 pb-3">
                 <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
                <h1 className="text-xl font-bold text-primary">Live Coach</h1>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg text-center">
                    <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider">Pacing</h3>
                    <p className={`text-4xl font-bold ${getWpmColor(wpm)} transition-colors`}>{wpm > 0 ? wpm : '-'}</p>
                    <p className={`text-xs font-semibold h-4 ${getWpmColor(wpm)} transition-colors`}>{getWpmLabel(wpm)}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center flex flex-col justify-between">
                     <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider">Volume</h3>
                     <div className="w-full h-2 bg-white/10 rounded-full my-2">
                        <div className="bg-gradient-to-r from-green-500 to-yellow-400 h-full rounded-full transition-all duration-100" style={{ width: `${volume}%` }}></div>
                     </div>
                     <p className="text-xs font-semibold text-gray-400 h-4">{volume > 70 ? 'Strong' : volume > 30 ? 'Good' : volume > 0 ? 'A bit quiet' : '...'}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg text-center">
                    <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider">Pitch Variation</h3>
                    <div className="h-12 w-full flex items-end justify-center pt-2">
                        <div className="w-8 bg-white/10 rounded-t-full relative overflow-hidden">
                             <div className="absolute bottom-0 left-0 w-full bg-purple-400 rounded-t-full transition-all duration-300" style={{ height: `${pitchVariation}%` }}></div>
                        </div>
                    </div>
                     <p className="text-xs font-semibold text-gray-400 h-4">{pitchVariation > 60 ? 'Dynamic' : pitchVariation > 20 ? 'Good' : 'Monotone'}</p>
                </div>
                 <div className="bg-white/5 p-3 rounded-lg text-center">
                    <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider">Tone</h3>
                    <p className="text-2xl font-bold text-primary h-12 flex items-center justify-center truncate" title={tone}>{tone}</p>
                     <p className="text-xs font-semibold text-gray-400 h-4">Detected emotional quality</p>
                </div>
            </div>

            {bodyLanguage && (
                <div className="bg-white/5 p-3 rounded-lg">
                    <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2">Body Language</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <BodyLanguageMetric icon="accessibility_new" label="Posture" value={bodyLanguage.posture} />
                        <BodyLanguageMetric icon="waving_hand" label="Gestures" value={bodyLanguage.gestures} />
                        <BodyLanguageMetric icon="visibility" label="Eye Contact" value={bodyLanguage.eyeContact} />
                    </div>
                </div>
            )}

            <FillerWordTracker fillerWordCount={fillerWordCount} />
            
            <div className="bg-white/5 p-3 rounded-lg flex items-center gap-4">
                <FeedbackCycleTimer progress={feedbackCycleProgress} />
                <div>
                    <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider">Feedback Cycle</h3>
                    <p className="text-sm text-gray-300">Coach provides feedback approx. every 30 seconds.</p>
                </div>
            </div>

            {/* AI Feedback Section */}
            <div className="flex-grow space-y-2 overflow-y-auto pr-1 relative h-1 border-t border-white/10 pt-3">
                <h3 className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-2">Oratora's Tips</h3>
                <TransitionGroup component={null}>
                    {feedbackTips.map(tip => (
                         <CSSTransition
                            key={tip.id}
                            timeout={500}
                            classNames={{
                                enter: 'opacity-0 translate-y-4',
                                enterActive: 'opacity-100 translate-y-0 transition-all duration-500',
                                exit: 'opacity-100',
                                exitActive: 'opacity-0 -translate-x-4 transition-all duration-300',
                            }}
                         >
                            <div className={`p-3 rounded-lg text-sm flex items-start gap-3 border transition-all duration-300 ${tip.id === newestTipId ? 'bg-primary/40 border-primary/60' : 'bg-primary/20 border-primary/40'}`}>
                                <span className="material-symbols-outlined text-primary mt-0.5">lightbulb</span>
                                <span>{tip.text}</span>
                            </div>
                        </CSSTransition>
                    ))}
                </TransitionGroup>
            </div>
        </div>
    );
};

export default FeedbackDisplay;
