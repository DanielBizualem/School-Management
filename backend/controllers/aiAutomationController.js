import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fetchStudentTranscriptData } from './directorController.js'; // Import helper

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const handleAIAgentQuery = async (req, res) => {
    const userPrompt = req.body.prompt;

    if (!userPrompt) {
        return res.status(400).json({ success: false, message: "Prompt is required." });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: userPrompt,
            config: {
                tools: [{
                    functionDeclarations: [
                        {
                            name: "getStudentTranscript",
                            description: "Fetches the academic transcript and multi-year grades for a student using their student ID.",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    studentId: { 
                                        type: "STRING", 
                                        description: "The student ID, e.g. std/00023/26" 
                                    }
                                },
                                required: ["studentId"]
                            }
                        }
                    ]
                }]
            }
        });

        const functionCalls = response.functionCalls;
        if (Array.isArray(functionCalls) && functionCalls.length > 0) {
            const call = functionCalls[0];

            if (call.name === "getStudentTranscript") {
                const studentId = call.args?.studentId;
                
                // Call the helper function directly with the string ID
                const transcriptData = await fetchStudentTranscriptData(studentId);
                
                return res.json({
                    success: true,
                    toolUsed: call.name,
                    argumentsUsed: call.args,
                    data: transcriptData
                });
            }
        }

        return res.json({ 
            success: true, 
            answer: response.text || "I processed your request." 
        });

    } catch (error) {
        console.error("AI Agent Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Agent failed to process request." });
    }
};