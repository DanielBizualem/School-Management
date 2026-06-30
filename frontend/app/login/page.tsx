'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAPI } from "@/services/authApi";

export default function AdminLoginPage(): React.JSX.Element {
    const router = useRouter();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await loginAPI({ email, password });
            
            if (response.success || response.token) {
                // 1. Persist the access token if using authorization headers structure
                const token = response.token || response.data?.token;
                if (token) {
                    localStorage.setItem("accessToken", token);
                }
                
                // 2. Clear credentials state and push directly to dashboard index
                router.push("/admin/dashboard");
            } else {
                setErrorMessage(response.message || "Invalid administrative credentials provided.");
            }
        } catch (error: any) {
            console.error("Login authorization error:", error);
            setErrorMessage(
                error.response?.data?.message || 
                "Authentication transaction rejected. Please check connection."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-4 antialiased text-slate-900">
            <div className="w-full max-w-sm bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                
                {/* Brand Header Identity */}
                <div className="text-center space-y-1.5">
                    <h1 className="text-base font-black uppercase tracking-tight text-slate-900">
                        Institutional Portal
                    </h1>
                    <p className="text-3xs text-slate-400 font-bold uppercase tracking-widest">
                        Administrative Core Gateway
                    </p>
                </div>

                {/* Error Banner Notification */}
                {errorMessage && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-2xs font-medium animate-fadeIn">
                        ⚠️ {errorMessage}
                    </div>
                )}

                {/* Credential Data Form Entry Grid */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-3xs font-bold uppercase text-slate-400 tracking-wider">
                            Account Email Address
                        </label>
                        <input 
                            type="email" 
                            placeholder="admin@institution.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition" 
                            required 
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-3xs font-bold uppercase text-slate-400 tracking-wider">
                            Secret Access Key
                        </label>
                        <input 
                            type="password" 
                            placeholder="••••••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition" 
                            required 
                            disabled={loading}
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-slate-950 hover:bg-black text-white font-black text-xs py-3 rounded-xl transition-all shadow-2xs disabled:bg-slate-300 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            {loading ? "Authorizing Identity..." : "Sign In to Workspace"}
                        </button>
                    </div>
                </form>

                {/* Secure Layer Disclaimer Note */}
                <div className="text-center pt-2 border-t border-slate-50">
                    <span className="text-3xs text-slate-400 font-medium">
                        Authorized Personnel Only • TLS Encrypted Link
                    </span>
                </div>
            </div>
        </div>
    );
}