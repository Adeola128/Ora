import React from 'react';
import { AnalysisReport } from '../types';

interface HistoryPageProps {
    history: AnalysisReport[];
    onViewReport: (report: AnalysisReport) => void;
    onNavigateToNewAnalysis: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, onViewReport, onNavigateToNewAnalysis }) => {
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Session History</h1>
            {history.length === 0 ? (
                 <div className="text-center p-12 bg-card-light dark:bg-card-dark rounded-xl border-2 border-dashed border-border-light dark:border-border-dark">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4">history</span>
                    <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">No History Yet</h2>
                    <p className="mt-2 text-text-muted-light dark:text-text-muted-dark">You haven't completed any analysis sessions yet.</p>
                    <button onClick={onNavigateToNewAnalysis} className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
                        Start Your First Analysis
                    </button>
                </div>
            ) : (
                <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                            <thead className="bg-background-light dark:bg-background-dark/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Title</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Overall Score</th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">View Report</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {history.map((report, index) => (
                                    <tr key={index} className="hover:bg-background-light dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{report.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted-light dark:text-text-muted-dark">{report.sessionDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">{report.overallScore}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => onViewReport(report)} className="text-primary font-semibold hover:underline">
                                                View Details →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;