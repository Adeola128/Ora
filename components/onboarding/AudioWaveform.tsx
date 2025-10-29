import React, { useRef, useEffect } from 'react';

interface AudioWaveformProps {
    audioData: Float32Array;
    color: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ audioData, color }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) return;

        context.clearRect(0, 0, width, height);
        context.lineWidth = 2;
        context.strokeStyle = color;
        context.beginPath();

        const sliceWidth = (width * 1.0) / audioData.length;
        let x = 0;

        for (let i = 0; i < audioData.length; i++) {
            const v = audioData[i] * height * 0.5; // Scale amplitude to half of canvas height
            const y = height / 2 + v;

            if (i === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }

            x += sliceWidth;
        }

        context.lineTo(width, height / 2);
        context.stroke();
    }, [audioData, color]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default AudioWaveform;
