import React, { useState } from 'react';
import { AnalysisContext } from '../types';

interface ContextSelectionPageProps {
    onBackToDashboard: () => void;
    onContextSelected: (context: AnalysisContext) => void;
}

const popularContexts = [
    { name: 'Team Meeting', emoji: '🧑‍🤝‍🧑', description: 'Collaborative discussions', category: 'Professional' },
    { name: 'Job Interview', emoji: '🧑‍💼', description: 'Impress a future employer', category: 'Professional' },
    { name: 'Class Presentation', emoji: '🧑‍🏫', description: 'Deliver a great speech', category: 'Academic' },
    { name: 'Wedding Toast', emoji: '🥂', description: 'A heartfelt special day speech', category: 'Personal' }
];

const allCategories = [
    { name: 'Academic', subContexts: ['Lecture', 'Thesis Defense', 'Class Presentation', 'Group Project Update'] },
    { name: 'Professional', subContexts: ['Team Meeting', 'Job Interview', 'Sales Pitch', 'Board Meeting', 'Networking Event', 'Performance Review'] },
    { name: 'Personal', subContexts: ['Wedding Toast', 'Eulogy', 'Maid of Honor Speech', 'Birthday Speech', 'Anniversary Message'] }
];

const goalsOptions = [ 'Improve Confidence', 'Reduce Filler Words', 'Better Storytelling', 'Manage Pace', 'Engage the Audience', 'Improve Clarity'];


