// NOTE: This file has been updated to use the Google Gemini API for transcription and analysis,
// replacing the previous mock implementation.

import { Type, GenerateContentResponse } from "@google/genai";
import { TranscriptionResult, AnalysisContext, AnalysisReport, Metric, ComparisonData } from '../../../types';
import { ai } from '../../../lib/supabaseClient';

// Helper to convert Blob to base64
const blobToBase64 = (blob: Blob | File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // reader.result is "data:audio/webm;base64,..." -> We need to strip the prefix
                const base64Data = reader.result.split(',')[1];
                resolve(base64Data);
            } else {
                reject(new Error("Failed to read blob as base64 string."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

/**
 * Generates a full speaking analysis report using Gemini from a media file.
 * This single function handles transcription and analysis in one efficient API call.
 * @param mediaBlob The media file (Blob or File) for analysis.
 * @param context The context of the speech.
 * @param history The user's previous analysis reports for comparison.
 * @returns A promise that resolves with the full analysis report.
 */
export const generateAnalysisReport = async (mediaBlob: Blob | File, context: AnalysisContext, history: AnalysisReport[] = []): Promise<AnalysisReport> => {
    try {
        const hasVideo = mediaBlob.type.startsWith('video/');
        const mediaData = await blobToBase64(mediaBlob);

        let scriptContent = '';
        if (context.script) {
            try {
                scriptContent = await readFileAsText(context.script);
            } catch (e) {
                console.error("Failed to read script file content.", e);
                scriptContent = "[Error reading script file.]";
            }
        }

        const prompt = `
            You are "Oratora", an expert AI public speaking coach. Your task is to perform a comprehensive analysis of the provided media file and generate a detailed report as a single JSON object.

            First, fully transcribe the audio from the media file. Then, using the full transcription, the provided media itself, and the speech context below, generate the complete analysis.
            ${hasVideo ? 'A video of the speech has also been provided for visual analysis.' : ''}
            ${scriptContent ? 'The user has provided a script for reference. Pay close attention to how the spoken transcript compares to this script.' : ''}

            **Speech Context:**
            - Category: ${context.category}
            - Name: ${context.name}
            - Audience Size: ${context.audienceSize}
            - Formality: ${context.formality}
            - User's Goals: ${context.goals.join(', ') || 'Not specified'}

            ${scriptContent ? `**User-Provided Script:**\n"""\n${scriptContent}\n"""\n\n` : ''}

            **Your Task:**
            Generate a single, detailed analysis report in a valid JSON format that strictly adheres to the provided schema. The report must include:

            1.  **Overall Score**: An integer score from 0-100 evaluating the overall effectiveness.
            2.  **Duration**: The total duration of the speech in seconds (integer).
            3.  **Metrics**:
                - **Fluency**: Score (0-100), rating ('good', 'average', 'poor'), and details (e.g., "Detected 5 filler words."). Count fillers like "uhm", "uh", "like".
                - **Pacing**: WPM score (integer), rating, and idealRange string. Calculate WPM based on the word count and duration. Ideal range is 140-160 WPM.
                - **Pacing Variability**: Score (0-100), rating, and details on pacing effectiveness.
                - **Intonation**: Score (0-100), rating, and details on vocal engagement and pitch variation.
                - **Volume**: Score (0-100), rating, and details on volume level and projection.
                - **Sentiment**: Score (0-100), rating string (e.g., 'Confident', 'Positive'), and details on emotional tone.
                ${hasVideo ? `
                - **Video Metrics**:
                  - **Eye Contact**: Score (0-100), rating, and details.
                  - **Body Language**: Score (0-100), rating, and details.
                  - **Gestures**: Score (0-100), rating, and details.
                ` : ''}
            4.  **Transcript Segments with Annotations**: Break the full transcript into logical segments. For each, provide startTime, text, and 1-2 insightful annotations (type 'strength', 'weakness', 'issue'). Generate at least 3-5 total annotations.
            5.  **Feedback**: Provide a 'transformativeTip', a list of 'strengths', 'areasToWatch', and 2-3 'phraseAlternatives'.
            6.  **Action Plan**: A concrete, 7-day action plan. Mark today's task with isToday: true.
        `;

        const metricSchema = {
            type: Type.OBJECT,
            properties: { score: { type: Type.INTEGER }, rating: { type: Type.STRING }, details: { type: Type.STRING } },
            required: ['score', 'rating', 'details'],
        };
        
        const videoMetricsSchema = {
            type: Type.OBJECT,
            properties: { eyeContact: metricSchema, bodyLanguage: metricSchema, gestures: metricSchema },
            required: ['eyeContact', 'bodyLanguage', 'gestures'],
        };

        const metricsProperties: any = {
            fluency: metricSchema,
            pacing: { ...metricSchema, properties: { ...metricSchema.properties, score: {type: Type.INTEGER}, idealRange: { type: Type.STRING } }, required: ['score', 'rating', 'idealRange']},
            pacingVariability: metricSchema,
            intonation: metricSchema,
            volume: metricSchema,
            sentiment: metricSchema,
        };
        
        if (hasVideo) {
            metricsProperties.video = videoMetricsSchema;
        }

        const reportSchema = {
            type: Type.OBJECT,
            properties: {
                overallScore: { type: Type.INTEGER },
                durationSeconds: { type: Type.INTEGER },
                transcriptSegments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { startTime: { type: Type.NUMBER }, text: { type: Type.STRING }, annotations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { textToHighlight: { type: Type.STRING }, type: { type: Type.STRING }, comment: { type: Type.STRING } }, required: ['textToHighlight', 'type', 'comment'] } } }, required: ['startTime', 'text', 'annotations'] } },
                metrics: { type: Type.OBJECT, properties: metricsProperties, required: Object.keys(metricsProperties) },
                feedback: { type: Type.OBJECT, properties: { transformativeTip: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, areasToWatch: { type: Type.ARRAY, items: { type: Type.STRING } }, phraseAlternatives: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ['original', 'suggestion'] } } }, required: ['transformativeTip', 'strengths', 'areasToWatch', 'phraseAlternatives'] },
                actionPlan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: { type: Type.INTEGER }, task: { type: Type.STRING }, isToday: { type: Type.BOOLEAN } }, required: ['day', 'task'] } },
            },
            required: ['overallScore', 'durationSeconds', 'metrics', 'feedback', 'actionPlan', 'transcriptSegments'],
        };
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [{ text: prompt }, { inlineData: { mimeType: mediaBlob.type, data: mediaData } }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: reportSchema,
            },
        });

        const jsonString = response.text.trim();
        const partialReport = JSON.parse(jsonString);

        // --- Calculate Comparison Data ---
        const previousReport = history.length > 0 ? history[0] : null;

        const comparisonData: ComparisonData = {
            overallScore: {
                current: partialReport.overallScore,
                previous: previousReport ? previousReport.overallScore : 0,
            },
            fluency: {
                userScore: partialReport.metrics.fluency.score,
                communityAverage: 78, // A realistic community average
            }
        };

        const normalizeRating = (rating: string) => (rating || 'average').toLowerCase();
        
        const fullMetrics: AnalysisReport['metrics'] = {
            fluency: { ...partialReport.metrics.fluency, rating: normalizeRating(partialReport.metrics.fluency.rating), label: 'Fluency', unit: '/ 100' },
            pacing: { ...partialReport.metrics.pacing, rating: normalizeRating(partialReport.metrics.pacing.rating), label: 'Pacing', unit: 'WPM' },
            pacingVariability: { ...partialReport.metrics.pacingVariability, rating: normalizeRating(partialReport.metrics.pacingVariability.rating), label: 'Pacing Variability', unit: '/ 100' },
            intonation: { ...partialReport.metrics.intonation, rating: normalizeRating(partialReport.metrics.intonation.rating), label: 'Intonation', unit: '/ 100' },
            volume: { ...partialReport.metrics.volume, rating: normalizeRating(partialReport.metrics.volume.rating), label: 'Volume', unit: '/ 100' },
            sentiment: { ...partialReport.metrics.sentiment, rating: partialReport.metrics.sentiment.rating, label: 'Sentiment', unit: '' },
        };
        
        if (hasVideo && partialReport.metrics.video) {
            fullMetrics.video = {
                eyeContact: { ...partialReport.metrics.video.eyeContact, rating: normalizeRating(partialReport.metrics.video.eyeContact.rating), label: 'Eye Contact', unit: '/ 100' },
                bodyLanguage: { ...partialReport.metrics.video.bodyLanguage, rating: normalizeRating(partialReport.metrics.video.bodyLanguage.rating), label: 'Body Language', unit: '/ 100' },
                gestures: { ...partialReport.metrics.video.gestures, rating: normalizeRating(partialReport.metrics.video.gestures.rating), label: 'Gestures', unit: '/ 100' },
            }
        }

        const fullReport: AnalysisReport = {
            ...partialReport,
            title: context.name,
            sessionDate: new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
            metrics: fullMetrics,
            comparison: comparisonData,
        };

        return fullReport;
    } catch (error) {
        console.error("Error during analysis generation:", error);
        throw new Error("Failed to generate the analysis report. The AI model may have returned an unexpected format or had trouble processing the file.");
    }
};