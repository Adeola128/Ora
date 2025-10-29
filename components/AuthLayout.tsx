import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
    imageSrc: string;
    imageAlt: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, imageSrc, imageAlt }) => {
    return (
        <div className="flex min-h-screen w-full bg-[#F8F8FA] dark:bg-background-dark" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Left Panel - Mascot */}
            <div className="hidden w-1/2 flex-col items-center justify-center bg-teal-50 dark:bg-teal-900/20 p-12 lg:flex">
                <div className="w-full max-w-lg">
                    <img alt={imageAlt} className="animate-bob h-auto w-full" src={imageSrc} />
                </div>
            </div>
            {/* Right Panel - Form */}
            <div className="flex w-full flex-col items-center justify-center p-4 lg:w-1/2 lg:p-8">
                <div className="w-full max-w-md">
                    <a href="#" className="mb-8 flex items-center justify-center gap-3" aria-label="Oratora Home">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                            <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                            <path d="M16 24C19.9298 24 23.141 21.412 24 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            <path d="M16 20C17.5752 20 18.9664 19.1411 19.6085 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                        <span className="font-heading text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Oratora</span>
                    </a>
                    <div className="w-full rounded-2xl bg-white dark:bg-card-dark p-8 shadow-sm md:p-12">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;