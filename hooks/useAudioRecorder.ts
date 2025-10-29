// Fix: Implemented a custom hook for handling audio recording logic.
import { useState, useRef, useEffect } from 'react';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

export const useAudioRecorder = () => {
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [audioData, setAudioData] = useState<Float32Array>(new Float32Array(0));
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const getMicrophonePermission = async () => {
        if ("MediaRecorder" in window) {
            try {
                const streamData = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });
                setStream(streamData);
                return streamData;
            } catch (err: any) {
                alert(err.message);
                return null;
            }
        } else {
            alert("The MediaRecorder API is not supported in your browser.");
            return null;
        }
    };
    
    const startRecording = async () => {
        const localStream = stream || await getMicrophonePermission();
        if (!localStream) return;

        setStatus('recording');
        const mediaRecorder = new MediaRecorder(localStream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        // Audio visualization setup
        // Fix: Cast window to `any` to allow access to the vendor-prefixed `webkitAudioContext` for older browsers.
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(localStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        const dataArray = new Float32Array(analyser.frequencyBinCount);
        
        const updateAudioData = () => {
            if (analyserRef.current) {
                analyserRef.current.getFloatTimeDomainData(dataArray);
                setAudioData(new Float32Array(dataArray));
                animationFrameRef.current = requestAnimationFrame(updateAudioData);
            }
        };
        animationFrameRef.current = requestAnimationFrame(updateAudioData);

        mediaRecorder.start();
        let localAudioChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
            if (typeof event.data === "undefined") return;
            if (event.data.size === 0) return;
            localAudioChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(localAudioChunks, { type: 'audio/webm' });
            setAudioBlob(blob);
            localAudioChunks = [];
        };
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            setStatus('stopped');
            mediaRecorderRef.current.stop();

            // Clean up stream and context
            stream?.getTracks().forEach(track => track.stop());
            setStream(null);
            audioContextRef.current?.close();
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    };

    const resetRecording = () => {
        setStatus('idle');
        setAudioBlob(null);
        setAudioData(new Float32Array(0));
        mediaRecorderRef.current = null;
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stream?.getTracks().forEach(track => track.stop());
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [stream]);

    return { status, audioBlob, startRecording, stopRecording, resetRecording, audioData };
};