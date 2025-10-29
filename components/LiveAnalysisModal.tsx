import React, { useState } from 'react';
import { AnalysisContext } from '../types';

interface LiveAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (context: AnalysisContext) => void;
    initialTopic: string;
}

const goalsOptions = [
    'Improve Confidence',
    'Reduce Filler Words',
    'Better Storytelling',
    'Manage Pace',
    'Engage the Audience',
    'Improve Clarity',
];

const LiveAnalysisModal: React.FC<LiveAnalysisModalProps> = ({ isOpen, onClose, onSubmit, initialTopic }) => {
    const [sessionName, setSessionName] = useState(initialTopic || 'Live Practice Session');
    const [audienceSize, setAudienceSize] = useState<number>(25);
    const [formality, setFormality] = useState<'Formal' | 'Semi-Formal' | 'Casual'>('Semi-Formal');
    const [goals, setGoals] = useState<string[]>([]);

    const handleGoalToggle = (goal: string) => {
        setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
    };

    const handleSubmit = () => {
        const context: AnalysisContext = {
            category: 'Live Practice', // It's always from a live practice
            name: sessionName,
            audienceSize,
            formality,
            duration: 0, // Will be calculated from the audio later
            goals,
        };
        onSubmit(context);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
            <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg rounded-xl bg-card-light dark:bg-card-dark shadow-xl p-6 sm:p-8 m-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Analyze Your Session</h2>
                        <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Provide context for a more accurate analysis.</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark">close</span>
                    </button>
                </div>
                
                <div className="mt-6 space-y-6">
                    {/* Session Name */}
                    <div>
                        <label htmlFor="session-name" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Session Name</label>
                        <input 
                            type="text" 
                            id="session-name" 
                            value={sessionName} 
                            onChange={(e) => setSessionName(e.target.value)} 
                            className="w-full px-4 py-2 border rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    {/* Audience Size */}
                    <div>
                        <label htmlFor="audience-size" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Audience Size: <span className="font-bold">{audienceSize}</span></label>
                        <input id="audience-size" type="range" min="1" max="500" value={audienceSize} onChange={(e) => setAudienceSize(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                    </div>
                    {/* Formality */}
                    <div>
                        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Formality</label>
                        <div className="flex gap-2">
                            {(['Casual', 'Semi-Formal', 'Formal'] as const).map(f => (
                                <button key={f} type="button" onClick={() => setFormality(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formality === f ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{f}</button>
                            ))}
                        </div>
                    </div>
                    {/* Goals */}
                    <div>
                        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">What were your goals for this session?</label>
                        <div className="flex flex-wrap gap-2">
                            {goalsOptions.map(goal => (
                                <button key={goal} type="button" onClick={() => handleGoalToggle(goal)} className={`p-2 border rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${goals.includes(goal) ? 'bg-primary text-white border-primary' : 'border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                    {goals.includes(goal) && <span className="material-symbols-outlined !text-sm">check</span>} {goal}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border-light dark:border-border-dark">
                    <button type="button" onClick={onClose} className="h-11 px-6 text-sm font-bold text-text-light dark:text-text-dark bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="h-11 px-6 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Start Analysis</button>
                </div>
            </div>
        </div>
    );
};

export default LiveAnalysisModal;