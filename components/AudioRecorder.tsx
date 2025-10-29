import React, { useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import AudioWaveform from './onboarding/AudioWaveform';

interface AudioRecorderProps {
    onRecordingUpdate: (audioBlob: Blob | null) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingUpdate }) => {
    const { status, startRecording, stopRecording, audioBlob, resetRecording, audioData } = useAudioRecorder();

    // Notify parent component whenever the audioBlob state changes
    useEffect(() => {
        onRecordingUpdate(audioBlob);
    }, [audioBlob, onRecordingUpdate]);

    const handleRecord = () => {
        if (status === 'idle' || status === 'stopped') {
            resetRecording(); // This will set audioBlob to null and notify parent
            startRecording();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 p-4">
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">Record Directly in Browser</h3>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark text-center">Click the microphone to start recording your speech. Click stop when you are finished.</p>
            
            <div className="flex flex-col items-center justify-center gap-4 my-4">
                <button 
                    type="button" 
                    onClick={status === 'recording' ? stopRecording : handleRecord} 
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-200 transform hover:scale-105 shadow-lg ${status === 'recording' ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary-700'}`}
                >
                    <span className="material-symbols-outlined text-4xl">{status === 'recording' ? 'stop' : 'mic'}</span>
                </button>
                <p className="text-sm font-medium text-text-light dark:text-text-dark h-5">
                    {status === 'recording' ? 'Recording...' : status === 'stopped' ? 'Recording finished. Press Analyze below.' : 'Ready to record'}
                </p>
            </div>

            <div className="w-full h-20 relative">
                <AudioWaveform audioData={audioData} color={status === 'recording' ? '#4F46E5' : '#6B7280'} />
                {audioBlob && status === 'stopped' && (
                    <div className="absolute inset-0 bg-card-light/80 dark:bg-card-dark/80 flex items-center justify-center gap-4">
                        <audio src={URL.createObjectURL(audioBlob)} controls className="max-w-[200px]" />
                        <button type="button" onClick={handleRecord} className="text-primary hover:underline text-sm font-medium p-2 rounded-md">
                            Record Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioRecorder;
