'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import summeryApi from "@/common/summeryApi";
import Axios from "@/utils/Axios";
import { BookOpen, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";


export default function Login() {
    const [credentials, setCredentials] = useState({ identifier: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleChange = (field: "identifier" | "password", value: string) => {
        setCredentials(prev => ({ ...prev, [field]: value }));
        if (error) setError(""); // clear error as soon as they start correcting it
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await Axios({
                ...summeryApi.login,
                data: credentials
            });

            if (response.data.success) {
                localStorage.setItem("accessToken", response.data.accessToken);

                const rawRole =
                    response.data.user?.role ||
                    response.data.role ||
                    response.data.user?.profile?.role ||
                    "";

                const role = rawRole.toLowerCase();

                const roleRoutes: Record<string, string> = {
                    admin: "/admin/analytics",
                    director: "/director/analytics",
                    teacher: "/teacher/profile",
                    student: "/student/profile",
                };

                router.push(roleRoutes[role] || "/dashboard");
            } else {
                setError(response.data.message || "Invalid credentials. Please try again.");
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const serverMessage = error?.response?.data?.message;

            if (status === 401) {
                // Expected outcome for a wrong password — not a bug, so no console noise
                setError("The ID/Email or password you entered is incorrect.");
            } else if (status === 500) {
                console.error("Login Error (server):", error);
                setError("Something went wrong on our end. Please try again shortly.");
            } else if (!error?.response) {
                console.error("Login Error (network):", error);
                setError("Can't reach the server. Please check your connection.");
            } else {
                console.error("Login Error (unexpected):", error);
                setError(serverMessage || "Unable to sign in. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">

            {/* Brand panel - hidden on small screens */}
            <div className="hidden lg:flex lg:w-[44%] relative bg-[#0c3a35] text-white flex-col justify-between p-12 overflow-hidden">
                {/* fine grid texture, signature element */}
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                        backgroundSize: "36px 36px",
                    }}
                />
                <div
                    className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: "radial-gradient(circle, #2dd4bf 0%, transparent 70%)" }}
                />

                <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-teal-300" />
                    </div>
                </div>

                <div className="relative">
                    <div className="flex justify-center mb-3">
                        <img src="https://res.cloudinary.com/dsjiso86u/image/upload/v1785101664/onismos-removebg-preview_h7hrle.png" alt="onismos" width={90} height={50} className="rounded-full" />
                    </div>
                    <h1 className="flex justify-center text-2xl font-semibold leading-tight tracking-tight font-mono">
                    EECMY-CS ONESMOS NESIB ACADEMY
                    </h1>
                    <p className="flex text-xs italic mt-0.5 justify-center">Gonfoo Warra Mo'anii Argachuuf Nan Kaadha!!! Filp. 3:14</p>
                    <p className="flex justify-center text-xs italic">Press to win the prize!!! Phil. 3:14</p>

                    <div className="mt-19">
                        <p className="text-white/50 text-sm mt-4 max-w-xs leading-relaxed">
                            For the generation's success, we are a cause...
                        </p>
                        <p className="text-white/50 text-sm max-w-xs leading-relaxed">
                            Milka'ina dhalootaaf sababa ni taana!!!
                        </p>
                    </div>

                </div>

                <div className="relative flex items-center gap-2 text-xs text-white/40">
                    <div className="h-px flex-1 bg-white/15" />
                    <span>Secure staff & student access</span>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-sm">

                    {/* Mobile-only brand mark */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-[#0c3a35] flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-teal-300" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 leading-none">ONESMOS NESIB</p>
                            <p className="text-xs text-slate-400 mt-1">School Management System</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight font-mono">Welcome</h2>
                        <p className="text-slate-500 text-sm mt-1.5">Sign in with your school account to continue.</p>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Email / Identifier
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your ID / Email"
                                value={credentials.identifier}
                                onChange={e => handleChange("identifier", e.target.value)}
                                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition ${
                                    error
                                        ? ""
                                        : ""
                                }`}
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-slate-700">
                                    Password
                                </label>
                                <a
                                    href="/forgotPassword"
                                    className="text-xs font-medium text-[#0c3a35] hover:underline"
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={credentials.password}
                                    onChange={e => handleChange("password", e.target.value)}
                                    className={`w-full px-3.5 py-2.5 pr-11 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 transition ${
                                        error
                                            ? ""
                                            : "border-slate-300 focus:border-[#0c3a35] focus:ring-[#0c3a35]/10"
                                    }`}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-[#0c3a35] text-white font-medium text-sm rounded-lg hover:bg-[#0a2f2b] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                "Signing in..."
                            ) : (
                                <>
                                    Sign in <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-slate-400 text-center mt-8">
                        Having trouble signing in? Contact your school administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}