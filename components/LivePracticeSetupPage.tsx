import React, { useState, useMemo, useEffect } from 'react';

interface LivePracticeSetupPageProps {
    onBackToDashboard: () => void;
    onStartSession: (topic: string) => void;
    initialTopic?: string;
}

const environments = [
    { name: 'Conference Room', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDj03NyqtuWYX9aoas0txn6w55QsQ5zlJ0au65PJTGcEtJSq7g4QIFEjytic2aBnOy3RW1Cniwa_atBmxKrLL0ttx4TO46YiPV2DT2T3gqmB4lj209eo0Pb-sKO9EoSXA8OWhV0LKCLFPGNDIasqia0tXE4rJYBQskWIJrGDtq1eCv3qbv6VhPTHxczaAdHB9BeKjAmTkz_dG6AcNI7Gp7LvInGYdoOfqykl03N8-I37FLA_OLyr7d_DcdqH3vciKOrJbJFwHxFqnk' },
    { name: 'Auditorium', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaQloXXRUdK8Fsx-3fCnuZiWYnLjvcYllHzpkWvT_5LtrOFoZhvvH-di6THJRv-ii-G_gwleWAQK4Wlp44aGQKzQ0R7ZvQV5WrGnj8KWZclR86wCmwXgxgJzDvjsHRwYoXwM-71npkmyUJzQdmVRmSoyfq6NPn4gcoou0tCTB3v-fhuHwjSFRzd7rc-CcJNcTjseJyZJR-YPQ_6zEuGITxZM05I5GgUuZKo5X15IRePtXXJ3QvIVrbbc0RGA_RgKJJabF4qXXcoxg' },
    { name: 'Small Meeting', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfdemRNIWmQprxNkSac5P0h9bISh0kbPUbF0dlzoy_Y8ev-eVDUvqglQyiNoIiPNV1YV1KL5fBK73gnrwK9kLYw_a-csnFksgotuWR5_DWILLuk-VC8uefqB5hrLdCYE9rb--IXyGEzGh6LwsmOiyFR4P1i15dfMSv6754rCuinFEOTaz5b7Rc1Hq_BWBp4BcEPqFz-fIWL_ZizLhNm1hhFYyAzo33dCy8R69G9PmhAotrCfF00n5R6w4j2fcpsD0hRjDbSJEVKaQ' },
    { name: 'Classroom', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7ztnHAwnEn1qK8f9IORdRvBuWGPXByDHvetPq03ngdK229FEKUbr5ev-ESjKrty86O61QJSrYm7kdi4_57YntNl3sU0Q1Ki2ugAkTZAdSf4p3aj1vldIHooNWD-jc8TZzn8DyoXbRZ_2oSgXOX-QNTann7TLvvB2Z0Vxpc5IESltEBvJY_ZLaGQtHohsTwzG3-yjqe38D9qhWuUHRJsVK9FtV_kjlDIWMFEA4WVYw1ss1AXa73sn94u498nDRPaYrdtp6blKssEY' }
];

const displayMetricsOptions = ['Pace', 'Filler Words', 'Eye Contact', 'Tone', 'Volume'];

const LivePracticeSetupPage: React.FC<LivePracticeSetupPageProps> = ({ onBackToDashboard, onStartSession, initialTopic }) => {
    const [practiceType, setPracticeType] = useState('Free Practice');
    const [scenario, setScenario] = useState('');
    const [isAudienceEnabled, setIsAudienceEnabled] = useState(true);
    const [environment, setEnvironment] = useState(environments[0]);
    const [engagement, setEngagement] = useState(75);
    const [receptiveness, setReceptiveness] = useState(60);
    const [feedbackLevel, setFeedbackLevel] = useState('Beginner');
    const [alertSensitivity, setAlertSensitivity] = useState(50);
    const [displayMetrics, setDisplayMetrics] = useState(['Pace', 'Filler Words']);
    const [micLevel, setMicLevel] = useState(0);

    useEffect(() => {
        if (initialTopic) {
            setPracticeType('Scenario Practice');
            setScenario(initialTopic);
        }
    }, [initialTopic]);

    useEffect(() => {
        // Simulate microphone check animation
        const interval = setInterval(() => {
            setMicLevel(Math.random() * 80 + 10);
        }, 500);
        setTimeout(() => clearInterval(interval), 3000);
        return () => clearInterval(interval);
    }, []);

    const summary = useMemo(() => ({
        'Practice Type': practiceType,
        'Scenario': practiceType === 'Scenario Practice' ? scenario : 'N/A',
        'Audience': isAudienceEnabled ? 'Enabled' : 'Disabled',
        'Environment': isAudienceEnabled ? environment.name : 'N/A',
        'Feedback': feedbackLevel
    }), [practiceType, scenario, isAudienceEnabled, environment, feedbackLevel]);
    
    const scenarioOptions = useMemo(() => {
        const baseOptions = ['Job Interview', 'Sales Pitch', 'Team Meeting'];
        if (initialTopic && !baseOptions.includes(initialTopic)) {
            return [initialTopic, ...baseOptions];
        }
        return baseOptions;
    }, [initialTopic]);

    const handleStartSession = () => {
        const sessionTopic = practiceType === 'Scenario Practice' && scenario ? scenario : practiceType;
        onStartSession(sessionTopic);
    };

    const handleMetricToggle = (metric: string) => {
        setDisplayMetrics(prev =>
            prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
        );
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen font-display text-text-light dark:text-text-dark animate-fade-in">
            <div className="container mx-auto py-10 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Heading */}
                        <div className="flex flex-col gap-3">
                            <h1 className="text-4xl font-bold leading-tight">Set Up Your Live Practice Session</h1>
                            <p className="text-base font-normal text-text-muted-light dark:text-text-muted-dark">Customize your practice environment to meet your specific goals.</p>
                        </div>

                        {/* Practice Type */}
                        <section>
                            <h2 className="text-xl font-bold mb-4">Practice Type</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['Free Practice', 'Scenario Practice', 'Voice Training'].map((type) => (
                                    <label key={type} className={`flex flex-col items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${practiceType === type ? 'border-primary bg-primary-50 dark:bg-primary-900/40' : 'border-border-light dark:border-border-dark hover:border-primary/50'}`}>
                                        <span className="material-symbols-outlined text-4xl text-primary">{type === 'Free Practice' ? 'record_voice_over' : type === 'Scenario Practice' ? 'event' : 'mic'}</span>
                                        <div className="flex flex-col text-center">
                                            <p className="font-medium">{type}</p>
                                        </div>
                                        <input type="radio" name="practice_type" value={type} checked={practiceType === type} onChange={(e) => setPracticeType(e.target.value)} className="form-radio h-5 w-5 text-primary focus:ring-primary" />
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* Context Selection */}
                        {practiceType === 'Scenario Practice' && (
                            <section className="animate-fade-in">
                                <h2 className="text-xl font-bold mb-4">Context Selection</h2>
                                <div className="rounded-xl border-2 border-border-light dark:border-border-dark p-5 bg-card-light dark:bg-card-dark">
                                    <label className="flex flex-col w-full">
                                        <p className="text-base font-medium pb-2">Scenario</p>
                                        <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="form-select w-full rounded-lg text-text-light dark:text-text-dark border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary/50 p-3">
                                            <option value="">Select a scenario</option>
                                            {scenarioOptions.map(opt => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </section>
                        )}

                        {/* Virtual Audience Setup */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold">Virtual Audience Setup</h2>
                            <div className="rounded-xl border-2 border-border-light dark:border-border-dark p-5 bg-card-light dark:bg-card-dark space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-base font-bold">Enable Virtual Audience</p>
                                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Configure the virtual audience for your practice session.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={isAudienceEnabled} onChange={() => setIsAudienceEnabled(!isAudienceEnabled)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                {isAudienceEnabled && (
                                    <div className="space-y-4 pt-4 border-t border-border-light dark:border-border-dark animate-fade-in">
                                        <p className="font-medium">Environment</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {environments.map(env => (
                                                <div key={env.name} onClick={() => setEnvironment(env)} className={`rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${environment.name === env.name ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}>
                                                    <img className="h-24 w-full object-cover" alt={env.name} src={env.image} />
                                                    <p className="p-2 text-sm font-medium text-center">{env.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                                            <label className="flex flex-col gap-2">
                                                <span className="font-medium">Engagement</span>
                                                <input type="range" value={engagement} onChange={(e) => setEngagement(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" style={{ accentColor: '#4F46E5' }} />
                                            </label>
                                            <label className="flex flex-col gap-2">
                                                <span className="font-medium">Receptiveness</span>
                                                <input type="range" value={receptiveness} onChange={(e) => setReceptiveness(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" style={{ accentColor: '#4F46E5' }} />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Feedback Settings */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold">Feedback Settings</h2>
                             <div className="rounded-xl border-2 border-border-light dark:border-border-dark p-5 bg-card-light dark:bg-card-dark space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <label className="flex flex-col w-full gap-2">
                                        <p className="font-medium">Feedback Level</p>
                                        <select value={feedbackLevel} onChange={(e) => setFeedbackLevel(e.target.value)} className="form-select w-full rounded-lg text-text-light dark:text-text-dark border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary/50 p-3">
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-2">
                                        <span className="font-medium">Alert Sensitivity</span>
                                        <input type="range" value={alertSensitivity} onChange={(e) => setAlertSensitivity(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" style={{ accentColor: '#4F46E5' }} />
                                    </label>
                                </div>
                                <div>
                                    <p className="font-medium mb-2">Display Metrics</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {displayMetricsOptions.map(metric => (
                                            <label key={metric} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={displayMetrics.includes(metric)} onChange={() => handleMetricToggle(metric)} className="form-checkbox rounded text-primary focus:ring-primary/50" />
                                                <span>{metric}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                         {/* Equipment Check */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold">Equipment Check</h2>
                            <div className="rounded-xl border-2 border-border-light dark:border-border-dark p-5 bg-card-light dark:bg-card-dark space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="font-medium">Microphone</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                                <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${micLevel}%` }}></div>
                                            </div>
                                            <span className="material-symbols-outlined text-primary">mic</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-medium">Internet Connection</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-green-600 font-semibold">Strong</p>
                                            <span className="material-symbols-outlined text-green-500">wifi</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Camera</p>
                                    <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-5xl">videocam</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                    {/* Right Sidebar */}
                    <div className="hidden lg:block">
                        <div className="sticky top-10 space-y-6">
                            <h2 className="text-xl font-bold">Live Practice Preview</h2>
                            <div className="aspect-[9/16] bg-slate-800 rounded-xl p-4 flex flex-col justify-between border-8 border-slate-900 relative overflow-hidden">
                                {isAudienceEnabled && <img src={environment.image} alt={environment.name} className="absolute inset-0 w-full h-full object-cover opacity-30 rounded-md" />}
                                <div className="flex-grow flex items-center justify-center relative">
                                    <div className="text-center text-white">
                                        <p className="text-lg font-semibold">{isAudienceEnabled ? environment.name : 'Empty Room'}</p>
                                        <p className="text-sm opacity-80">You are presenting</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-black/30 backdrop-blur-sm p-3 rounded-lg z-10">
                                    <div className="flex items-center gap-2 text-white">
                                        <span className="material-symbols-outlined text-red-500">radio_button_checked</span>
                                        <span>REC 00:00</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="bg-white/20 p-2 rounded-full text-white"><span className="material-symbols-outlined">mic_off</span></button>
                                        <button className="bg-white/20 p-2 rounded-full text-white"><span className="material-symbols-outlined">videocam_off</span></button>
                                        <button className="bg-red-500 p-2 rounded-full text-white"><span className="material-symbols-outlined">call_end</span></button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border-2 border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark space-y-3">
                                <h3 className="font-bold text-lg">Summary</h3>
                                <ul className="text-sm space-y-1 text-text-muted-light dark:text-text-muted-dark">
                                    {Object.entries(summary).map(([key, value]) => (
                                        <li key={key}><strong>{key}:</strong> {value}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="mt-10 pt-6 border-t border-border-light dark:border-border-dark flex flex-col md:flex-row items-center justify-end gap-4">
                    <button onClick={onBackToDashboard} className="px-6 py-3 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Back to Dashboard</button>
                    <button className="px-6 py-3 rounded-lg text-sm font-semibold text-primary border border-primary hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-colors">Save as Preset</button>
                    <button onClick={handleStartSession} className="px-8 py-3 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary-700 transition-colors shadow-lg shadow-primary/30">Start Live Practice</button>
                </div>
            </div>
        </div>
    );
};

export default LivePracticeSetupPage;