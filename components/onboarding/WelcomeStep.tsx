import React from 'react';

interface WelcomeStepProps {
    onNext: () => void;
    onSkip: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, onSkip }) => {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 bg-background-light dark:bg-background-dark font-body text-text-primary dark:text-white/90 antialiased animate-fade-in">
            <header className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6">
                <a href="#" className="flex items-center justify-center gap-3" aria-label="Oratora Home">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                        <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                        <path d="M16 24C19.9298 24 23.141 21.412 24 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        <path d="M16 20C17.5752 20 18.9664 19.1411 19.6085 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <span className="font-heading text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Oratora</span>
                </a>
            </header>
            <main className="flex w-full max-w-5xl flex-col items-center justify-center text-center">
                <div className="w-full max-w-xs md:max-w-sm">
                    <img className="h-auto w-full object-contain" alt="A playful and friendly mascot character with a speech bubble, looking encouraging." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0nJAckBRNmJFNqlAqv5tNTcBi47GvgkXkJl5l6N2XemPTQRA8IhNddcxF2YrCLydSwyYYVkNO-3Txl0jl_JmQolR7tzgjihkHX5RHLe5t40xLwZp-S-3tois2kk5ZCEI0paVskx5CAPcEkH5yNZChvm_XSpsQbqtxoxOozq95vS_Ipz21u07aUKAWgjFrbOiXWqegc_CIcY_l3AHF0iDMCqYyGycSymt0n6JXLp85Kt3NECm0mcarUCtoxqkIllble7w1tlKDwWo" />
                </div>
                <div className="mt-8 flex max-w-2xl flex-col items-center">
                    <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-text-primary dark:text-white sm:text-5xl">
                        Welcome to Oratora!
                    </h1>
                    <p className="mt-4 text-lg text-secondary-text-light dark:text-secondary-text-dark">
                        Your new AI-powered coach is here to help you speak better and sound confident. Let’s get you started.
                    </p>
                    <div className="mt-8 flex w-full flex-col items-center gap-4 sm:max-w-xs">
                        <button onClick={onNext} className="flex h-12 w-full transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary to-playful_green px-8 font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105">
                            <span className="truncate">Get Started</span>
                        </button>
                        <button onClick={onSkip} className="cursor-pointer text-sm font-semibold text-secondary-text-light dark:text-secondary-text-dark transition-colors hover:text-primary dark:hover:text-primary">Skip for now</button>
                    </div>
                </div>
            </main>
            <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6">
                <div className="flex w-full items-center justify-center gap-2">
                    <div className="h-2 w-8 rounded-full bg-primary"></div>
                    <div className="h-2 w-8 rounded-full bg-border-light dark:bg-border-dark"></div>
                    <div className="h-2 w-8 rounded-full bg-border-light dark:bg-border-dark"></div>
                </div>
            </footer>
        </div>
    );
};

export default WelcomeStep;