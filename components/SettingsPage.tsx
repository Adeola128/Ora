import React, { useState, useEffect } from 'react';
import { User, AnalysisReport } from '../types';
import { sendEmailNotification, generateWeeklySummaryEmail, generatePracticeReminderEmail, generateNewFeatureEmail } from './lib/email';


interface SettingsPageProps {
    user: User | null;
    history: AnalysisReport[];
    setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, history, setToast }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isSendingTest, setIsSendingTest] = useState<string | null>(null);
    const [notifications, setNotifications] = useState({
        practiceReminders: true,
        weeklySummary: true,
        newFeatures: false,
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const handleNotificationChange = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSendTestEmail = async (type: 'summary' | 'reminder' | 'feature') => {
        if (!user) {
            setToast({ message: "User not found.", type: 'error' });
            return;
        }

        setIsSendingTest(type);
        try {
            let emailContent;
            switch(type) {
                case 'summary':
                    emailContent = generateWeeklySummaryEmail(user, history);
                    break;
                case 'reminder':
                    // We'll send the "gaslighting" version for the test
                    emailContent = generatePracticeReminderEmail(user, 'low_progress');
                    break;
                case 'feature':
                    emailContent = generateNewFeatureEmail(user);
                    break;
            }
            await sendEmailNotification({ to: user.email, subject: emailContent.subject, html: emailContent.html });
            setToast({ message: `Test '${type}' email sent successfully!`, type: 'success' });
        } catch (error) {
            setToast({ message: `Failed to send test '${type}' email.`, type: 'error' });
        } finally {
            setIsSendingTest(null);
        }
    };

    const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; label: string; description: string }> = ({ checked, onChange, label, description }) => (
        <div className="flex items-center justify-between py-4 border-b border-border-light dark:border-border-dark last:border-b-0">
            <div>
                <p className="font-medium text-text-light dark:text-text-dark">{label}</p>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
        </div>
    );
    
    const TestButton: React.FC<{ type: 'summary' | 'reminder' | 'feature', label: string }> = ({ type, label }) => (
        <button onClick={() => handleSendTestEmail(type)} disabled={!!isSendingTest} className="h-10 px-4 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-70 w-full sm:w-auto">
            {isSendingTest === type ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                </>
            ) : (
                label
            )}
        </button>
    );

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Customize your Oratora experience.</p>
            </header>

            <div className="max-w-2xl mx-auto space-y-10">
                {/* Appearance Settings */}
                <section>
                    <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Appearance</h2>
                    <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-text-light dark:text-text-dark">Theme</p>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Choose between light and dark mode.</p>
                            </div>
                            <div className="flex items-center gap-2 p-1 bg-background-light dark:bg-background-dark rounded-full border border-border-light dark:border-border-dark">
                                <button onClick={() => setTheme('light')} className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-primary' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                                    <span className="material-symbols-outlined !text-base">light_mode</span> Light
                                </button>
                                <button onClick={() => setTheme('dark')} className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-primary' : 'text-text-muted-light dark:text-text-muted-dark'}`}>
                                    <span className="material-symbols-outlined !text-base">dark_mode</span> Dark
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Email Notification Settings */}
                <section>
                    <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Email Notifications</h2>
                    <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md">
                        <div className="divide-y divide-border-light dark:divide-border-dark">
                            <ToggleSwitch
                                label="Practice Reminders"
                                description="Get notified when it's time for your scheduled practice."
                                checked={notifications.practiceReminders}
                                onChange={() => handleNotificationChange('practiceReminders')}
                            />
                            <ToggleSwitch
                                label="Weekly Summary"
                                description="Receive a weekly email with your progress and insights."
                                checked={notifications.weeklySummary}
                                onChange={() => handleNotificationChange('weeklySummary')}
                            />
                            <ToggleSwitch
                                label="New Features"
                                description="Be the first to know about new features and updates."
                                checked={notifications.newFeatures}
                                onChange={() => handleNotificationChange('newFeatures')}
                            />
                        </div>
                         <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark space-y-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">See what your weekly summary looks like.</p>
                                <TestButton type="summary" label="Send Test Summary" />
                            </div>
                             <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">See an example of a practice reminder.</p>
                                <TestButton type="reminder" label="Send Test Reminder" />
                            </div>
                             <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">See how we announce new features.</p>
                                <TestButton type="feature" label="Send Test Announcement" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Management */}
                <section>
                    <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Data Management</h2>
                    <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md space-y-4">
                        <button className="w-full text-left flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                            <div>
                                <p className="font-medium">Download My Data</p>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Get a copy of all your session history and reports.</p>
                            </div>
                            <span className="material-symbols-outlined">download</span>
                        </button>
                         <button className="w-full text-left flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                            <div className="text-red-800 dark:text-red-200">
                                <p className="font-medium">Delete Account</p>
                                <p className="text-sm">Permanently delete your account and all associated data.</p>
                            </div>
                            <span className="material-symbols-outlined text-red-600">delete_forever</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;