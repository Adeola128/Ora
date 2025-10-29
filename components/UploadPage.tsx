import React, { useState, useCallback } from 'react';
import { AnalysisContext } from '../types';
import AudioRecorder from './AudioRecorder';
import VideoRecorder from './VideoRecorder';

interface UploadPageProps {
    context: AnalysisContext | null;
    onBack: () => void;
    onAnalysisStart: (media: Blob | File) => void;
    onNavigateToLivePractice: () => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ context, onBack, onAnalysisStart }) => {
    const [media, setMedia] = useState<Blob | File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMediaUpdate = useCallback((blob: Blob | null) => {
        setMedia(blob);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setMedia(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (e.dataTransfer.files[0].type.startsWith('audio/') || e.dataTransfer.files[0].type.startsWith('video/')) {
                setMedia(e.dataTransfer.files[0]);
            } else {
                alert('Please upload a valid audio or video file.');
            }
        }
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleAnalyze = () => {
        if (media) {
            onAnalysisStart(media);
        }
    };

    const isReadyToAnalyze = media !== null;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                 {/* Breadcrumbs */}
                 <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={onBack} className="text-text-muted-light dark:text-text-muted-dark text-base font-medium leading-normal hover:text-primary">Dashboard</button>
                    <span className="text-text-muted-dark dark:text-text-muted-dark/50">/</span>
                    <button onClick={onBack} className="text-text-muted-light dark:text-text-muted-dark text-base font-medium leading-normal hover:text-primary">Context</button>
                    <span className="text-text-muted-dark dark:text-text-muted-dark/50">/</span>
                    <span className="text-primary text-base font-medium leading-normal">Upload</span>
                </div>
                
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-black text-text-light dark:text-text-dark tracking-tight">Submit Your Speech</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-2 text-lg">Upload or record your speech to get started. Video is recommended for the most comprehensive feedback.</p>
                </header>

                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                     {/* Left side: Upload and Record Options */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-text-light dark:text-text-dark flex items-center gap-2"><span className="material-symbols-outlined text-primary">upload_file</span>Upload a File</h3>
                            <div 
                                onDrop={handleDrop}
                                onDragEnter={handleDragEvents}
                                onDragOver={handleDragEvents}
                                onDragLeave={handleDragEvents}
                                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border-light dark:border-border-dark'}`}
                            >
                                <span className="material-symbols-outlined text-5xl text-text-muted-light dark:text-text-muted-dark">cloud_upload</span>
                                <p className="mt-2 text-text-light dark:text-text-dark font-semibold">Drag &amp; Drop audio or video</p>
                                <p className="text-text-muted-light dark:text-text-muted-dark text-sm">or</p>
                                <label htmlFor="file-upload" className="mt-2 cursor-pointer text-primary font-semibold hover:underline">
                                    Browse Files
                                </label>
                                <input id="file-upload" type="file" className="hidden" accept="audio/*,video/*" onChange={handleFileChange} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-text-light dark:text-text-dark flex items-center gap-2"><span className="material-symbols-outlined text-primary">mic</span>Record Audio Only</h3>
                            <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm border border-border-light dark:border-border-dark">
                                <AudioRecorder onRecordingUpdate={handleMediaUpdate} />
                            </div>
                        </div>
                    </div>

                     {/* Right side: Video Recording */}
                    <div className="flex flex-col">
                        <h3 className="text-xl font-semibold mb-3 text-text-light dark:text-text-dark flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">videocam</span>Record with Webcam (Recommended)
                        </h3>
                        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm flex-grow border border-border-light dark:border-border-dark">
                            <VideoRecorder onRecordingUpdate={handleMediaUpdate} />
                        </div>
                    </div>
                </div>

                {media && (
                    <div className="p-4 mt-4">
                        <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-between shadow-sm animate-fade-in border border-primary/20">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="material-symbols-outlined text-primary flex-shrink-0">check_circle</span>
                                <span className="text-sm font-medium text-text-light dark:text-text-dark truncate">Ready to analyze: {media instanceof File ? media.name : `${media.type} recording`}</span>
                            </div>
                            <button onClick={() => setMedia(null)} className="text-text-muted-light dark:text-text-muted-dark hover:text-red-500 flex-shrink-0">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                )}


                {/* Footer Navigation */}
                <div className="flex justify-between items-center p-4 mt-8 border-t border-border-light dark:border-border-dark">
                    <button onClick={onBack} className="text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-primary text-sm font-medium">Back to Context</button>
                    <button 
                        onClick={handleAnalyze} 
                        disabled={!isReadyToAnalyze} 
                        className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>Analyze Speech</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;