const ContextSelectionPage: React.FC<ContextSelectionPageProps> = ({ onBackToDashboard, onContextSelected }) => {
    const [selectedContext, setSelectedContext] = useState<{ category: string, name: string } | null>(null);
    const [audienceSize, setAudienceSize] = useState<number>(25);
    const [formality, setFormality] = useState<'Formal' | 'Semi-Formal' | 'Casual'>('Semi-Formal');
    const [duration, setDuration] = useState<number>(10);
    const [goals, setGoals] = useState<string[]>([]);
    const [script, setScript] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    

    const handleContextSelect = (category: string, name: string) => {
        setSelectedContext({ category, name });
    };

    const handleGoalToggle = (goal: string) => {
        setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScript(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setScript(e.dataTransfer.files[0]);
        }
    };

     const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleContinue = () => {
        if (!selectedContext) return;
        onContextSelected({
            ...selectedContext,
            audienceSize,
            formality,
            duration,
            goals,
            script
        });
    };

    const ConfigurationPanel = () => (
        <div className="space-y-6">
             {/* Parameters */}
            <div>
                <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">Parameters for {selectedContext?.name}</h3>
                <div className="mt-4 space-y-6">
                    <div>
                        <label htmlFor="audience-size" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Audience Size: <span className="font-bold">{audienceSize}</span></label>
                        <input id="audience-size" type="range" min="1" max="500" value={audienceSize} onChange={(e) => setAudienceSize(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Formality</label>
                        <div className="flex gap-2">
                            {(['Casual', 'Semi-Formal', 'Formal'] as const).map(f => (
                                <button key={f} onClick={() => setFormality(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formality === f ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{f}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Estimated Duration (minutes)</label>
                        <input type="number" id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-32 px-4 py-2 border rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">What are your goals for this session?</label>
                        <div className="flex flex-wrap gap-2">
                            {goalsOptions.map(goal => (
                                <button key={goal} onClick={() => handleGoalToggle(goal)} className={`p-2 border rounded-full text-xs font-medium flex items-center justify-center gap-1 transition-colors ${goals.includes(goal) ? 'bg-primary text-white border-primary' : 'border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                    {goals.includes(goal) && <span className="material-symbols-outlined !text-sm">check</span>} {goal}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
             {/* Script Upload */}
            <div>
                <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">Provide Your Script (Optional)</h3>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">Upload your script (.txt) for more accurate feedback on content delivery.</p>
                <div 
                    onDrop={handleDrop}
                    onDragEnter={handleDragEvents}
                    onDragOver={handleDragEvents}
                    onDragLeave={handleDragEvents}
                    className={`relative mt-4 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-primary bg-primary-50 dark:bg-primary-900/50' : 'border-border-light dark:border-border-dark'}`}
                >
                    <span className="material-symbols-outlined text-4xl text-text-muted-light dark:text-text-muted-dark">cloud_upload</span>
                    <p className="mt-2 text-text-light dark:text-text-dark font-semibold">Drag & Drop or <label htmlFor="script-upload" className="cursor-pointer text-primary font-semibold hover:underline">Browse</label></p>
                    <p className="text-text-muted-light dark:text-text-muted-dark text-xs">Plain text file (.txt) accepted</p>
                    <input id="script-upload" type="file" className="hidden" accept=".txt" onChange={handleFileChange} />
                </div>
                {script && (
                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className="material-symbols-outlined text-primary flex-shrink-0">description</span>
                            <span className="text-sm font-medium text-text-light dark:text-text-dark truncate">{script.name}</span>
                        </div>
                        <button onClick={() => setScript(null)} className="text-text-muted-light dark:text-text-muted-dark hover:text-red-500 flex-shrink-0">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                 {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={onBackToDashboard} className="text-text-muted-light dark:text-text-muted-dark text-base font-medium leading-normal hover:text-primary">Dashboard</button>
                    <span className="text-text-muted-dark dark:text-text-muted-dark/50">/</span>
                    <span className="text-primary text-base font-medium leading-normal">Context</span>
                    <span className="text-text-muted-dark dark:text-text-muted-dark/50">/</span>
                    <span className="text-text-muted-light dark:text-text-muted-dark">Upload</span>
                </div>
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-black text-text-light dark:text-text-dark tracking-tight">Select a Context</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-2 text-lg">Choose a preset or define your own for a tailored speech analysis.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Context Selection */}
                    <div className="lg:col-span-7 space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold tracking-tight mb-4">Popular Contexts</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {popularContexts.map(ctx => (
                                    <button key={ctx.name} onClick={() => handleContextSelect(ctx.category, ctx.name)} className={`group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all transform hover:-translate-y-1 shadow-sm ${selectedContext?.name === ctx.name ? 'border-primary bg-primary/10' : 'border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark'}`}>
                                        <div className="text-4xl mb-2">{ctx.emoji}</div>
                                        <p className="font-semibold text-center text-sm">{ctx.name}</p>
                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark text-center">{ctx.description}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                        <section>
                             <h2 className="text-2xl font-bold tracking-tight mb-4">All Categories</h2>
                             <div className="space-y-3">
                                {allCategories.map(cat => (
                                    <details key={cat.name} className="group bg-card-light dark:bg-card-dark rounded-xl shadow-sm transition-all duration-300 overflow-hidden border border-border-light dark:border-border-dark">
                                        <summary className="flex items-center justify-between p-4 cursor-pointer">
                                            <h3 className="text-lg font-medium text-text-light dark:text-text-dark">{cat.name}</h3>
                                            <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">expand_more</span>
                                        </summary>
                                        <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {cat.subContexts.map(sub => (
                                                <label key={sub} className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer ${selectedContext?.name === sub ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                                    <input className="form-radio text-primary focus:ring-primary/50" name="context" type="radio" value={sub} checked={selectedContext?.name === sub} onChange={() => handleContextSelect(cat.name, sub)} />
                                                    <span className="text-text-muted-light dark:text-text-muted-dark">{sub}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Configuration & Script Upload */}
                    <div className="lg:col-span-5">
                         {selectedContext ? (
                            <div className="sticky top-8 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md animate-fade-in border border-border-light dark:border-border-dark">
                                <ConfigurationPanel />
                            </div>
                        ) : (
                             <div className="sticky top-8 flex flex-col items-center justify-center text-center h-[500px] bg-slate-50 dark:bg-card-dark border-2 border-dashed border-border-light dark:border-border-dark rounded-xl p-8">
                                <span className="material-symbols-outlined text-6xl text-primary mb-4">checklist</span>
                                <h3 className="text-xl font-bold text-text-light dark:text-text-dark">Select a Context</h3>
                                <p className="text-text-muted-light dark:text-text-muted-dark mt-2">Choose a context on the left to configure its parameters and proceed.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="flex justify-between items-center p-4 mt-10 border-t border-border-light dark:border-border-dark">
                    <button onClick={onBackToDashboard} className="text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-primary text-sm font-medium">Back to Dashboard</button>
                    <button onClick={handleContinue} disabled={!selectedContext} className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <span>Continue to Upload</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContextSelectionPage;