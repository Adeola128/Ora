import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, AnalysisReport, TranscriptAnnotation, Metric, Achievement } from '../types';
import PrintableReport from './PrintableReport';

interface AnalysisResultPageProps {
    user: User | null;
    report: AnalysisReport | null;
    media: Blob | File | null;
    sessionGains: { xp: number; newAchievements: Achievement[] } | null;
    onBackToDashboard: () => void;
    onNavigateToNewAnalysis: () => void;
    onNavigateToLivePracticeSetup: () => void;
    onNavigateToProgress: () => void;
}

const sections = [
    { id: 'video-playback', label: 'Playback', icon: 'play_circle' },
    { id: 'quick-stats', label: 'Stats', icon: 'query_stats', mobileOnly: true },
    { id: 'transcript', label: 'Transcript', icon: 'description' },
    { id: 'metrics', label: 'Metrics', icon: 'pie_chart' },
    { id: 'voice-modulation', label: 'Voice', icon: 'graphic_eq' },
    { id: 'ai-feedback', label: 'Feedback', icon: 'psychology' },
    { id: 'action-plan', label: 'Action Plan', icon: 'checklist' },
    { id: 'comparison', label: 'Comparison', icon: 'compare_arrows' },
    { id: 'next-steps', label: "What's Next?", icon: 'sports_score' },
];

