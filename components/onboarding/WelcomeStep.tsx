import React from 'react';

interface WelcomeStepProps {
    onNext: () => void;
    onSkip: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, onSkip }) => {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 bg-background-light dark:bg-gradient-to-br dark:from-background-dark dark:via-teal-900/40 dark:to-background-dark font-body text-text-primary-light dark:text-white/90 antialiased animate-fade-in">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 z-0 opacity-5 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]">
                <svg aria-hidden="true" className="absolute inset-0 h-full w-full"><defs><pattern id="S-pattern" width="32" height="32" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" x="0" y="0"><path d="M8 8v16M24 8v16" stroke="#06f9e0" fill="none" strokeLinecap="round"></path></pattern></defs><rect width="100%" height="100%" fill="url(#S-pattern)"></rect></svg>
            </div>
            
            <div className="relative z-10 flex w-full max-w-lg flex-col items-center rounded-2xl p-8 text-center glass-card">
                 <div className="w-full max-w-[200px] md:max-w-[250px] animate-levitate">
                    <img className="h-auto w-full object-contain" alt="A playful and friendly mascot character with a speech bubble, looking encouraging." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0nJAckBRNmJFNqlAqv5tNTcBi47GvgkXkJl5l6N2XemPTQRA8IhNddcxF2YrCLydSwyYYVkNO-3Txl0jl_JmQolR7tzgjihkHX5RHLe5t40xLwZp-S-3tois2kk5ZCEI0paVskx5CAPcEkH5yNZChvm_XSpsQbqtxoxOozq95vS_Ipz21u07aUKAWgjFrbOiXWqegc_CIcY_l3AHF0iDMCqYyGycSymt0n6JXLp85Kt3NECm0mcarUCtoxqkIllble7w1tlKDwWo" />
                </div>
                <div className="mt-6 flex flex-col items-center">
                    <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-text-primary-dark sm:text-5xl">
                        Welcome to Oratora!
                    </h1>
                    <p className="mt-4 text-lg text-text-secondary-dark">
                        Your new AI-powered coach is here to help you speak better and sound confident. Let’s get you started in just 3 quick steps.
                    </p>
                    <div className="mt-8 flex w-full flex-col items-center gap-4 sm:max-w-xs">
                        <button onClick={onNext} className="flex h-14 w-full transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-bold text-background-dark shadow-lg shadow-primary/30 transition-transform duration-200 ease-in-out hover:scale-105">
                            <span className="truncate">Let's Go!</span>
                        </button>
                        <button onClick={onSkip} className="cursor-pointer text-sm font-semibold text-text-secondary-dark transition-colors hover:text-primary">Skip for now</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeStep;
