"use client"
import React, { useState } from 'react';
import Axios from '@/utils/Axios.js';
import summeryApi from '@/common/summeryApi';

interface Message {
    sender: 'user' | 'agent';
    text: string;
    payload?: any;
}

export default function AICommandAssistant() {
    const [prompt, setPrompt] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;

        const userMessage = prompt.trim();
        setPrompt('');
        setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);

        try {
            setLoading(true);

            // Call your backend AI agent endpoint
            const apiConfig = summeryApi.aiAgentQuery;
            const res = await Axios({
                ...apiConfig,
                data: { prompt: userMessage }
            });

            if (res.data?.success) {
                setMessages((prev) => [
                    ...prev,
                    { 
                        sender: 'agent', 
                        text: res.data.answer || "Here is the information you requested:",
                        payload: res.data.data // Handles structured data like transcripts if returned
                    }
                ]);
            } else {
                setMessages((prev) => [...prev, { sender: 'agent', text: "Sorry, I couldn't process that request." }]);
            }
        } catch (error) {
            console.error("AI Agent error:", error);
            setMessages((prev) => [...prev, { sender: 'agent', text: "Server error while communicating with the AI agent." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 max-w-2xl mx-auto my-6 flex flex-col h-[500px]">
            <div className="border-b pb-3 mb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    🤖 School Management AI Assistant
                </h3>
                <p className="text-xs text-gray-500">Ask questions or request student records using natural language.</p>
            </div>

            {/* Chat History Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-20">
                        Try asking: <span className="italic text-blue-600">"Get transcript for std/00024/26"</span>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`p-3 rounded-lg max-w-[85%] ${
                                msg.sender === 'user' 
                                    ? 'ml-auto bg-blue-600 text-white' 
                                    : 'mr-auto bg-gray-100 text-slate-800 border border-gray-200'
                            }`}
                        >
                            <p className="font-medium">{msg.text}</p>
                            
                            {/* If the agent returned structured data (like transcript details), render a summary view */}
                            {msg.payload && (
                                <div className="mt-2 pt-2 border-t border-gray-300 text-slate-700 space-y-1">
                                    <p className="font-bold">Student: {msg.payload.student?.fullName}</p>
                                    <p className="font-mono">ID: {msg.payload.student?.studentID}</p>
                                    <p className="text-[10px] text-emerald-600 font-semibold">Records successfully fetched by agent tool.</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
                {loading && (
                    <div className="mr-auto bg-gray-100 text-gray-500 p-3 rounded-lg text-xs animate-pulse">
                        AI agent is thinking and executing tools...
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mt-3 flex gap-2 pt-2 border-t">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type a command or question..."
                    className="flex-1 px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    );
}