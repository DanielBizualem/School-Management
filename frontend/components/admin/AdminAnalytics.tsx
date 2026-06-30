'use client';

import React from "react";
import { UXStudentRecord, UXCourseItem } from "@/types/uxAdmin";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

interface AdminAnalyticsProps {
    students: UXStudentRecord[];
    courses: UXCourseItem[];
    onNavigateToTab: (tab: "students" | "register") => void;
}

export default function AdminAnalytics({ students, courses, onNavigateToTab }: AdminAnalyticsProps): React.JSX.Element {
    const totalStudents = students.length;
    const totalCourses = courses.length;

    // 1. Math and Headcounts
    const maleCount = students.filter(s => s.gender === "Male").length;
    const femaleCount = students.filter(s => s.gender === "Female").length;
    const enrolledSeats = students.reduce((acc, curr) => acc + (curr.enrolledCourses?.length || 0), 0);

    // 2. Format Data for the Grade Levels Line/Area Spline Chart
    const gradeMap: Record<string, number> = { "9th Grade": 0, "10th Grade": 0, "11th Grade": 0, "12th Grade": 0 };
    students.forEach(s => { if (gradeMap[s.gradeLevel] !== undefined) gradeMap[s.gradeLevel]++; });

    const gradeChartData = Object.entries(gradeMap).map(([grade, count]) => ({
        name: grade.replace(" Grade", ""), // Clean up label spacing (e.g. "9th")
        Students: count
    }));

    // 3. Format Data for the Demographic Donut Chart
    const genderChartData = [
        { name: "Male", value: maleCount, color: "#06b6d4" },     // Cyan matching sidecolor.png
        { name: "Female", value: femaleCount, color: "#ec4899" }   // Hot pink accent
    ];

    return (
        <div className="space-y-6">
            
            {/* PURPLE HERO BANNER (Matches school dashboard.jpg style precisely) */}
            <div className="w-full bg-gradient-to-r from-[#5932e6] via-[#6366f1] to-[#8b5cf6] p-6 md:p-8 rounded-3xl text-white relative overflow-hidden shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1.5 z-10">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">Welcome back, Administrator!</h1>
                    <p className="text-xs text-indigo-100/80 font-medium">Ready to monitor and power up your institution metrics today?</p>
                </div>

                {/* Simulated Quick Action bar inside header */}
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl w-full lg:max-w-xl space-y-2 z-10 shadow-inner">
                    <div className="text-xs font-medium text-white/90 px-2 py-0.5">🔍 Ask me anything about system metrics...</div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        <span onClick={() => onNavigateToTab("register")} className="cursor-pointer text-3xs font-semibold bg-white text-slate-900 px-2.5 py-1 rounded-xl shadow-xs hover:bg-slate-50 transition">🧩 Register New</span>
                        <span onClick={() => onNavigateToTab("students")} className="cursor-pointer text-3xs font-semibold bg-white/10 text-white border border-white/10 px-2.5 py-1 rounded-xl hover:bg-white/20 transition">📊 Student Registry</span>
                        <span className="text-3xs font-semibold bg-white/10 text-white border border-white/10 px-2.5 py-1 rounded-xl">📘 Tracks Map</span>
                    </div>
                </div>
            </div>

            {/* METRICS COUNT GRID ROW (Matches dashboard card.png precisely) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
                {[
                    { val: totalStudents, label: "Active students" },
                    { val: totalCourses, label: "Courses available" },
                    { val: enrolledSeats, label: "Assigned tracks" },
                    { val: "85%", label: "Avg. test score" },
                    { val: "100%", label: "API uptime" }
                ].map((card, i) => (
                    <div 
                        key={i} 
                        className="bg-white px-6 py-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-start items-start gap-1"
                    >
                        {/* Massive value on top */}
                        <span className="text-3xl font-medium tracking-tight text-slate-900">
                            {card.val}
                        </span>
                        {/* Plain, clean label on bottom */}
                        <span className="text-xs text-slate-500 font-normal">
                            {card.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* GRAPHICAL CHARTS ENGINE GRID ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 📈 PANEL LEFT: Area/Spline Curve for Student Distribution */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Population Trends</h3>
                        <p className="text-4xs text-slate-400 font-medium">Visual graph tracking headcounts across consecutive grades.</p>
                    </div>
                    <div className="h-64 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: '500' }} />
                                <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: '500' }} allowDecimals={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                                    itemStyle={{ color: '#67e8f9' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="Students" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStudents)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 🍩 PANEL RIGHT: Donut Chart for Demographics */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demographic Breakdown</h3>
                        <p className="text-4xs text-slate-400 font-medium">Ratio composition between Male and Female records.</p>
                    </div>

                    <div className="h-44 w-full relative flex items-center justify-center my-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={genderChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {genderChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Midpoint metric indicator overlay */}
                        <div className="absolute text-center flex flex-col">
                            <span className="text-base font-black text-slate-800">{totalStudents}</span>
                            <span className="text-5xs uppercase tracking-widest text-slate-400 font-bold">Total</span>
                        </div>
                    </div>

                    {/* Custom Legend Layout indicators */}
                    <div className="flex gap-4 justify-center text-3xs font-semibold text-slate-600 border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-500" />
                            <span>Male ({maleCount})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-pink-500" />
                            <span>Female ({femaleCount})</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}