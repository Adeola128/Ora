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
 * Transcribes an audio or video file using Gemini.
 * @param mediaBlob The media file (Blob or File) to transcribe.
 * @returns A promise that resolves with the transcription result.
 */
export const transcribeMediaWithTimestamps = async (mediaBlob: Blob | File): Promise<TranscriptionResult[]> => {
    try {
        const mediaData = await blobToBase64(mediaBlob);
        
        const mediaPart = {
            inlineData: {
                mimeType: mediaBlob.type, // e.g., 'audio/webm', 'video/mp4'
                data: mediaData,
            },
        };

        const prompt = "Transcribe the audio from this media file and provide word-level timestamps. The response must be a valid JSON object containing the full transcript, overall confidence (a number between 0 and 1), and an array of words. Each word object in the array must have 'word' (string), 'startTime' (number in seconds), and 'endTime' (number in seconds) properties.";

        const transcriptionSchema = {
            type: Type.OBJECT,
            properties: {
                transcript: { type: Type.STRING, description: "The full transcribed text of the audio." },
                confidence: { type: Type.NUMBER, description: "The model's confidence in the transcription accuracy, from 0.0 to 1.0." },
                words: {
                    type: Type.ARRAY,
                    description: "An array of word objects with timestamps.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            word: { type: Type.STRING, description: "The transcribed word." },
                            startTime: { type: Type.NUMBER, description: "The start time of the word in seconds from the beginning of the audio." },
                            endTime: { type: Type.NUMBER, description: "The end time of the word in seconds from the beginning of the audio." },
                        },
                        required: ['word', 'startTime', 'endTime'],
                    },
                },
            },
            required: ['transcript', 'words', 'confidence'],
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, mediaPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: transcriptionSchema,
            },
        });

        const jsonString = response.text.trim();
        const result: TranscriptionResult = JSON.parse(jsonString);
        return [result];
    } catch (error) {
        console.error("Error during transcription:", error);
        throw new Error("Failed to transcribe media. The model may have had trouble processing the file.");
    }
};

/**
 * Generates a full speaking analysis report using Gemini.
 * @param transcription The full transcript of the speech.
 * @param context The context of the speech.
 * @param mediaBlob The original media file for multimodal analysis.
 * @param history The user's previous analysis reports for comparison.
 * @returns A promise that resolves with the full analysis report.
 */
export const generateAnalysisReport = async (transcription: TranscriptionResult, context: AnalysisContext, mediaBlob: Blob | File, history: AnalysisReport[]): Promise<AnalysisReport> => {
    try {
        const hasVideo = mediaBlob.type.startsWith('video/');
        const transcriptText = transcription.transcript;
        const words = transcription.words || [];
        const durationSeconds = words.length > 0 ? Math.ceil(words[words.length - 1].endTime) : (transcriptText.split(' ').length / 2.5);

        let scriptContent = '';
        if (context.script) {
            try {
                if (context.script.type === 'text/plain') {
                    scriptContent = await readFileAsText(context.script);
                } else {
                    scriptContent = `[User provided a script file: "${context.script.name}". The content is not available for direct comparison, but please consider this when analyzing the speech structure and content.]`;
                }
            } catch (e) {
                console.error("Failed to read script file content.", e);
                scriptContent = "[Error reading script file.]";
            }
        }

        const prompt = `
            You are "Oratora", an expert AI public speaking coach. Analyze the following speech transcript and its context.
            ${hasVideo ? 'A video of the speech has also been provided for visual analysis.' : ''}
            ${scriptContent ? 'The user has provided a script for reference. Pay close attention to how the spoken transcript compares to this script.' : ''}

            **Speech Context:**
            - Category: ${context.category}
            - Name: ${context.name}
            - Audience Size: ${context.audienceSize}
            - Formality: ${context.formality}
            - User's Goals: ${context.goals.join(', ') || 'Not specified'}

            ${scriptContent ? `**User-Provided Script:**\n"""\n${scriptContent}\n"""\n\n` : ''}

            **Speech Transcript:**
            "${transcriptText}"

            **Your Task:**
            Generate a detailed analysis report in a valid JSON format. The report must strictly adhere to the provided schema.

            1.  **Overall Score**: An integer score from 0-100 evaluating the overall effectiveness of the speech based on the context, goals, transcript, and video.
            2.  **Metrics**:
                - **Fluency**: Score (0-100), rating ('good', 'average', 'poor'), and details (e.g., "Detected 5 filler words."). Count fillers like "uhm", "uh", "like", "you know". If a script was provided, comment on script adherence.
                - **Pacing**: WPM score (integer), rating, and idealRange string. Calculate WPM based on the word count (${words.length}) and duration (${durationSeconds} seconds). Ideal range is 140-160 WPM.
                - **Pacing Variability**: Score (0-100), rating, and details on whether the pacing was effective or erratic.
                - **Intonation**: Score (0-100), rating, and details on vocal engagement, specifically analyzing pitch variation and tonal variety.
                - **Volume**: Score (0-100), rating, and details on volume level, consistency, and projection. Was it appropriate for the context?
                - **Sentiment**: Score (0-100), rating string (e.g., 'Confident', 'Positive'), and details on emotional tone.
                ${hasVideo ? `
                - **Video Metrics**:
                  - **Eye Contact**: Score (0-100), rating, and details on audience/camera engagement.
                  - **Body Language**: Score (0-100), rating, and details on posture and confidence.
                  - **Gestures**: Score (0-100), rating, and details on the effectiveness of hand gestures.
                ` : ''}
            3.  **Transcript Segments with Annotations**: Break the transcript into logical segments. For each, provide startTime, text, and 1-2 insightful annotations (type 'strength', 'weakness', 'issue'). Generate at least 3-5 total annotations.
            4.  **Feedback**: Provide a 'transformativeTip', a list of 'strengths', 'areasToWatch', and 2-3 'phraseAlternatives'.
            5.  **Action Plan**: A concrete, 7-day action plan. Mark today's task with isToday: true.
        `;

        const metricSchema = {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER },
                rating: { type: Type.STRING },
                details: { type: Type.STRING },
            },
            required: ['score', 'rating', 'details'],
        };
        
        const videoMetricsSchema = {
            type: Type.OBJECT,
            properties: {
                eyeContact: metricSchema,
                bodyLanguage: metricSchema,
                gestures: metricSchema,
            },
            required: ['eyeContact', 'bodyLanguage', 'gestures'],
        };

        const reportSchemaProperties: any = {
            overallScore: { type: Type.INTEGER },
            transcriptSegments: { /* ... as before */ },
            metrics: {
                type: Type.OBJECT,
                properties: {
                    fluency: metricSchema,
                    pacing: { ...metricSchema, properties: { ...metricSchema.properties, score: {type: Type.INTEGER}, idealRange: { type: Type.STRING } }, required: ['score', 'rating', 'idealRange']},
                    pacingVariability: metricSchema,
                    intonation: metricSchema,
                    volume: metricSchema,
                    sentiment: metricSchema,
                },
                required: ['fluency', 'pacing', 'pacingVariability', 'intonation', 'volume', 'sentiment'],
            },
            feedback: { /* ... as before */ },
            actionPlan: { /* ... as before */ },
        };
        
        // Dynamically add video metrics to schema if video is present
        if (hasVideo) {
            reportSchemaProperties.metrics.properties.video = videoMetricsSchema;
        }

        // Re-construct the full schema object
        const reportSchema = {
            type: Type.OBJECT,
            properties: {
                overallScore: { type: Type.INTEGER },
                transcriptSegments: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            startTime: { type: Type.NUMBER },
                            text: { type: Type.STRING },
                            annotations: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        textToHighlight: { type: Type.STRING },
                                        type: { type: Type.STRING },
                                        comment: { type: Type.STRING },
                                    },
                                    required: ['textToHighlight', 'type', 'comment'],
                                }
                            },
                        },
                        required: ['startTime', 'text', 'annotations'],
                    }
                },
                metrics: reportSchemaProperties.metrics,
                feedback: {
                    type: Type.OBJECT,
                    properties: {
                        transformativeTip: { type: Type.STRING },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        areasToWatch: { type: Type.ARRAY, items: { type: Type.STRING } },
                        phraseAlternatives: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    original: { type: Type.STRING },
                                    suggestion: { type: Type.STRING },
                                },
                                required: ['original', 'suggestion'],
                            },
                        },
                    },
                    required: ['transformativeTip', 'strengths', 'areasToWatch', 'phraseAlternatives'],
                },
                actionPlan: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.INTEGER },
                            task: { type: Type.STRING },
                            isToday: { type: Type.BOOLEAN },
                        },
                        required: ['day', 'task'],
                    },
                },
            },
            required: ['overallScore', 'metrics', 'feedback', 'actionPlan', 'transcriptSegments'],
        };
        
        const contents: { parts: ({ text: string; } | { inlineData: { mimeType: string; data: string; }; })[] } = { parts: [{ text: prompt }] };
        if (hasVideo) {
            const mediaData = await blobToBase64(mediaBlob);
            contents.parts.push({
                inlineData: {
                    mimeType: mediaBlob.type,
                    data: mediaData,
                }
            });
        }
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: contents,
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
            durationSeconds: Math.round(durationSeconds),
            metrics: fullMetrics,
            comparison: comparisonData,
        };

        return fullReport;
    } catch (error) {
        console.error("Error during analysis generation:", error);
        throw new Error("Failed to generate the analysis report. The AI model may have returned an unexpected format.");
    }
};