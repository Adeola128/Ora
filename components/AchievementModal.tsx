import React from 'react';
import ShareButton from './ShareButton'; // Import the new component

interface AchievementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToProgress: () => void;
}

const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose, onNavigateToProgress }) => {
    if (!isOpen) return null;

    const handleViewProgress = () => {
        onNavigateToProgress();
        onClose();
    };
    
    const shareData = {
        title: "Achievement Unlocked in Oratora!",
        text: "I just unlocked the 'First Step Taken' achievement on my public speaking journey with Oratora! 🚀 #PublicSpeaking #AI #Oratora",
        url: "https://oratora.ai",
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            
            <div 
                onClick={(e) => e.stopPropagation()} 
                className="relative w-full max-w-md rounded-2xl bg-card-dark shadow-xl p-8 m-4 text-center text-white border border-primary/50 overflow-hidden"
            >
                {/* Background glow effect */}
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(42,115,234,0.3)_0%,_rgba(42,115,234,0)_50%)] animate-pulse-gradient"></div>
                
                <div className="relative z-10">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40">
                        <span className="material-symbols-outlined text-5xl">emoji_events</span>
                    </div>
                    
                    <h2 id="modal-title" className="text-3xl font-bold">Achievement Unlocked!</h2>
                    <p className="mt-2 text-text-muted-dark text-lg">First Step Taken</p>
                    
                    <p className="mt-4 text-text-dark">
                        Congratulations! You've completed your first analysis and taken a huge step on your public speaking journey.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={handleViewProgress} 
                            className="w-full flex items-center justify-center gap-2 h-12 px-6 bg-primary text-white text-base font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
                        >
                            <span className="material-symbols-outlined">trending_up</span>
                            <span>View My Progress</span>
                        </button>
                        <button 
                            onClick={onClose} 
                            className="w-full h-12 px-6 text-sm font-bold text-text-dark bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                     <div className="mt-4">
                        <ShareButton shareData={shareData} className="w-full flex items-center justify-center gap-2 h-12 px-6 bg-secondary text-white text-base font-bold rounded-lg hover:bg-secondary/80 transition-colors shadow-lg shadow-secondary/30">
                            <span className="material-symbols-outlined">share</span>
                            <span>Share Achievement</span>
                        </ShareButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AchievementModal;