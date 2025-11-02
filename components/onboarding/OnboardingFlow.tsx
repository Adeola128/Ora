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
        <div className="flex min-h-screen flex-col items-center bg-background-light dark:bg-background-dark p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="w-full max-w-4xl">
                <ProgressBar currentStep={step} totalSteps={totalStepsOnboarding} />
                <main className="mt-12">
                    {step === 1 && <Step1ProfileSetup user={user} onBack={handleBack} onSubmit={handleProfileSubmit} initialName={onboardingData.name} initialGoals={onboardingData.speakingGoals} />}
                    {step === 2 && <Step2ContextSelection onBack={handleBack} onSubmit={handleContextSubmit} />}
                    {step === 3 && <Step3Baseline onBack={handleBack} onSubmit={handleRecordingSubmit} />}
                </main>
            </div>
        </div>
    );
};

export default OnboardingFlow;
