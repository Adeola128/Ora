import React from 'react';
import { AnalysisReport, User, Metric, TranscriptAnnotation } from '../types';

interface PrintableReportProps {
    report: AnalysisReport;
    user: User | null;
}

// Helper components for a more structured and visually appealing report
const CircularScore: React.FC<{ score: number }> = ({ score }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="70" cy="70" />
                <circle
                    className="text-primary"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-display text-primary">{score}</span>
                <span className="text-xs text-gray-500">/ 100</span>
            </div>
        </div>
    );
};

const MetricBar: React.FC<{ metric: Metric }> = ({ metric }) => {
    const ratingStyles = {
        good: { color: 'bg-playful_green', textColor: 'text-playful_green' },
        average: { color: 'bg-mustard', textColor: 'text-mustard' },
        poor: { color: 'bg-accent', textColor: 'text-accent' },
    };
    const style = ratingStyles[metric.rating as keyof typeof ratingStyles] || ratingStyles.average;

    return (
        <div className="py-2 print-avoid-break">
            <div className="flex justify-between items-baseline mb-1">
                <p className="font-bold text-gray-700 text-sm">{metric.label}</p>
                <p className={`text-base font-bold ${style.textColor}`}>
                    {metric.score}{metric.unit && metric.unit !== '/ 100' ? <span className="text-xs">{metric.unit}</span> : '%'}
                </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${style.color} h-2 rounded-full`} style={{ width: `${metric.score}%` }}></div>
            </div>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <section className={`print-avoid-break ${className}`}>
        <h2 className="text-xl font-bold font-heading text-gray-800 border-b-2 border-primary pb-2 mb-4">{title}</h2>
        {children}
    </section>
);

const renderAnnotatedTextForPrint = (segmentText: string, annotations: TranscriptAnnotation[]) => {
    if (!annotations || annotations.length === 0) {
        return <>{segmentText}</>;
    }

    const intervals: { start: number, end: number, type: string }[] = [];
    annotations.forEach(anno => {
        const searchString = anno.textToHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(searchString, 'g');
        let match;
        while ((match = regex.exec(segmentText)) !== null) {
            intervals.push({ start: match.index, end: match.index + anno.textToHighlight.length, type: anno.type });
        }
    });

    if (intervals.length === 0) return <>{segmentText}</>;

    intervals.sort((a, b) => a.start - b.start);
    
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    intervals.forEach((interval, i) => {
        if (interval.start > currentIndex) {
            parts.push(segmentText.substring(currentIndex, interval.start));
        }
        
        const annotationColors: { [key: string]: string } = {
            strength: 'bg-green-100',
            weakness: 'bg-yellow-100',
            issue: 'bg-red-100',
        };
        const colorClass = annotationColors[interval.type] || 'bg-gray-100';
        parts.push(
            <span key={`anno-${i}`} className={`${colorClass} rounded px-1`}>
                {segmentText.substring(interval.start, interval.end)}
            </span>
        );
        currentIndex = interval.end;
    });

    if (currentIndex < segmentText.length) {
        parts.push(segmentText.substring(currentIndex));
    }

    return <>{parts}</>;
};

const PrintableReport: React.FC<PrintableReportProps> = ({ report, user }) => {
    const { video, ...otherMetrics } = report.metrics;
    const allMetrics = [
        ...Object.values(otherMetrics),
        ...(video ? Object.values(video) : [])
    ];
    
    return (
        <div className="font-sans bg-white text-[#2F4F4F]">
            {/* Branded Header */}
            <header className="bg-background-dark text-white p-6 rounded-lg mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                            <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                            <path d="M16 24C19.9298 24 23.141 21.412 24 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            <path d="M16 20C17.5752 20 18.9664 19.1411 19.6085 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                        <span className="font-heading text-2xl font-bold">Oratora</span>
                    </div>
                    <div className="text-right">
                        <h1 className="text-xl font-bold">Speech Analysis Report</h1>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border-dark flex justify-between text-sm text-text-secondary-dark">
                    <span>For: {user?.name || 'User'}</span>
                    <span>Date: {report.sessionDate}</span>
                </div>
            </header>

            <main>
                <Section title="Executive Summary">
                    <div className="flex items-center gap-8 bg-gray-50 p-6 rounded-lg">
                        <CircularScore score={report.overallScore} />
                        <div className="flex-grow space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
                                <div>
                                    <strong className="text-gray-700">Key Strength:</strong>
                                    <p className="text-sm text-gray-600">{report.feedback.strengths[0] || 'Good overall performance.'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-mustard mt-0.5">notification_important</span>
                                <div>
                                    <strong className="text-gray-700">Primary Focus Area:</strong>
                                    <p className="text-sm text-gray-600">{report.feedback.areasToWatch[0] || 'Maintain consistency.'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary mt-0.5">emoji_objects</span>
                                <div>
                                    <strong className="text-gray-700">Transformative Tip:</strong>
                                    <p className="text-sm text-gray-600">{report.feedback.transformativeTip}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>
                
                <div className="grid grid-cols-2 gap-x-8 mt-8">
                    <div>
                        <Section title="Key Metrics">
                            <div className="space-y-2">
                                {(allMetrics as Metric[]).map(metric => <MetricBar key={metric.label} metric={metric} />)}
                            </div>
                        </Section>

                        <Section title="7-Day Action Plan" className="mt-8">
                            <div className="space-y-1">
                                {report.actionPlan.map(day => (
                                    <div key={day.day} className={`p-2 rounded-lg flex gap-3 items-center text-sm ${day.isToday ? 'bg-primary/10 border border-primary/20' : ''}`}>
                                        <strong className={`flex-shrink-0 ${day.isToday ? 'text-primary' : 'text-gray-600'}`}>Day {day.day}:</strong>
                                        <span className="text-gray-700">{day.task}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>
                    
                    <div>
                        <Section title="AI Coach Feedback">
                            <div className="space-y-4">
                                <div className="bg-playful_green/10 p-4 rounded-lg">
                                    <h4 className="font-bold text-playful_green">Strengths</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                                        {report.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-mustard/10 p-4 rounded-lg">
                                    <h4 className="font-bold text-mustard">Areas to Watch</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                                        {report.feedback.areasToWatch.map((a, i) => <li key={i}>{a}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </Section>
                         <Section title="Phrase Alternatives" className="mt-8">
                            <div className="space-y-3">
                                {report.feedback.phraseAlternatives.map((p, i) => (
                                    <div key={i} className="text-sm border-l-4 border-gray-200 pl-3">
                                        <p className="text-accent line-through">"{p.original}"</p>
                                        <p className="text-playful_green font-medium">→ "{p.suggestion}"</p>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>
                </div>

                <Section title="Full Transcript & Annotations" className="print-break-before mt-8">
                    <div className="space-y-4 text-gray-800 leading-relaxed text-sm p-4 bg-gray-50 rounded-lg">
                        {report.transcriptSegments.map(segment => (
                            <div key={segment.startTime} className="print-avoid-break border-b border-gray-200 last:border-b-0 pb-2">
                                <p>
                                    <strong className="text-gray-500 font-mono text-xs mr-2">{new Date(segment.startTime * 1000).toISOString().substr(14, 5)}</strong>
                                    {renderAnnotatedTextForPrint(segment.text, segment.annotations)}
                                </p>
                            </div>
                        ))}
                    </div>
                </Section>
            </main>

            <footer className="text-center text-xs text-gray-400 mt-12 pt-4 border-t-2 border-primary">
                <p>Report generated for {user?.name || 'User'} by Oratora AI</p>
                <p className="font-bold">Speak Better. Sound Confident.</p>
            </footer>
        </div>
    );
};

export default PrintableReport;