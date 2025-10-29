import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';

interface Step1ProfileSetupProps {
    user: User | null;
    onBack: () => void;
    onSubmit: (name: string, goals: string[], profilePicture: File | null) => void;
    initialName?: string;
    initialGoals?: string[];
}

const goalsOptions = [
    { title: 'Improve Confidence', icon: 'sentiment_satisfied' },
    { title: 'Reduce Filler Words', icon: 'chat_error' },
    { title: 'Better Storytelling', icon: 'auto_stories' },
    { title: 'Manage Pace', icon: 'speed' },
    { title: 'Engage the Audience', icon: 'groups' },
    { title: 'Improve Clarity', icon: 'lightbulb' },
];

const Step1ProfileSetup: React.FC<Step1ProfileSetupProps> = ({ user, onBack, onSubmit, initialName, initialGoals }) => {
    const [name, setName] = useState(initialName || user?.name || '');
    const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals || []);
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatarUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePictureClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setPictureFile(file);
        }
    };
    
    useEffect(() => {
        let objectUrl: string | null = null;
        if (pictureFile) {
            objectUrl = URL.createObjectURL(pictureFile);
            setPreviewUrl(objectUrl);
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [pictureFile]);

    const handleGoalToggle = (goalTitle: string) => {
        setSelectedGoals(prev =>
            prev.includes(goalTitle)
                ? prev.filter(g => g !== goalTitle)
                : [...prev, goalTitle]
        );
    };

    const handleSubmit = () => {
        if (name.trim() && selectedGoals.length > 0) {
            onSubmit(name, selectedGoals, pictureFile);
        }
    };

    return (
        <div className="flex flex-col items-center text-center animate-fade-in">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark md:text-4xl lg:text-5xl">
                Welcome, {user?.name?.split(' ')[0] || 'User'}! Let's get to know you.
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-text-secondary-light dark:text-text-secondary-dark">
                First, let's set up your profile.
            </p>
            
            <div className="mt-12 relative">
                <div 
                    className="size-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center cursor-pointer ring-4 ring-offset-4 ring-offset-background-light dark:ring-offset-background-dark ring-transparent hover:ring-primary transition-all group bg-cover bg-center"
                    onClick={handlePictureClick}
                    style={{ backgroundImage: previewUrl ? `url(${previewUrl})` : undefined }}
                    role="button"
                    aria-label="Upload profile photo"
                >
                    {!previewUrl && (
                        <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors">
                            add_a_photo
                        </span>
                    )}
                </div>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                />
            </div>
            <button onClick={handlePictureClick} className="mt-4 text-sm font-semibold text-primary hover:underline">
                {previewUrl ? 'Change Photo' : 'Upload a Profile Photo'}
            </button>
            
            <div className="mt-8 w-full max-w-md text-left">
                <label htmlFor="name" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">Your Name</label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input w-full rounded-lg bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark p-3 text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:border-primary focus:ring-primary"
                    placeholder="Enter your full name"
                />
            </div>

            <p className="mt-12 text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">What are your main speech goals?</p>
            <p className="mt-1 text-text-secondary-light dark:text-text-secondary-dark">Select all that apply.</p>
            
            <div className="mt-8 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {goalsOptions.map((goal) => {
                     const isSelected = selectedGoals.includes(goal.title);
                     return (
                        <button
                            key={goal.title}
                            onClick={() => handleGoalToggle(goal.title)}
                            className={`group flex h-full flex-col items-center justify-start gap-3 rounded-xl border-2 p-4 text-center shadow-sm transition-all duration-200 transform hover:-translate-y-1 ${isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary/50' : 'border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark'}`}
                        >
                            <div className={`flex size-14 items-center justify-center rounded-full transition-colors ${isSelected ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                <span className={`material-symbols-outlined text-4xl transition-colors ${isSelected ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>{goal.icon}</span>
                            </div>
                            <span className={`font-semibold text-sm transition-colors ${isSelected ? 'text-primary' : 'text-text-primary-light dark:text-text-primary-dark'}`}>{goal.title}</span>
                        </button>
                     )
                })}
            </div>

            <div className="mt-12 flex w-full flex-col-reverse items-center justify-between gap-4 sm:flex-row">
                <button onClick={onBack} className="flex h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-transparent px-8 font-bold text-text-secondary-light transition-all duration-200 ease-in-out hover:bg-gray-500/10 dark:text-text-secondary-dark hover:dark:bg-white/10">
                    <span className="truncate">Back</span>
                </button>
                <button onClick={handleSubmit} disabled={!name.trim() || selectedGoals.length === 0} className="flex h-12 w-full transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    <span className="truncate">Continue</span>
                </button>
            </div>
        </div>
    );
};

export default Step1ProfileSetup;