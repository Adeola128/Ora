import React, { useState, useEffect } from 'react';
import { Type } from '@google/genai';
import { ai } from '../lib/supabaseClient';
import { TrackableGoal, AnalysisReport, GoalMetric } from '../types';

interface GoalModalProps {
    goal: TrackableGoal | null;
    onClose: () => void;
    onSave: (goal: Omit<TrackableGoal, 'id'> & { id?: number | string }) => void;
    onDelete: (goalId: number | string) => void;
    history: AnalysisReport[];
}

const iconOptions = ['flag', 'record_voice_over', 'slideshow', 'videocam', 'speed', 'lightbulb', 'groups', 'self_improvement', 'smart_toy', 'emoji_events', 'military_tech', 'checklist'];

const metricOptions: { label: string, value: GoalMetric, unit: string }[] = [
    { label: 'Overall Score', value: 'overallScore', unit: '%' },
    { label: 'Pacing', value: 'pacing', unit: 'WPM' },
    { label: 'Clarity Score', value: 'fluency', unit: '%' },
    { label: 'Filler Words per Minute', value: 'fillerWordsPerMinute', unit: '/min' },
    { label: 'Intonation Score', value: 'intonation', unit: '%' },
    { label: 'Confidence Score', value: 'sentiment', unit: '%' },
];

