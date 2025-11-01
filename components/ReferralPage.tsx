import React, { useState, useEffect } from 'react';
import { supabase, toCamelCase } from '../lib/supabaseClient';
import { User, Referral } from '../types';

interface ReferralPageProps {
    user: User | null;
    setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

const ReferralPage: React.FC<ReferralPageProps> = ({ user, setToast }) => {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReferrals = async () => {
            if (!user) return;
            setIsLoading(true);
            
            // Fetch referrals and join with profiles table to get referred user's details
            const { data, error } = await supabase
                .from('referrals')
                .select(`
                    *,
                    referredUser:profiles!referrals_referred_id_fkey (
                        name,
                        avatar_url
                    )
                `)
                .eq('referrer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching referrals:", error);
                setToast({ message: `Failed to load referrals: ${error.message}`, type: 'error' });
            } else if (data) {
                setReferrals(toCamelCase<Referral[]>(data));
            }
            setIsLoading(false);
        };

        fetchReferrals();
    }, [user, setToast]);

    const referralLink = `${window.location.origin}?ref=${user?.referralCode || ''}`;
    const completedReferrals = referrals.filter(r => r.status === 'completed');

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink)
            .then(() => setToast({ message: 'Referral link copied!', type: 'success' }))
            .catch(() => setToast({ message: 'Failed to copy link.', type: 'error' }));
    };

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
                                value={referralLink}
                                readOnly
                                className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary"
                            />
                            <button onClick={handleCopyLink} className="flex-shrink-0 h-11 px-6 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-base">content_copy</span> Copy Link
                            </button>
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