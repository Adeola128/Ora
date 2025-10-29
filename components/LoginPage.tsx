import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthLayout from './AuthLayout';

const LoginPage: React.FC<{
    onNavigateToSignUp: () => void;
    onNavigateToForgotPassword: () => void;
}> = ({ onNavigateToSignUp, onNavigateToForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            setError(error.message);
        }
        // onLoginSuccess is no longer needed; App.tsx's auth listener will handle it.
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
        // The user will be redirected to Google and then back to the app.
        // App.tsx's auth listener will handle the successful login upon redirect.
    }

    return (
        <AuthLayout
            imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuANAOGmrZHLKWWzy-UPaBSqqQZaD4QW5pnzAMQ8vwKdlP85cvPxhS7-lLNVt_ntjLZ_q9ph09i1yatMk5S34Hmk0e-OMbKipFEXVv7zhke4JiRY94V93pA29Oa23oAkOKjsAHjROOwTjmlQUDdljgpz2krtrhV3ee7wkT5R7M2ozba83kbbSZyXcvzOqZkSjOohLu3-gb4ESYWAegiexyFpyPXCgHKY5Te8AS6ov6DmZ4qx3Bvvrs60bt8bCEetnwbjw5vnnDqFhEw"
            imageAlt="A friendly mascot holding a speech bubble, representing Oratora's speech coaching."
        >
            <h1 className="mb-8 text-center text-3xl font-bold leading-tight tracking-tight text-[#333333] dark:text-text-primary-dark" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Sign in to your account
            </h1>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <div className="flex w-full flex-col">
                    <label className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400" htmlFor="email">Email Address</label>
                    <input
                        className="form-input h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-base text-[#333333] placeholder:text-gray-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                        id="email"
                        placeholder="you@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="flex w-full flex-col">
                    <label className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400" htmlFor="password">Password</label>
                    <div className="relative flex w-full flex-1 items-stretch">
                        <input
                            className="form-input h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 p-5 pr-12 text-base text-[#333333] placeholder:text-gray-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                            id="password"
                            placeholder="Enter your password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
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
                </div>
                <div className="text-right">
                    <a className="cursor-pointer text-sm font-medium text-[#23B2A4] hover:underline" onClick={onNavigateToForgotPassword}>
                        Forgot Password?
                    </a>
                </div>
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#23B2A4] to-[#48D1CC] px-5 text-lg font-bold text-white shadow-lg shadow-teal-500/30 transition-transform hover:scale-[1.02] disabled:opacity-70"
                    >
                        <span className="truncate">{isLoading ? 'Signing In...' : 'Sign In'}</span>
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
                    <span className="truncate">Sign in with Google</span>
                </button>
            </div>
             <div className="pt-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?
                    <a className="cursor-pointer font-bold text-[#23B2A4] hover:underline ml-1" onClick={onNavigateToSignUp}>Sign Up</a>
                </p>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;