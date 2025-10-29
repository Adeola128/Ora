
import React, { useState, useRef } from 'react';
import { supabase, toSnakeCase } from '../lib/supabaseClient';
import { User } from '../types';

interface ProfilePageProps {
    user: User | null;
    onUpdateUser: (updatedUser: Partial<User>) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState(''); // Not used in updateUser, but good for UI
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || name.trim() === '') return;
        setIsUpdating(true);

        const updatedProfile: Partial<User> = { name };
        onUpdateUser(updatedProfile); // Let App.tsx handle the DB update
        
        setIsEditing(false);
        setIsUpdating(false);
    };
    
    const handleCancelEdit = () => {
        setName(user?.name || '');
        setIsEditing(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ text: "New passwords do not match.", type: 'error' });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordMessage({ text: "Password must be at least 8 characters.", type: 'error' });
            return;
        }
        setIsUpdating(true);

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        
        if (error) {
            setPasswordMessage({ text: error.message, type: 'error' });
        } else {
            setPasswordMessage({ text: "Password updated successfully!", type: 'success' });
            setNewPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
        }
        setIsUpdating(false);
    };
    
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUpdating(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            alert(uploadError.message);
            setIsUpdating(false);
            return;
        }

        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
        
        if (!urlData) {
             alert('Could not get public URL for avatar.');
             setIsUpdating(false);
             return;
        }

        const newAvatarUrl = urlData.publicUrl;
        
        // Let App.tsx handle the update to ensure state consistency
        onUpdateUser({ avatarUrl: newAvatarUrl });

        setIsUpdating(false);
    };


    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Your Profile</h1>
                <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Manage your personal information and account settings.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column: Profile card */}
                <div className="lg:col-span-1">
                    <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md text-center">
                        <div className="relative inline-block">
                            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-24 mx-auto" style={{backgroundImage: `url(${user?.avatarUrl})`}} />
                            <button onClick={handleAvatarClick} disabled={isUpdating} className="absolute bottom-0 right-0 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-card-light dark:border-card-dark hover:bg-primary/90 transition-colors disabled:opacity-50">
                                {isUpdating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <span className="material-symbols-outlined text-base">edit</span>}
                            </button>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                            />
                        </div>
                        <h2 className="text-xl font-bold mt-4 text-text-light dark:text-text-dark">{user?.name}</h2>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{user?.email}</p>
                        
                        <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark text-left space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="material-symbols-outlined text-primary">calendar_today</span>
                                <span className="text-text-muted-light dark:text-text-muted-dark">Member since: <strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</strong></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="material-symbols-outlined text-primary">event_repeat</span>
                                <span className="text-text-muted-light dark:text-text-muted-dark">Total sessions: <strong>12</strong></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="material-symbols-outlined text-primary">emoji_events</span>
                                <span className="text-text-muted-light dark:text-text-muted-dark">Achievements: <strong>4 / 12</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column: Forms */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Personal Information */}
                    <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-text-light dark:text-text-dark">Personal Information</h3>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-primary hover:underline">Edit</button>
                            )}
                        </div>
                        <form onSubmit={handleSaveProfile}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Full Name</label>
                                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing || isUpdating} className="w-full px-4 py-2 border rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Email Address</label>
                                    <input type="email" id="email" value={email} disabled className="w-full px-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-text-muted-light dark:text-text-muted-dark border-border-light dark:border-border-dark cursor-not-allowed" />
                                </div>
                            </div>
                            {isEditing && (
                                <div className="flex justify-end gap-4 mt-6">
                                    <button type="button" onClick={handleCancelEdit} disabled={isUpdating} className="h-11 px-6 text-sm font-bold text-text-light dark:text-text-dark bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isUpdating} className="h-11 px-6 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center">
                                        {isUpdating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Change Password */}
                    <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md">
                         <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Change Password</h3>
                         <form onSubmit={handlePasswordChange} className="space-y-4">
                             {passwordMessage && (
                                <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
                                    {passwordMessage.text}
                                </div>
                            )}
                            <div>
                                <label htmlFor="current-password" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Current Password</label>
                                <input type="password" id="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Not required for password update" disabled className="w-full px-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-text-muted-light dark:text-text-muted-dark border-border-light dark:border-border-dark cursor-not-allowed" />
                            </div>
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">New Password</label>
                                <input type="password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary focus:border-primary" />
                            </div>
                             <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Confirm New Password</label>
                                <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary focus:border-primary" />
                            </div>
                             <div className="flex justify-end pt-2">
                                <button type="submit" className="h-11 px-6 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center" disabled={!newPassword || newPassword !== confirmPassword || isUpdating}>
                                     {isUpdating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                    Update Password
                                </button>
                            </div>
                         </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
