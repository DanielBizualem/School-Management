// Append to your existing services/aiService.js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });

export const generateReportComment = async ({ studentName, courseName, mark }) => {
    const prompt = `
        You are a professional high school teacher. Write a short, constructive, and encouraging 
        report card performance evaluation (2-3 sentences max) for a student named "${studentName}" 
        who currently has a score of ${mark}% in the course "${courseName}".
        
        Guidelines based on performance:
        - If the mark is high (85%+): Praise their work ethic and encourage them to keep pushing.
        - If the mark is average (70%-84%): Acknowledge their steady progress but point out consistency or participation as areas to refine.
        - If the mark is struggling (below 70%): Keep the tone highly supportive, focus on growth, and recommend seeking extra help or tutoring.
        
        Keep the output purely as the text comment. Do not include introductory phrases or quotes.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("AI Comment Generation Error:", error);
        return "Demonstrates ongoing participation in the curriculum. Continued focus on course material is advised.";
    }
};