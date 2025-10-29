import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthLayout from './AuthLayout';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

const SignUpPage: React.FC<{
    onNavigateToLogin: () => void;
}> = ({ onNavigateToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');


    const calculateStrength = (pass: string): number => {
        let strength = 0;
        if (pass.length > 7) strength++;
        if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
        if (pass.match(/\d/)) strength++;
        if (pass.match(/[^a-zA-Z\d]/)) strength++;
        return strength;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(calculateStrength(newPassword));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                }
            }
        });

        if (error) {
            setError(error.message);
        } else if (data.user && !data.session) {
            // This indicates that the user has signed up but needs to confirm their email.
            setIsAwaitingConfirmation(true);
        }
        // If sign up is successful and email confirmation is disabled,
        // `data.session` will exist, and the onAuthStateChange listener in App.tsx
        // will handle navigation automatically.
        setIsLoading(false);
    };
    
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
         if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    }

    const handleResendEmail = async () => {
        setResendLoading(true);
        setResendMessage('');
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        if (error) {
            setResendMessage(`Error: ${error.message}`);
        } else {
            setResendMessage('A new confirmation email has been sent.');
        }
        setResendLoading(false);
    };

    return (
        <AuthLayout
            imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDyLAOuX9kUdQLlvRE5OB3enzte6l5cKl7gaKodxcy8cCIMmhI4MZh6EordGunqFAh0jTfgkmvnDzDpTcdJ-zq84e_izg5gtvnlClCx-69-ZkkjnKBwuuGSJBhNGS0EW1dab7zCSghgs6AuJetdTK5PwF2cHdvwJ6CyupugcGDrgVb4pMEotDuyNfjAld6K3P_r0Ln-nKjNQwkAQyDtVuHeAUR_8t32WBM3eYEX_vzqtea7oI0Bncx8EoPk6TMGFVDUbb_rbZ_S1H8"
            imageAlt="A friendly, waving mascot inviting users to sign up."
        >
            {isAwaitingConfirmation ? (
                 <div className="text-center w-full animate-fade-in">
                    <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/50">
                        <span className="material-symbols-outlined text-5xl text-green-500">mark_email_read</span>
                        <h3 className="font-bold text-green-800 dark:text-green-200 mt-4 text-xl">Check your email!</h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                            We've sent a confirmation link to <strong>{email}</strong>. Please click the link to complete your registration.
                        </p>
                    </div>
                    <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                        Didn't receive an email? Check your spam folder or{" "}
                        <button 
                            onClick={handleResendEmail} 
                            disabled={resendLoading}
                            className="font-bold text-[#23B2A4] hover:underline disabled:opacity-50 disabled:cursor-wait"
                        >
                            {resendLoading ? 'Sending...' : 'resend the confirmation link'}
                        </button>
                        .
                    </div>
                    {resendMessage && (
                        <p className={`mt-2 text-sm ${resendMessage.startsWith('Error') ? 'text-red-500' : 'text-green-700 dark:text-green-300'}`}>{resendMessage}</p>
                    )}
                     <div className="pt-8 text-center">
                        <a className="cursor-pointer font-bold text-[#23B2A4] hover:underline ml-1" onClick={onNavigateToLogin}>Back to Sign In</a>
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="mb-4 text-center text-3xl font-bold leading-tight tracking-tight text-[#333333] dark:text-text-primary-dark" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Let's get started!
                    </h1>
                    <p className="text-[#479e96] dark:text-primary/80 text-base font-normal leading-normal text-center mb-6">Create an account to begin your journey.</p>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        <div className="flex w-full flex-col">
                            <label className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400" htmlFor="name">Full Name</label>
                            <input
                                className="form-input h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-base text-[#333333] placeholder:text-gray-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                id="name"
                                placeholder="Enter your full name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex w-full flex-col">
                            <label className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400" htmlFor="email">Email Address</label>
                            <input
                                className="form-input h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-base text-[#333333] placeholder:text-gray-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                id="email"
                                placeholder="Enter your email address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex w-full flex-col">
                            <label className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400" htmlFor="password">Create Password</label>
                            <div className="relative flex w-full flex-1 items-stretch">
                                <input
                                    className="form-input h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 p-5 pr-12 text-base text-[#333333] placeholder:text-gray-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                    id="password"
                                    placeholder="At least 8 characters"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength={8}
                                />
                                <button
                                    className="absolute right-0 top-0 flex h-full items-center justify-center pr-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined cursor-pointer text-2xl">
                                        {showPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                            <div className="mt-2">
                                <PasswordStrengthIndicator strength={passwordStrength} />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#23B2A4] to-[#48D1CC] px-5 text-lg font-bold text-white shadow-lg shadow-teal-500/30 transition-transform hover:scale-[1.02] disabled:opacity-70"
                            >
                                <span className="truncate">{isLoading ? 'Creating Account...' : 'Create Account'}</span>
                            </button>
                        </div>
                    </form>
                    <div className="relative my-8 flex items-center">
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                        <span className="mx-4 flex-shrink text-sm font-medium text-gray-400">OR</span>
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="flex">
                        <button onClick={handleGoogleSignIn} disabled={isLoading} className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full border border-gray-300 bg-white px-5 text-base font-medium text-[#333333] transition-all duration-200 ease-in-out hover:bg-gray-50 hover:shadow-md hover:border-gray-400 active:scale-[0.98] dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-500 disabled:opacity-70">
                            <svg className="h-6 w-6" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                <path fill="none" d="M0 0h48v48H0z"></path>
                            </svg>
                            <span className="truncate">Sign up with Google</span>
                        </button>
                    </div>
                    <div className="pt-8 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?
                            <a className="cursor-pointer font-bold text-[#23B2A4] hover:underline ml-1" onClick={onNavigateToLogin}>Sign In</a>
                        </p>
                    </div>
                </>
            )}
        </AuthLayout>
    );
};

export default SignUpPage;