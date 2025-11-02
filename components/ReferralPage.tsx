

import React, { useState, useEffect } from 'react';
import { supabase, toCamelCase } from '../lib/supabaseClient';
import { User, Referral } from '../types';

interface ReferralPageProps {
    user: User | null;
    setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
    onUpdateUser: (updatedUser: Partial<User>) => void;
}

const ReferralPage: React.FC<ReferralPageProps> = ({ user, setToast, onUpdateUser }) => {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [referralCode, setReferralCode] = useState<string | null>(user?.referralCode || null);

    // This effect runs once per user session to initialize the page data.
    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        const initializePage = async () => {
            setIsLoading(true);
            let currentCode = user.referralCode;

            try {
                // Step 1: Ensure referral code exists.
                if (!currentCode) {
                    const { data: newCode, error: rpcError } = await supabase.rpc('ensure_referral_code', {
                        p_user_id: user.id,
                    });
                    if (rpcError) throw rpcError;
                    if (!newCode) throw new Error("Referral code could not be generated.");

                    currentCode = newCode;
                    setReferralCode(currentCode);
                    // Update global state silently in the background.
                    onUpdateUser({ referralCode: currentCode });
                } else {
                    // Sync local state if the code was already present in the user prop.
                    setReferralCode(currentCode);
                }

                // Step 2: Fetch referrals.
                const { data, error: referralsError } = await supabase
                    .from('referrals')
                    .select('*, referredUser:profiles!referred_id (name, avatar_url)')
                    .eq('referrer_id', user.id)
                    .order('created_at', { ascending: false });
                
                if (referralsError) throw referralsError;
                setReferrals(toCamelCase<Referral[]>(data || []));

            } catch (error: any) {
                // Log a more descriptive error to the console to avoid "[object Object]".
                console.error("Error initializing referral page:", error.message || error);
                setToast({ message: error.message || 'Failed to load your referral information.', type: 'error' });
            } finally {
                // This is guaranteed to be called once at the end of the process, preventing UI flashes.
                setIsLoading(false);
            }
        };

        initializePage();
        
    }, [user?.id, user?.referralCode, onUpdateUser, setToast]); // Added user.referralCode to dependency array

    const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : '';
    const completedReferrals = referrals.filter(r => r.status === 'completed');

    const handleCopyLink = () => {
        if (!referralLink) {
            setToast({ message: 'Generating your referral link, please wait...', type: 'info' });
            return;
        }
        navigator.clipboard.writeText(referralLink)
            .then(() => setToast({ message: 'Referral link copied!', type: 'success' }))
            .catch(() => setToast({ message: 'Failed to copy link.', type: 'error' }));
    };

    const shareTitle = 'Join me on Oratora!';
    const shareText = `I'm using Oratora to become a more confident speaker with AI coaching. You should check it out! Use my link to get started:`;
    
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    const linkedinShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(shareText)}`;

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8 text-center max-w-3xl mx-auto">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight sm:text-4xl">Grow Your Orchard & Earn Rewards</h1>
                <p className="text-text-muted-light dark:text-text-muted-dark mt-2">
                    Invite your friends to Oratora. For every friend who signs up, you'll both get rewards!
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Left Column: Share & Status */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark">
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Your Unique Referral Link</h2>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="text"
                                value={referralLink || 'Generating link...'}
                                readOnly
                                className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary"
                            />
                            <button onClick={handleCopyLink} className="flex-shrink-0 h-11 px-6 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled={!referralLink}>
                                <span className="material-symbols-outlined text-base">content_copy</span> Copy Link
                            </button>
                        </div>
                         <div className="mt-4 flex items-center justify-start gap-4 border-t border-border-light dark:border-border-dark pt-4">
                            <p className="text-sm font-semibold text-text-muted-light dark:text-text-muted-dark">Or share via:</p>
                            <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className={`h-10 w-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors ${!referralLink ? 'pointer-events-none opacity-50' : ''}`} aria-label="Share on Twitter">
                                <svg className="w-5 h-5 text-text-light dark:text-text-dark" fill="currentColor" viewBox="0 0 24 24"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.39.106-.803.163-1.227.163-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path></svg>
                            </a>
                            <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" className={`h-10 w-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors ${!referralLink ? 'pointer-events-none opacity-50' : ''}`} aria-label="Share on Facebook">
                                <svg className="w-5 h-5 text-text-light dark:text-text-dark" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path></svg>
                            </a>
                            <a href={linkedinShareUrl} target="_blank" rel="noopener noreferrer" className={`h-10 w-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors ${!referralLink ? 'pointer-events-none opacity-50' : ''}`} aria-label="Share on LinkedIn">
                                <svg className="w-5 h-5 text-text-light dark:text-text-dark" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.98v16h4.98v-8.369c0-2.025 1.72-3.631 3.631-3.631 1.911 0 3.369 1.606 3.369 3.631v8.369h4.98v-10.428c0-5.283-3.094-9.572-8.375-9.572-3.844 0-6.625 2.144-7.625 4.218z"></path></svg>
                            </a>
                        </div>
                    </section>
                    
                    <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark">
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">How It Works</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl"><span className="material-symbols-outlined">share</span></div>
                                <p className="font-semibold mt-3">1. Share Your Link</p>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Share your unique link with friends.</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl"><span className="material-symbols-outlined">person_add</span></div>
                                <p className="font-semibold mt-3">2. Friend Signs Up</p>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">They create an Oratora account.</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl"><span className="material-symbols-outlined">redeem</span></div>
                                <p className="font-semibold mt-3">3. You Both Get Rewards</p>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Enjoy perks like free Pro months!</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark">
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Referral Status</h2>
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                                <thead className="bg-background-light dark:bg-background-dark/50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Friend</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Date Invited</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {isLoading ? (
                                        <tr><td colSpan={3} className="text-center p-6 text-text-muted-light dark:text-text-muted-dark">Loading referrals...</td></tr>
                                    ) : referrals.length > 0 ? (
                                        referrals.map((ref) => (
                                            <tr key={ref.id} className="hover:bg-background-light dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-3">
                                                     <div className="w-8 h-8 rounded-full bg-cover bg-center bg-slate-200 dark:bg-slate-700" style={{backgroundImage: `url(${ref.referredUser?.avatarUrl})`}}></div>
                                                     <span>{ref.referredUser?.name || ref.referredEmail || 'Awaiting signup...'}</span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-muted-light dark:text-text-muted-dark">{new Date(ref.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ref.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                                        {ref.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={3} className="text-center p-6 text-text-muted-light dark:text-text-muted-dark">You haven't referred anyone yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Right Column: Orchard */}
                <div className="lg:col-span-1">
                    <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark h-full">
                         <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4 text-center">Your Orchard</h2>
                         <div className="grid grid-cols-4 gap-4 p-4 bg-green-900/20 rounded-lg min-h-64">
                            {Array.from({ length: Math.max(8, completedReferrals.length) }).map((_, index) => (
                                <div key={index} className="aspect-square flex items-center justify-center rounded-full bg-black/20 group relative">
                                    {index < completedReferrals.length ? (
                                        <>
                                            <span className="text-4xl animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>🌳</span>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-card-dark text-white text-xs rounded-md px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                {completedReferrals[index].referredUser?.name || 'A friend'}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-3 h-3 bg-green-900/50 rounded-full"></div>
                                    )}
                                </div>
                            ))}
                         </div>
                         <div className="mt-6 text-center">
                            <p className="text-4xl font-bold text-primary">{completedReferrals.length}</p>
                            <p className="text-text-muted-light dark:text-text-muted-dark">Friends have joined your orchard!</p>
                         </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ReferralPage;