const XPToast: React.FC<{ gains: { xp: number; newAchievements: Achievement[] }; onClose: () => void }> = ({ gains, onClose }) => {
    return (
        <div className="fixed top-5 right-5 w-80 bg-card-dark p-4 rounded-xl shadow-2xl text-white border border-primary/50 animate-slide-in-from-right z-50">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-green-400 flex items-center gap-2">
                        <span className="material-symbols-outlined">sparkles</span>
                        +{gains.xp} XP Gained!
                    </p>
                    <p className="text-xs text-text-muted-dark">From your "{gains.newAchievements.length > 0 ? 'session & achievements' : 'session'}"</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
            {gains.newAchievements.length > 0 && (
                <ul className="mt-3 text-sm space-y-2 border-t border-border-dark pt-3">
                    {gains.newAchievements.map(ach => (
                        <li key={ach.id} className="flex items-center gap-2 animate-fade-in-up">
                            <span className="material-symbols-outlined text-yellow-400">emoji_events</span>
                            <span className="font-semibold">Unlocked: {ach.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// New component for the Voice Modulation section
const VoiceModulationCard: React.FC<{
    metric: Metric;
    title: string;
    icon: string;
    colorClass: string;
    exercises: { title: string; description: string }[];
}> = ({ metric, title, icon, colorClass, exercises }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (metric.score / 100) * circumference;
    const ratingColor = {
        good: 'text-green-500',
        average: 'text-yellow-500',
        poor: 'text-red-500',
    }[metric.rating] || 'text-yellow-500';

    return (
        <div className="bg-white dark:bg-card-dark p-6 rounded-xl shadow-sm border border-border-light dark:border-border-dark h-full flex flex-col">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}/10`}>
                    <span className={`material-symbols-outlined text-2xl ${colorClass}`}>{icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
                <div className="relative w-36 h-36 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                        <circle className="text-slate-200 dark:text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="70" cy="70" />
                        <circle
                            strokeWidth="10"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="70"
                            cy="70"
                            className={`transition-all duration-700 ease-out ${ratingColor}`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${ratingColor}`}>{metric.score}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">{metric.details}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Recommended Exercises:</h4>
                <div className="space-y-2">
                    {exercises.map(ex => (
                        <div key={ex.title}>
                            <p className="font-semibold text-sm text-primary">{ex.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{ex.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const TranscriptSection: React.FC<{
    report: AnalysisReport;
    filter: string;
    onSeek: (time: number) => void;
    activeSegmentStartTime: number | null;
}> = ({ report, filter, onSeek, activeSegmentStartTime }) => {
    
    const annotationColors: { [key: string]: string } = {
        strength: 'bg-green-500/20',
        weakness: 'bg-yellow-500/20',
        issue: 'bg-red-500/20',
    };

    const renderAnnotatedSegment = useCallback((segmentText: string, allAnnotations: TranscriptAnnotation[]) => {
        const annotations = allAnnotations.filter(anno => 
            filter === 'All' || (filter.toLowerCase().slice(0, -1) === anno.type)
        );

        if (annotations.length === 0) {
            return <>{segmentText}</>;
        }
        
        const points = new Set<number>([0, segmentText.length]);
        const intervals: { start: number; end: number; type: string }[] = [];

        annotations.forEach(anno => {
            try {
                const searchString = anno.textToHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(searchString, 'g');
                let match;
                while ((match = regex.exec(segmentText)) !== null) {
                    const start = match.index;
                    const end = start + anno.textToHighlight.length;
                    if (start === end) continue; // Avoid zero-length matches
                    points.add(start);
                    points.add(end);
                    intervals.push({ start, end, type: anno.type });
                }
            } catch (e) {
                console.error("Error creating RegExp for annotation:", anno.textToHighlight, e);
            }
        });

        if (intervals.length === 0) {
            return <>{segmentText}</>;
        }

        const sortedPoints = Array.from(points).sort((a, b) => a - b);
        
        return sortedPoints.map((point, i) => {
            if (i === sortedPoints.length - 1) return null;
            
            const start = point;
            const end = sortedPoints[i + 1];
            if (start === end) return null;

            const text = segmentText.substring(start, end);
            const midPoint = start + (end - start) / 2;
            
            const applicableAnnotationTypes = [...new Set(intervals
                .filter(interval => midPoint >= interval.start && midPoint < interval.end)
                .map(i => i.type))];

            if (applicableAnnotationTypes.length > 0) {
                const bgClasses = applicableAnnotationTypes.map(type => annotationColors[type] || '').join(' ');
                return <span key={i} className={`rounded-sm px-0.5 ${bgClasses}`}>{text}</span>;
            } else {
                return <React.Fragment key={i}>{text}</React.Fragment>;
            }
        }).filter(Boolean);
    }, [filter, annotationColors]);


    return (
        <div className="flow-root">
            <div className="-my-4 divide-y divide-border-light dark:divide-border-dark">
                {report.transcriptSegments.map((segment) => {
                    const isActive = activeSegmentStartTime === segment.startTime;
                    const filteredAnnotations = segment.annotations.filter(anno => 
                        filter === 'All' || anno.type === filter.toLowerCase().slice(0, -1)
                    );
                    
                    if (filter !== 'All' && filteredAnnotations.length === 0) {
                        return null;
                    }
                    
                    return (
                        <div
                            key={segment.startTime}
                            onClick={() => onSeek(segment.startTime)}
                            className={`group relative flex cursor-pointer gap-x-3 py-4 transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 border-l-4 ${isActive ? 'border-primary bg-primary/10' : 'border-transparent'}`}
                        >
                            <div className="flex-none pt-1">
                                <p className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">{new Date(segment.startTime * 1000).toISOString().substr(14, 5)}</p>
                                <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-gray-200 dark:ring-gray-700 ${isActive ? 'bg-primary text-white ring-primary' : 'bg-card-light dark:bg-card-dark group-hover:bg-primary/10'}`}>
                                    <span className="material-symbols-outlined text-base">{isActive ? 'pause' : 'play_arrow'}</span>
                                </div>
                            </div>
                            <div className="flex-auto pt-1">
                                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                                    {renderAnnotatedSegment(segment.text, segment.annotations)}
                                </p>
                                {filteredAnnotations.map((anno, i) => (
                                    <div key={i} className="mt-2 flex items-start gap-2 text-xs p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                        <span className={`material-symbols-outlined !text-sm mt-0.5 ${ { strength: 'text-green-500', weakness: 'text-yellow-500', issue: 'text-red-500' }[anno.type] }`}>
                                            { { strength: 'thumb_up', weakness: 'warning', issue: 'error' }[anno.type] }
                                        </span>
                                        <p className="text-text-secondary-light dark:text-text-secondary-dark">{anno.comment}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const AnalysisResultPage: React.FC<AnalysisResultPageProps> = ({ user, report, media, sessionGains, onBackToDashboard, onNavigateToNewAnalysis, onNavigateToLivePracticeSetup, onNavigateToProgress }) => {
    const [activeSection, setActiveSection] = useState('video-playback');
    const [transcriptFilter, setTranscriptFilter] = useState('All');
    const sectionRefs = useRef<(HTMLElement | null)[]>([]);
    
    // Unified Media Player State
    const mediaRef = useRef<HTMLMediaElement | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [isMediaVideo, setIsMediaVideo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [activeSegmentStartTime, setActiveSegmentStartTime] = useState<number | null>(null);
    
    // XP Toast State
    const [showXpToast, setShowXpToast] = useState(false);
    
    const setMediaRef = useCallback((node: HTMLVideoElement | HTMLAudioElement | null) => {
        if (node) {
            mediaRef.current = node;
        }
    }, []);

    useEffect(() => {
        if (sessionGains && sessionGains.xp > 0) {
            setShowXpToast(true);
            const timer = setTimeout(() => setShowXpToast(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [sessionGains]);

    // Create Object URL from Blob or use existing URL
    useEffect(() => {
        let urlToRevoke: string | null = null;
        let url: string | null = null;
        
        if (media) {
            url = URL.createObjectURL(media);
            urlToRevoke = url;
            setMediaUrl(url);
            setIsMediaVideo(media.type.startsWith('video/'));
        } else if (report?.videoUrl) {
            url = report.videoUrl;
            setMediaUrl(url);
            setIsMediaVideo(url.includes('.mp4') || url.includes('.webm') || url.includes('.mov'));
        } else {
            setMediaUrl(null);
        }
        
        // Reset player state when media changes
        setCurrentTime(0);
        setIsPlaying(false);
        if (mediaRef.current) {
            mediaRef.current.currentTime = 0;
            mediaRef.current.pause();
        }

        return () => {
            if (urlToRevoke) {
                URL.revokeObjectURL(urlToRevoke);
            }
        };
    }, [media, report]);


    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handlePrint = () => {
        window.print();
    };
    
    // Media Event Handlers
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
        if (mediaRef.current) setDuration(mediaRef.current.duration);
    };
    const handleTimeUpdate = () => {
        if (!mediaRef.current || !report) return;
        const now = mediaRef.current.currentTime;
        setCurrentTime(now);

        // Find the current active transcript segment
        let currentSegment = null;
        for (let i = report.transcriptSegments.length - 1; i >= 0; i--) {
            if (now >= report.transcriptSegments[i].startTime) {
                currentSegment = report.transcriptSegments[i];
                break;
            }
        }
        setActiveSegmentStartTime(currentSegment ? currentSegment.startTime : null);
    };

    // Attach Media Event Listeners
    useEffect(() => {
        const mediaEl = mediaRef.current;
        if (mediaEl) {
            mediaEl.addEventListener('play', handlePlay);
            mediaEl.addEventListener('pause', handlePause);
            mediaEl.addEventListener('ended', handlePause);
            mediaEl.addEventListener('loadedmetadata', handleLoadedMetadata);
            mediaEl.addEventListener('timeupdate', handleTimeUpdate);
            
            // Initial duration set for cases where metadata loaded before listener attached
            if (mediaEl.duration) setDuration(mediaEl.duration);

            return () => {
                mediaEl.removeEventListener('play', handlePlay);
                mediaEl.removeEventListener('pause', handlePause);
                mediaEl.removeEventListener('ended', handlePause);
                mediaEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
                mediaEl.removeEventListener('timeupdate', handleTimeUpdate);
            };
        }
    }, [mediaUrl]); // Rerun when mediaUrl is ready

    const handleSeek = (time: number) => {
        const mediaEl = mediaRef.current;
        if (mediaEl) {
            mediaEl.currentTime = time;
            if (mediaEl.paused) {
                mediaEl.play().catch(e => console.error("Error playing media on seek:", e));
            }
        }
    };

    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const mediaEl = mediaRef.current;
        if (mediaEl) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            mediaEl.currentTime = percentage * duration;
        }
    };
    
    // Scroll spy for active section
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: '-40% 0px -60% 0px', threshold: 0 }
        );

        sectionRefs.current.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => {
            sectionRefs.current.forEach(ref => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, [report]);

    if (!report) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">No report to display</h2>
                    <p className="mt-2 text-text-muted-light dark:text-text-muted-dark">Go back to the dashboard to start a new analysis.</p>
                    <button onClick={onBackToDashboard} className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg">Back to Dashboard</button>
                </div>
            </div>
        );
    }
    
    const allMetrics: Metric[] = [
        report.metrics.fluency,
        report.metrics.pacing,
        report.metrics.pacingVariability,
        report.metrics.intonation,
        report.metrics.volume,
        report.metrics.sentiment,
    ];
    if (report.metrics.video) {
        allMetrics.push(report.metrics.video.eyeContact, report.metrics.video.bodyLanguage, report.metrics.video.gestures);
    }

    const QuickStats = () => (
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark">
            <h3 className="font-bold text-lg">Quick Stats</h3>
            <ul className="mt-4 space-y-3 text-sm">
                <li className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Overall Score</span>
                    <span className="font-bold text-primary">{report.overallScore}%</span>
                </li>
                 <li className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Duration</span>
                    <span className="font-bold">{formatTime(report.durationSeconds)}</span>
                </li>
                <li className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Pacing</span>
                    <span className="font-bold">{report.metrics.pacing.score} WPM</span>
                </li>
                <li className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Filler Words</span>
                    <span className="font-bold">{report.metrics.fluency.details?.match(/\d+/)?.[0] || 0}</span>
                </li>
            </ul>
        </div>
    );

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen">
            <div className="printable-area">
                <PrintableReport report={report} user={user} />
            </div>

            <div className="screen-only">
                {showXpToast && sessionGains && <XPToast gains={sessionGains} onClose={() => setShowXpToast(false)} />}
                
                <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-3 border-b border-border-light dark:border-border-dark">
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl md:text-2xl font-bold truncate">{report.title}</h1>
                                <p className="text-xs md:text-sm text-text-muted-light dark:text-text-muted-dark">{report.sessionDate}</p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                                <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors hidden sm:flex items-center gap-2 text-sm font-semibold">
                                    <span className="material-symbols-outlined !text-base">download</span>
                                    <span className="hidden md:inline">Download Report</span>
                                </button>
                                <button onClick={onBackToDashboard} className="h-10 px-4 text-sm font-bold text-text-light dark:text-text-dark bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Done</button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Mobile-only sticky navigation */}
                    <div className="lg:hidden sticky top-[65px] z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark -mx-4 sm:-mx-6 px-4 sm:px-6">
                        <nav className="flex overflow-x-auto whitespace-nowrap py-2 no-scrollbar">
                            {sections.map(section => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const el = document.getElementById(section.id);
                                        if (el) {
                                            const y = el.getBoundingClientRect().top + window.pageYOffset - 120; // Adjusted for sticky header height
                                            window.scrollTo({ top: y, behavior: 'smooth' });
                                        }
                                    }}
                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                        activeSection === section.id
                                            ? 'bg-primary text-white'
                                            : 'text-text-muted-light dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="material-symbols-outlined !text-base">{section.icon}</span>
                                    {section.label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Left Sidebar */}
                        <aside className="hidden lg:block lg:col-span-2 py-8">
                            <nav className="sticky top-24">
                                <ul className="space-y-2">
                                    {sections.map(section => {
                                        if (section.mobileOnly) return null;
                                        return (
                                            <li key={section.id}>
                                                <a
                                                    href={`#${section.id}`}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                                                        activeSection === section.id
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'text-text-muted-light dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-base">{section.icon}</span>
                                                    {section.label}
                                                </a>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </nav>
                        </aside>

                        {/* Main Content */}
                        <main className="col-span-12 lg:col-span-10 xl:col-span-7 py-6 lg:py-8">
                            <div className="space-y-12">
                                 {/* Playback Section */}
                                <section id="video-playback" ref={el => sectionRefs.current[0] = el} className="scroll-mt-[120px] lg:scroll-mt-24">
                                    <div className="bg-card-light dark:bg-card-dark p-4 sm:p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark">
                                        {mediaUrl ? (
                                            <>
                                                {isMediaVideo ? (
                                                    <video ref={setMediaRef} src={mediaUrl} className="w-full rounded-lg bg-black aspect-video" />
                                                ) : (
                                                    <audio ref={setMediaRef} src={mediaUrl} className="w-full hidden" />
                                                )}
                                                <div className="mt-4 flex items-center gap-4">
                                                    <button onClick={() => mediaRef.current?.paused ? mediaRef.current?.play() : mediaRef.current?.pause()} className="w-12 h-12 flex-shrink-0 bg-primary text-white rounded-full flex items-center justify-center text-3xl">
                                                        <span className="material-symbols-outlined !text-3xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                                                    </button>
                                                    <div className="flex-grow flex items-center gap-3">
                                                        <span className="text-sm font-mono text-text-muted-light dark:text-text-muted-dark">{formatTime(currentTime)}</span>
                                                        <div onClick={handleProgressBarClick} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer group">
                                                            <div className="h-full bg-primary rounded-full relative" style={{ width: `${(currentTime / duration) * 100}%` }}>
                                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-mono text-text-muted-light dark:text-text-muted-dark">{formatTime(duration)}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                <span className="material-symbols-outlined text-4xl text-text-muted-light dark:text-text-muted-dark">movie_off</span>
                                                <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">Media for this session is not available for playback.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                                
                                {/* Quick Stats for mobile */}
                                <section id="quick-stats" ref={el => sectionRefs.current[1] = el} className="scroll-mt-[120px] xl:hidden">
                                    <QuickStats />
                                </section>
                                
                                {/* Transcript Section */}
                                <section id="transcript" ref={el => sectionRefs.current[2] = el} className="scroll-mt-[120px] lg:scroll-mt-24">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Transcript & Analysis</h2>
                                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Click any part of the transcript to jump to that moment.</p>
                                        </div>
                                        <div className="flex-shrink-0 flex flex-wrap justify-start sm:justify-end items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                                            {['All', 'Strengths', 'Weaknesses', 'Issues'].map(filter => (
                                                <button
                                                    key={filter}
                                                    onClick={() => setTranscriptFilter(filter)}
                                                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${transcriptFilter === filter ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-text-muted-light dark:text-text-muted-dark'}`}
                                                >
                                                    {filter}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <TranscriptSection
                                            report={report}
                                            filter={transcriptFilter}
                                            onSeek={handleSeek}
                                            activeSegmentStartTime={activeSegmentStartTime}
                                        />
                                    </div>
                                </section>

                                {/* Metrics Section */}
                                <section id="metrics" ref={el => sectionRefs.current[3] = el} className="scroll-mt-[120px] lg:scroll-mt-24">
                                     <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Key Metrics</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {allMetrics.map(metric => (
                                             <div key={metric.label} className={`p-4 rounded-lg border-l-4 ${ { good: 'border-green-500 bg-green-500/10', average: 'border-yellow-500 bg-yellow-500/10', poor: 'border-red-500 bg-red-500/10' }[metric.rating as string] || 'border-yellow-500 bg-yellow-500/10' }`}>
                                                <div className="flex justify-between items-baseline">
                                                    <p className="text-sm font-semibold text-text-muted-light dark:text-text-muted-dark">{metric.label}</p>
                                                    <p className={`text-xs font-bold capitalize ${ { good: 'text-green-600', average: 'text-yellow-600', poor: 'text-red-600' }[metric.rating as string] || 'text-yellow-600' }`}>{metric.rating}</p>
                                                </div>
                                                <p className="text-3xl font-bold mt-1 text-text-light dark:text-text-dark">{metric.score}<span className="text-base font-medium text-text-muted-light dark:text-text-muted-dark">{metric.unit}</span></p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Voice Modulation Section */}
                                <section id="voice-modulation" ref={el => sectionRefs.current[4] = el} className="scroll-mt-[120px] lg:scroll-mt-24">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Voice Modulation</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <VoiceModulationCard metric={report.metrics.intonation} title="Intonation" icon="graphic_eq" colorClass="text-purple-500" exercises={[{title: 'Pitch Rollercoaster', description: 'Read a passage with exaggerated pitch changes.'}, {title: 'Emotional Sentence', description: 'Say a neutral phrase with different emotions.'}]} />
                                        <VoiceModulationCard metric={report.metrics.volume} title="Volume" icon="volume_up" colorClass="text-blue-500" exercises={[{title: 'Projection Practice', description: 'Practice speaking from your diaphragm to fill a room.'}, {title: 'Volume Control', description: 'Speak at whisper, conversational, and loud levels.'}]} />
                                    </div>
                                </section>

                                {/* Other sections remain the same */}
                                <section id="ai-feedback" ref={el => sectionRefs.current[5] = el} className="scroll-mt-[120px] lg:scroll-mt-24">
                                     <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">AI Coach Feedback</h2>
                                    <div className="space-y-6">
                                        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark">
                                            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined">emoji_objects</span>Transformative Tip</h3>
                                            <p className="mt-2 text-text-light dark:text-text-dark">{report.feedback.transformativeTip}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-green-500/10 p-6 rounded-xl">
                                                <h3 className="font-bold text-green-800 dark:text-green-200">Strengths</h3>
                                                <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-green-700 dark:text-green-300">
                                                    {report.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>
                                            <div className="bg-yellow-500/10 p-6 rounded-xl">
                                                <h3 className="font-bold text-yellow-800 dark:text-yellow-200">Areas to Watch</h3>
                                                <ul className="mt-2 space-y-2 list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                                                    {report.feedback.areasToWatch.map((a, i) => <li key={i}>{a}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                         <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark">
                                            <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Phrase Alternatives</h3>
                                            <div className="mt-4 space-y-4">
                                                {report.feedback.phraseAlternatives.map((p, i) => (
                                                    <div key={i} className="text-sm border-l-4 border-slate-200 dark:border-slate-700 pl-4">
                                                        <p className="text-red-500"><span className="font-semibold">Original:</span> "{p.original}"</p>
                                                        <p className="text-green-600 dark:text-green-400 mt-1"><span className="font-semibold">Suggestion:</span> "{p.suggestion}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                
                                <section id="action-plan" ref={el => sectionRefs.current[6] = el} className="scroll-mt-[120px] lg:scroll-mt-24">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Your 7-Day Action Plan</h2>
                                    <div className="space-y-2">
                                        {report.actionPlan.map(day => (
                                            <div key={day.day} className={`p-4 rounded-lg flex items-start gap-4 transition-all ${day.isToday ? 'bg-primary/10 border border-primary/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-bold text-sm ${day.isToday ? 'text-primary' : 'text-text-muted-light dark:text-text-muted-dark'}`}>Day {day.day}</span>
                                                    {day.isToday && <span className="text-xs font-bold text-primary">(Today)</span>}
                                                </div>
                                                <p className={`text-sm ${day.isToday ? 'text-text-light dark:text-text-dark' : 'text-text-muted-light dark:text-text-muted-dark'}`}>{day.task}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                                
                                 <section id="comparison" ref={el => sectionRefs.current[7] = el} className="scroll-mt-[120px] lg:scroll-mt-24">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">How You Compare</h2>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">See how this session compares to your previous performance and community averages.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                         <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md">
                                            <h3 className="font-bold text-text-light dark:text-text-dark">Overall Score</h3>
                                            <div className="flex items-end gap-4 mt-4">
                                                <div className="flex-1 text-center">
                                                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-t-lg relative">
                                                        <div className="absolute bottom-0 left-0 w-full bg-slate-400 dark:bg-slate-500 rounded-t-lg" style={{height: `${report.comparison.overallScore.previous}%`}}></div>
                                                    </div>
                                                    <p className="text-xs mt-1 text-text-muted-light dark:text-text-muted-dark">Previous</p>
                                                    <p className="font-bold">{report.comparison.overallScore.previous > 0 ? `${report.comparison.overallScore.previous}%` : 'N/A'}</p>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-t-lg relative">
                                                        <div className="absolute bottom-0 left-0 w-full bg-primary rounded-t-lg" style={{height: `${report.comparison.overallScore.current}%`}}></div>
                                                    </div>
                                                     <p className="text-xs mt-1 text-text-muted-light dark:text-text-muted-dark">Current</p>
                                                     <p className="font-bold">{report.comparison.overallScore.current}%</p>
                                                </div>
                                            </div>
                                        </div>
                                         <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md">
                                             <h3 className="font-bold text-text-light dark:text-text-dark">Fluency Score</h3>
                                            <div className="mt-4 space-y-4">
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-text-muted-light dark:text-text-muted-dark">Community Average</span>
                                                        <span className="font-semibold">{report.comparison.fluency.communityAverage}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                                        <div className="bg-slate-400 dark:bg-slate-500 h-2.5 rounded-full" style={{width: `${report.comparison.fluency.communityAverage}%`}}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-primary font-semibold">Your Score</span>
                                                        <span className="font-semibold text-primary">{report.comparison.fluency.userScore}%</span>
                                                    </div>
                                                    <div className="w-full bg-primary/20 rounded-full h-2.5">
                                                        <div className="bg-primary h-2.5 rounded-full" style={{width: `${report.comparison.fluency.userScore}%`}}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                
                                <section id="next-steps" ref={el => sectionRefs.current[8] = el} className="scroll-mt-[120px] lg:scroll-mt-24">
                                    <div className="bg-gradient-to-r from-primary to-teal-400 p-8 rounded-xl text-white text-center">
                                        <h2 className="text-3xl font-bold">Ready for the Next Step?</h2>
                                        <p className="mt-2 max-w-xl mx-auto">Keep the momentum going! Start a new analysis to build on what you've learned, or try a live practice session for real-time feedback.</p>
                                        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                                            <button onClick={onNavigateToNewAnalysis} className="px-6 py-3 bg-white text-primary font-bold rounded-lg hover:bg-slate-100 transition-colors">Analyze Another Recording</button>
                                            <button onClick={() => onNavigateToLivePracticeSetup()} className="px-6 py-3 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-colors">Start Live Practice</button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </main>

                         {/* Right Sidebar (Quick Stats) */}
                        <aside className="hidden xl:block xl:col-span-3 py-8">
                            <div className="sticky top-24 space-y-6">
                                <QuickStats />
                                <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark">
                                    <h3 className="font-bold text-lg">Next Goal</h3>
                                     <div className="mt-4 text-center">
                                         <span className="material-symbols-outlined text-4xl text-primary">flag</span>
                                         <p className="mt-2 text-sm font-semibold">Reduce filler words by 20%</p>
                                         <button onClick={onNavigateToProgress} className="text-xs font-semibold text-primary hover:underline mt-1">View all goals</button>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisResultPage;