const GoalModal: React.FC<GoalModalProps> = ({ goal, onClose, onSave, onDelete, history }) => {
    const [formData, setFormData] = useState<Partial<TrackableGoal>>({
        title: '',
        description: '',
        icon: 'flag',
        progress: 0,
        target: 10,
        unit: 'sessions',
        isCompleted: false,
        trackingType: 'manual',
        metric: 'pacing',
        condition: 'above',
        metricTarget: 150,
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [suggestions, setSuggestions] = useState<{ title: string; description: string; icon: string; }[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    useEffect(() => {
        if (goal) {
            setFormData({ ...goal });
        } else {
            setFormData({
                title: '',
                description: '',
                icon: 'flag',
                progress: 0,
                target: 3,
                unit: 'sessions',
                isCompleted: false,
                trackingType: 'manual',
                metric: 'pacing',
                condition: 'above',
                metricTarget: 150,
            });
        }
    }, [goal]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | number | boolean = value;
        if (type === 'number') {
            processedValue = Number(value);
        } else if (name === 'isCompleted' || (e.target as HTMLInputElement).type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const goalToSave: Omit<TrackableGoal, 'id'> & { id?: string | number } = {
            id: goal?.id,
            title: formData.title || '',
            description: formData.description || '',
            icon: formData.icon || 'flag',
            progress: formData.progress || 0,
            target: formData.target || 1,
            unit: formData.unit || 'sessions',
            isCompleted: formData.isCompleted || false,
            trackingType: formData.trackingType || 'manual',
            metric: formData.metric,
            condition: formData.condition,
            metricTarget: formData.metricTarget
        };

        if (goalToSave.trackingType === 'auto') {
            goalToSave.unit = 'sessions';
        } else {
            // Remove automatic tracking fields for manual goals
            delete (goalToSave as Partial<TrackableGoal>).metric;
            delete (goalToSave as Partial<TrackableGoal>).condition;
            delete (goalToSave as Partial<TrackableGoal>).metricTarget;
        }

        onSave(goalToSave);
    };
    
    const handleGetSuggestions = async () => {
        setIsLoadingSuggestions(true);
        setSuggestions([]);
        setSuggestionError(null);
        try {
            if (history.length === 0) {
                setSuggestionError("No session history found to generate suggestions.");
                throw new Error("No history");
            }
            const historySummary = history.slice(0, 3).map(r => ({
                title: r.title,
                score: r.overallScore,
                strengths: r.feedback.strengths,
                weaknesses: r.feedback.areasToWatch,
            }));
            
            const prompt = `You are an expert public speaking coach. Based on the summary of the user's recent performance below, suggest 3 specific and actionable goals. For each goal, provide a title, a brief description, and a relevant Google Material Symbols icon name from this list: ${iconOptions.join(', ')}. Recent performance summary: ${JSON.stringify(historySummary, null, 2)}. Respond ONLY with a valid JSON array of objects, where each object has "title", "description", and "icon" keys.`;
            
            const suggestionSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        icon: { type: Type.STRING },
                    },
                    required: ['title', 'description', 'icon']
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: suggestionSchema
                }
            });

            const suggestionsResult = JSON.parse(response.text);
            setSuggestions(suggestionsResult);

        } catch (error) {
            console.error("Error fetching goal suggestions:", error);
            if (!suggestionError) { // Don't overwrite specific error messages
                 setSuggestionError(`Could not fetch suggestions. Using defaults.`);
            }
            // Fallback suggestions
            setSuggestions([
                { title: 'Reduce "um"s and "ah"s', description: 'Aim for less than 3 filler words per minute in your next session.', icon: 'chat_error' },
                { title: 'Vary Vocal Tone', description: 'Practice emphasizing key words by changing your pitch and volume.', icon: 'graphic_eq' },
                { title: 'Practice Pacing', description: 'Record a 2-minute speech aiming for a pace of 150 words per minute.', icon: 'speed' },
            ]);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };
    
    const applySuggestion = (suggestion: { title: string; description: string; icon: string; }) => {
        setFormData(prev => ({
            ...prev,
            title: suggestion.title,
            description: suggestion.description,
            icon: iconOptions.includes(suggestion.icon) ? suggestion.icon : 'flag',
        }));
        setSuggestions([]);
    };


    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center animate-fade-in" role="dialog" aria-modal="true">
            <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div onClick={e => e.stopPropagation()} className="relative w-full max-w-2xl rounded-xl bg-card-light dark:bg-card-dark shadow-xl p-6 sm:p-8 m-4 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-start justify-between">
                        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{goal ? 'Edit Goal' : 'Add New Goal'}</h2>
                        <button type="button" onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                            <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark">close</span>
                        </button>
                    </div>

                    {!goal && (
                        <div>
                            <button type="button" onClick={handleGetSuggestions} disabled={isLoadingSuggestions} className="w-full flex items-center justify-center gap-2 h-11 px-4 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50">
                                {isLoadingSuggestions ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                        <span>Thinking...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        <span>Ask Oratora for Suggestions</span>
                                    </>
                                )}
                            </button>
                            {suggestionError && <p className="mt-2 text-sm text-center text-red-500">{suggestionError}</p>}
                            {suggestions.length > 0 && (
                                <div className="mt-4 space-y-2 animate-fade-in">
                                    {suggestions.map((s, i) => (
                                        <button key={i} type="button" onClick={() => applySuggestion(s)} className="w-full text-left p-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                            <p className="font-semibold text-text-light dark:text-text-dark">{s.title}</p>
                                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{s.description}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="space-y-4 pt-4 border-t border-border-light dark:border-border-dark">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Goal Title</label>
                            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Description</label>
                            <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Tracking Type</label>
                            <div className="flex items-center gap-2 p-1 bg-background-light dark:bg-background-dark rounded-full border border-border-light dark:border-border-dark w-min">
                                <button type="button" onClick={() => setFormData(p => ({...p, trackingType: 'manual'}))} className={`px-3 py-1 rounded-full text-sm font-semibold ${formData.trackingType === 'manual' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-text-muted-light dark:text-text-muted-dark'}`}>Manual</button>
                                <button type="button" onClick={() => setFormData(p => ({...p, trackingType: 'auto', unit: 'sessions'}))} className={`px-3 py-1 rounded-full text-sm font-semibold ${formData.trackingType === 'auto' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-text-muted-light dark:text-text-muted-dark'}`}>Automatic</button>
                            </div>
                        </div>

                        {formData.trackingType === 'auto' ? (
                             <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg space-y-4 border border-primary/20 animate-fade-in">
                                 <p className="text-sm text-primary font-semibold flex items-center gap-2"><span className="material-symbols-outlined">smart_toy</span>Configure Automatic Tracking</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-3">
                                        <label htmlFor="metric" className="block text-xs font-medium text-text-light dark:text-text-dark mb-1">Track this metric:</label>
                                        <select name="metric" id="metric" value={formData.metric} onChange={handleChange} className="w-full form-select rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary">
                                            {metricOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                         <label htmlFor="condition" className="block text-xs font-medium text-text-light dark:text-text-dark mb-1">Condition:</label>
                                        <select name="condition" id="condition" value={formData.condition} onChange={handleChange} className="w-full form-select rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary">
                                            <option value="above">Above or Equal To</option>
                                            <option value="below">Below or Equal To</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="metricTarget" className="block text-xs font-medium text-text-light dark:text-text-dark mb-1">Target Value:</label>
                                        <input type="number" name="metricTarget" id="metricTarget" value={formData.metricTarget} onChange={handleChange} required className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label htmlFor="target" className="block text-xs font-medium text-text-light dark:text-text-dark mb-1">For this many sessions:</label>
                                        <input type="number" name="target" id="target" value={formData.target} onChange={handleChange} min="1" required className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="progress" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Current Progress</label>
                                    <input type="number" name="progress" id="progress" value={formData.progress} onChange={handleChange} required className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary" />
                                </div>
                                <div>
                                    <label htmlFor="target" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Target</label>
                                    <input type="number" name="target" id="target" value={formData.target} onChange={handleChange} required className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary" />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Icon</label>
                                <div className="relative">
                                    <select name="icon" value={formData.icon} onChange={handleChange} className="w-full appearance-none form-select rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary pl-10">
                                        {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                    </select>
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted-light dark:text-text-muted-dark">{formData.icon}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="unit" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Unit</label>
                                <input
                                    type="text"
                                    name="unit"
                                    id="unit"
                                    value={formData.trackingType === 'auto' ? 'sessions' : formData.unit}
                                    onChange={handleChange}
                                    placeholder="e.g. sessions, %"
                                    required
                                    disabled={formData.trackingType === 'auto'}
                                    className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                                />
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <input type="checkbox" name="isCompleted" id="isCompleted" checked={formData.isCompleted} onChange={handleChange} className="form-checkbox rounded text-primary focus:ring-primary" />
                            <label htmlFor="isCompleted" className="text-sm font-medium text-text-light dark:text-text-dark">Mark as Completed</label>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-border-light dark:border-border-dark">
                        <div>
                             {goal && (
                                <button type="button" onClick={() => setIsDeleting(!isDeleting)} className="h-11 px-6 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors">
                                    {isDeleting ? 'Cancel' : 'Delete'}
                                </button>
                            )}
                             {isDeleting && goal && (
                                <button type="button" onClick={() => onDelete(goal.id)} className="h-11 px-6 text-sm font-bold text-white bg-red-600 rounded-lg ml-2">Confirm Delete</button>
                             )}
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="h-11 px-6 text-sm font-bold text-text-light dark:text-text-dark bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                            <button type="submit" className="h-11 px-6 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Save Goal</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalModal;