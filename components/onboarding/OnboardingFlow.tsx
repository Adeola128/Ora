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

const onboardingTips = [
    "", // No tip for welcome step (index 0)
    "Knowing your goals helps me tailor your training perfectly for you.",
    "Telling me where you'll be speaking helps me give you more relevant feedback.",
    "Don't worry about being perfect! This just helps me understand your natural style.",
];


const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onOnboardingComplete }) => {
    const [step, setStep] = useState(0); // 0: Welcome, 1: Profile, 2: Context, 3: Baseline
    const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
        name: user?.name || '',
        speakingGoals: [],
        selectedContext: null,
        baselineRecording: null,
        profilePicture: null,
    });
    
    const totalStepsOnboarding = 3;

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

    const handleSkipFlow = () => {
        const finalData: OnboardingData = {
            name: onboardingData.name || user?.name || '',
            speakingGoals: onboardingData.speakingGoals || [],
            selectedContext: onboardingData.selectedContext || null,
            baselineRecording: null, // Ensure baseline is null when skipping
            profilePicture: onboardingData.profilePicture || null,
        };
        onOnboardingComplete(finalData);
    };

    if (step === 0) {
        return <WelcomeStep onNext={handleNext} onSkip={handleSkipFlow} />;
    }

    return (
        <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark animate-fade-in">
            <div className="grid w-full grid-cols-1 lg:grid-cols-12">
                {/* Left Panel: Progress & Mascot */}
                <div className="hidden lg:col-span-4 lg:flex flex-col items-center justify-center bg-primary/5 dark:bg-primary/10 p-8 border-r border-border-light dark:border-border-dark">
                    <div className="w-full max-w-xs flex flex-col items-center">
                        <img 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyLAOuX9kUdQLlvRE5OB3enzte6l5cKl7gaKodxcy8cCIMmhI4MZh6EordGunqFAh0jTfgkmvnDzDpTcdJ-zq84e_izg5gtvnlClCx-69-ZkkjnKBwuuGSJBhNGS0EW1dab7zCSghgs6AuJetdTK5PwF2cHdvwJ6CyupugcGDrgVb4pMEotDuyNfjAld6K3P_r0Ln-nKjNQwkAQyDtVuHeAUR_8t32WBM3eYEX_vzqtea7oI0Bncx8EoPk6TMGFVDUbb_rbZ_S1H8"
                            alt="Oratora Mascot"
                            className="w-48 h-auto animate-bob"
                        />
                        <div className="mt-8 text-center bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm">
                            <p className="font-semibold text-primary">A tip from Oratora:</p>
                            <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">{onboardingTips[step]}</p>
                        </div>
                        <div className="mt-12 w-full">
                           <ProgressBar currentStep={step} totalSteps={totalStepsOnboarding} />
                        </div>
                    </div>
                </div>

                {/* Right Panel: Step Content */}
                <main className="lg:col-span-8 p-4 sm:p-8 md:p-12 flex flex-col justify-center min-h-screen">
                    {/* Mobile Progress Bar */}
                    <div className="lg:hidden w-full max-w-2xl mx-auto mb-12">
                         <ProgressBar currentStep={step} totalSteps={totalStepsOnboarding} direction="horizontal" />
                    </div>
                    
                    <div className="w-full max-w-4xl mx-auto">
                        {step === 1 && <Step1ProfileSetup user={user} onBack={handleBack} onSubmit={handleProfileSubmit} onSkip={handleSkipFlow} initialName={onboardingData.name} initialGoals={onboardingData.speakingGoals} />}
                        {step === 2 && <Step2ContextSelection onBack={handleBack} onSubmit={handleContextSubmit} onSkip={handleSkipFlow} />}
                        {step === 3 && <Step3Baseline onBack={handleBack} onSubmit={handleRecordingSubmit} />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OnboardingFlow;
