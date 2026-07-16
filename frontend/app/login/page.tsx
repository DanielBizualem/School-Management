'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import summeryApi from "@/common/summeryApi";
import Axios from "@/utils/Axios";
import { BookOpen } from "lucide-react";


export default function Login() {
    const [credentials, setCredentials] = useState({ identifier: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {

            const response = await Axios({
                ...summeryApi.login,
                data:credentials
            })

            if (response.data.success) {
                // Save tokens
                localStorage.setItem("accessToken", response.data.accessToken);
                localStorage.setItem("refreshToken", response.data.refreshToken);
                const role = response.data.user.role; 
                console.log("Logged in user role:", role);
                // Role-based routing map
                const roleRoutes: Record<string, string> = {
                    admin: "/admin/dashboard",
                    director: "/director/dashboard",
                    teacher: "/teacher/profile",
                    student: "/student/dashboard",
                    parent: "/parent/dashboard",
                };

                const targetPath = roleRoutes[response.data.user.role] || "/dashboard";
                router.push(targetPath);
            } else {
                alert(response.data.message || "Invalid credentials. Please try again.");
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Connection error. Please check your server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl border border-slate-200 shadow-sm">
                
                <div className="text-center mb-8">
                    <div className="w-15 h-15 bg-teal-50 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-sm">
                        <BookOpen className="w-7 h-7 text-teal-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">ONESMOS NESIB</h1>
                    <p className="text-slate-500 text-sm mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                        <input 
                            type="text" 
                            placeholder="Enter your email" 
                            value={credentials.identifier}
                            onChange={e => setCredentials({...credentials, identifier: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition" 
                            required 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter your password" 
                                value={credentials.password}
                                onChange={e => setCredentials({...credentials, password: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition" 
                                required 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-slate-400 hover:text-teal-600 transition"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3.5 bg-slate-900 text-white font-semibold text-sm rounded-xl hover:bg-slate-800 transition shadow-md mt-2"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}