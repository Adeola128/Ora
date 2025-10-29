import React, { useState } from 'react';
import WelcomeStep from './WelcomeStep';
import Step1ProfileSetup from './Step1ProfileSetup';
import Step2ContextSelection from './Step2ContextSelection';
import Step3Baseline from './Step3Baseline';
import ProgressBar from './ProgressBar';
import { OnboardingData, User, SpeakingContextType } from '../../types';

interface OnboardingFlowProps {
    user: User | null;
    onOnboardingComplete: (data: OnboardingData) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onOnboardingComplete }) => {
    const [step, setStep] = useState(0); // 0: Welcome, 1: Profile, 2: Context, 3: Baseline
    const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
        name: user?.name || '',
        speakingGoals: [],
        selectedContext: null,
        baselineRecording: null,
        profilePicture: null,
    });
    
    const totalStepsOnboarding = 3; // Number of steps after Welcome

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleProfileSubmit = (name: string, goals: string[], profilePicture: File | null) => {
        setOnboardingData(prev => ({ ...prev, name, speakingGoals: goals, profilePicture }));
        handleNext();
    };

    const handleContextSubmit = (context: SpeakingContextType) => {
        setOnboardingData(prev => ({ ...prev, selectedContext: context }));
        handleNext();
    };
    
    const handleRecordingSubmit = (recording: Blob | null) => {
        const finalData: OnboardingData = {
            name: onboardingData.name || user?.name || '',
            speakingGoals: onboardingData.speakingGoals || [],
            selectedContext: onboardingData.selectedContext || null,
            baselineRecording: recording,
            profilePicture: onboardingData.profilePicture || null,
        };
        onOnboardingComplete(finalData);
    };

    const handleSkip = () => {
        const finalData: OnboardingData = {
            name: user?.name || '',
            speakingGoals: [],
            selectedContext: null,
            baselineRecording: null,
            profilePicture: null,
        };
        onOnboardingComplete(finalData);
    };

    if (step === 0) {
        return <WelcomeStep onNext={handleNext} onSkip={handleSkip} />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="w-full max-w-4xl mx-auto">
                <header className="mb-8">
                     <a href="#" className="flex items-center justify-center gap-3" aria-label="Oratora Home">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                            <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                            <path d="M16 24C19.9298 24 23.141 21.412 24 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            <path d="M16 20C17.5752 20 18.9664 19.1411 19.6085 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                        <span className="font-heading text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Oratora</span>
                    </a>
                    <div className="mt-4">
                        <ProgressBar currentStep={step} totalSteps={totalStepsOnboarding} />
                    </div>
                </header>
                <main className="mt-8">
                    {step === 1 && <Step1ProfileSetup user={user} onBack={handleBack} onSubmit={handleProfileSubmit} initialName={onboardingData.name} initialGoals={onboardingData.speakingGoals} />}
                    {step === 2 && <Step2ContextSelection onBack={handleBack} onSubmit={handleContextSubmit} />}
                    {step === 3 && <Step3Baseline onBack={handleBack} onSubmit={handleRecordingSubmit} />}
                </main>
            </div>
        </div>
    );
};

export default OnboardingFlow;