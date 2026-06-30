'use client';

import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios"; 
import { DirectorAnalyticsResponse, GradeLevelCohort } from "@/types/director";
import { 
    PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, 
    Tooltip, Legend, ResponsiveContainer 
} from "recharts";

type DashboardTab = "overview" | "activities";

export default function DirectorDashboard(): React.JSX.Element {
    const [analytics, setAnalytics] = useState<DirectorAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

    useEffect(() => {
        // Fetch matching analytics tracking datasets from backend payload
        Axios.get<DirectorAnalyticsResponse>("/director/analytics")
            .then((res) => {
                if (res.data) setAnalytics(res.data);
            })
            .catch((err: unknown) => console.error("Error logging director metrics:", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <p className="text-sm font-semibold text-gray-500 animate-pulse">
                    Compiling institutional metrics & executing AI data analysis...
                </p>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <p className="text-sm font-bold text-red-500">
                    Failed to initialize dashboard. Verify backend connectivity.
                </p>
            </div>
        );
    }

    const { generalMetrics, strugglingCourses } = analytics;

    // Format data cleanly into structural object arrays expected by Recharts engine
    const pieData = [
        { name: "Male Students", value: generalMetrics.genderBreakdown?.Male ?? 0 },
        { name: "Female Students", value: generalMetrics.genderBreakdown?.Female ?? 0 }
    ];
    const PIE_COLORS: string[] = ["#3b82f6", "#ec4899"];

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            {/* Header Identity Layout */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Director General Portal</h1>
                    <p className="text-sm text-gray-500 mt-1">School metrics, gender demographics, and curriculum oversight.</p>
                </div>
                
                {/* Navigation State Controls */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 self-start">
                    <button 
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "overview" ? "bg-slate-900 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        Metrics Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab("activities")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "activities" ? "bg-slate-900 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        Curriculum Risk Analysis
                    </button>
                </div>
            </header>

            {/* Core Dynamic KPI Metric Badges */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                    <span className="text-2xs font-bold uppercase tracking-wider text-gray-400">Total Enrolled Registry</span>
                    <p className="text-4xl font-black text-gray-800 mt-1">{generalMetrics.totalStudents}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                    <span className="text-2xs font-bold uppercase tracking-wider text-gray-400">Active Faculty Staff</span>
                    <p className="text-4xl font-black text-gray-800 mt-1">{generalMetrics.totalTeachers}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                    <span className="text-2xs font-bold uppercase tracking-wider text-gray-400">System Gateway Link</span>
                    <p className="text-4xl font-black text-emerald-600 mt-1">100%</p>
                </div>
            </section>

            {/* Conditional Content Layout Render */}
            {activeTab === "overview" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Demographics Pie Visualization (7/12 layout columns) */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Institutional Gender Demographics Balance</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={pieData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={65} 
                                        outerRadius={85} 
                                        paddingAngle={4} 
                                        dataKey="value" 
                                        label
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Executive AI Briefing Text Box (5/12 layout columns) */}
                    <div className="lg:col-span-5">
                        <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">✨</span>
                                <div>
                                    <h2 className="text-base font-bold tracking-tight">AI Executive Systems Analyst</h2>
                                    <p className="text-2xs text-slate-400 font-mono">Real-time Diagnostic Insights</p>
                                </div>
                            </div>
                            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80">
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                                    {strugglingCourses?.aiInsights || "No diagnostic anomalies reported across standard grade parameters."}
                                </p>
                            </div>
                            <div className="text-2xs text-slate-500 text-right font-mono">
                                Powered by gemini-2.5-flash
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Secondary Tab View Layout: Individual Grade/Course Risk Tracking Maps */
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-8">
                    <div>
                        <h3 className="text-base font-bold text-gray-800">Academic Underperformance Assessment</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Grades displaying low scoring aggregates compiled across class levels.</p>
                    </div>

                    <div className="space-y-8">
                        {strugglingCourses?.chartData?.map((gradeData: GradeLevelCohort, index: number) => (
                            <div key={index} className="border-t border-gray-100 pt-6 first:border-0 first:pt-0">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                                    {gradeData.gradeLevel} Curriculum Anomalies
                                </h4>
                                <div className="h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={gradeData.courses} layout="vertical">
                                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                                            <YAxis dataKey="courseName" type="category" width={110} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="averageScore" fill="#ef4444" radius={[0, 4, 4, 0]} name="Course Average Score (%)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}