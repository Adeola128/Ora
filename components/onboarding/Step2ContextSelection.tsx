import React, { useState } from 'react';
import { SpeakingContextType } from '../../types';

interface Step2ContextSelectionProps {
    onBack: () => void;
    onSubmit: (context: SpeakingContextType) => void;
}

const contextOptions: { title: string; icon: string; value: SpeakingContextType }[] = [
    { title: 'Presentation', icon: 'slideshow', value: 'presentation' },
    { title: 'Job Interview', icon: 'work', value: 'interview' },
    { title: 'Team Meeting', icon: 'groups', value: 'meeting' },
    { title: 'Keynote Speech', icon: 'campaign', value: 'keynote' },
    { title: 'Sales Pitch', icon: 'point_of_sale', value: 'sales_pitch' },
    { title: 'Wedding Toast', icon: 'celebration', value: 'toast' },
];

const Step2ContextSelection: React.FC<Step2ContextSelectionProps> = ({ onBack, onSubmit }) => {
    const [selectedContext, setSelectedContext] = useState<SpeakingContextType | null>(null);

    const handleSubmit = () => {
        if (selectedContext) {
            onSubmit(selectedContext);
        }
    };

    return (
        <div className="flex flex-col items-center text-center animate-fade-in">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark md:text-4xl lg:text-5xl">
                Where do you usually speak?
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-text-secondary-light dark:text-text-secondary-dark">
                This helps us tailor your feedback. Choose the context that fits you best.
            </p>
            
            <div className="mt-12 grid w-full grid-cols-2 gap-6 sm:grid-cols-3">
                {contextOptions.map((context) => {
                     const isSelected = selectedContext === context.value;
                     return (
                        <button
                            key={context.value}
                            onClick={() => setSelectedContext(context.value)}
                            className={`group flex h-full flex-col items-center justify-start gap-3 rounded-xl border-2 p-6 text-center shadow-sm transition-all duration-200 transform hover:-translate-y-1 ${isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary/50' : 'border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark'}`}
                        >
                            <div className={`flex size-16 items-center justify-center rounded-full transition-colors ${isSelected ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                <span className={`material-symbols-outlined text-4xl transition-colors ${isSelected ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>{context.icon}</span>
                            </div>
                            <span className={`font-semibold text-lg transition-colors mt-2 ${isSelected ? 'text-primary' : 'text-text-primary-light dark:text-text-primary-dark'}`}>{context.title}</span>
                        </button>
                     )
                })}
            </div>

            <div className="mt-12 flex w-full flex-col-reverse items-center justify-between gap-4 sm:flex-row">
                <button onClick={onBack} className="flex h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-transparent px-8 font-bold text-text-secondary-light transition-all duration-200 ease-in-out hover:bg-gray-500/10 dark:text-text-secondary-dark hover:dark:bg-white/10">
                    <span className="truncate">Back</span>
                </button>
                <button onClick={handleSubmit} disabled={!selectedContext} className="flex h-12 w-full transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    <span className="truncate">Continue</span>
                </button>
            </div>
        </div>
    );
};

export default Step2ContextSelection;
