'use client';

import React, { useEffect, useState } from "react";
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
    Cell
} from "recharts";
import {
    Users,
    BookOpen,
    Layers,
    Target,
    ServerCog,
    Search,
    UserPlus,
    ClipboardList,
    Map,
    Inbox
} from "lucide-react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";
import { UXStudentRecord, UXCourseItem } from "@/types/uxAdmin";

// ---------------------------------------------------------------------------
// Static config — kept outside the component so it isn't re-created on render
// ---------------------------------------------------------------------------

const GRADES = ["9th Grade", "10th Grade", "11th Grade", "12th Grade"] as const;

const QUICK_ACTIONS = [
    { label: "Register student", icon: UserPlus },
    { label: "Student registry", icon: ClipboardList },
    { label: "Tracks map", icon: Map },
];

type KpiCard = {
    label: string;
    value: string | number;
    icon: React.ElementType;
    tint: string;   // icon badge background
    accent: string; // icon color
};

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="rounded-xl bg-slate-900 px-3.5 py-2.5 shadow-lg shadow-slate-900/20">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} className="text-sm font-semibold text-white">
                    {entry.value} <span className="font-normal text-slate-400">{entry.name}</span>
                </p>
            ))}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="flex-1 bg-slate-50 p-4 md:p-8 min-h-screen">
            <div className="max-w-[1600px] mx-auto space-y-6 animate-pulse">
                <div className="h-40 w-full rounded-3xl bg-slate-200" />
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-slate-200" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-200" />
                    <div className="h-80 rounded-2xl bg-slate-200" />
                </div>
            </div>
        </div>
    );
}

export default function StandaloneAdminAnalyticsPage(): React.JSX.Element {
    const [students, setStudents] = useState<UXStudentRecord[]>([]);
    const [courses, setCourses] = useState<UXCourseItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errored, setErrored] = useState<boolean>(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            setErrored(false);
            const [studentsRes, coursesRes] = await Promise.all([
                Axios({
                    method: summeryApi.getAllStudents.method,
                    url: summeryApi.getAllStudents.url
                }),
                Axios({
                    method: summeryApi.getSystemCourses.method,
                    url: summeryApi.getSystemCourses.url
                })
            ]);

            const studentsData = studentsRes.data?.data || studentsRes.data || [];
            const coursesData = coursesRes.data?.data || coursesRes.data || [];

            setStudents(Array.isArray(studentsData) ? studentsData : []);
            setCourses(Array.isArray(coursesData) ? coursesData : []);
        } catch (error) {
            console.error("Failed to fetch analytics data:", error);
            setStudents([]);
            setCourses([]);
            setErrored(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    const totalStudents = students.length;
    const totalCourses = courses.length;

    // Headcounts
    const maleCount = students.filter(s => s.gender === "Male").length;
    const femaleCount = students.filter(s => s.gender === "Female").length;
    const enrolledSeats = students.reduce((acc, curr) => acc + (curr.enrolledCourses?.length || 0), 0);

    // Grade distribution
    const gradeMap: Record<string, number> = { "9th Grade": 0, "10th Grade": 0, "11th Grade": 0, "12th Grade": 0 };
    students.forEach(s => { if (gradeMap[s.gradeLevel] !== undefined) gradeMap[s.gradeLevel]++; });

    const gradeChartData = GRADES.map((grade) => ({
        name: grade.replace(" Grade", ""),
        Students: gradeMap[grade]
    }));

    // Gender split
    const genderChartData = [
        { name: "Male", value: maleCount, color: "#0EA5E9" },
        { name: "Female", value: femaleCount, color: "#F43F5E" }
    ].filter(d => d.value > 0);

    const hasGenderData = genderChartData.length > 0;
    const hasStudents = totalStudents > 0;

    const kpis: KpiCard[] = [
        { label: "Active students", value: totalStudents, icon: Users, tint: "bg-indigo-50", accent: "text-indigo-600" },
        { label: "Courses available", value: totalCourses, icon: BookOpen, tint: "bg-violet-50", accent: "text-violet-600" },
        { label: "Assigned tracks", value: enrolledSeats, icon: Layers, tint: "bg-sky-50", accent: "text-sky-600" },
        { label: "Avg. test score", value: "85%", icon: Target, tint: "bg-amber-50", accent: "text-amber-600" },
        { label: "API uptime", value: "100%", icon: ServerCog, tint: "bg-emerald-50", accent: "text-emerald-600" },
    ];

    return (
        <div className="flex-1 bg-slate-50 p-4 md:p-8 min-h-screen">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* HERO */}
                <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#3730A3] to-[#4F46E5] p-6 md:p-9 text-white shadow-sm">
                    {/* subtle texture */}
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                            backgroundSize: "20px 20px",
                        }}
                    />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-indigo-100 ring-1 ring-inset ring-white/15">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                All systems operational
                            </span>
                            <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight">
                                Welcome back, Administrator
                            </h1>
                            <p className="text-sm text-indigo-100/80 max-w-md">
                                Here&apos;s how your institution is tracking today.
                            </p>
                        </div>

                        <div className="w-full lg:max-w-md space-y-2.5">
                            <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md shadow-inner">
                                <Search size={16} className="text-indigo-100/70 shrink-0" />
                                <span className="text-sm text-indigo-100/70">Ask about students, courses, or trends…</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-white"
                                    >
                                        <Icon size={13} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {errored && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Some metrics couldn&apos;t be loaded. Showing partial data — try refreshing shortly.
                    </div>
                )}

                {/* KPI GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {kpis.map((card) => (
                        <div
                            key={card.label}
                            className="group flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tint}`}>
                                <card.icon size={17} className={card.accent} strokeWidth={2.2} />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold tracking-tight text-slate-900">
                                    {card.value}
                                </div>
                                <div className="text-xs font-medium text-slate-500">{card.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Class population trend */}
                    <div className="lg:col-span-2 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                        <div className="mb-1 flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Class population trends</h3>
                                <p className="text-xs text-slate-400">Headcount across consecutive grade levels</p>
                            </div>
                        </div>

                        {hasStudents ? (
                            <div className="h-64 w-full pt-3">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.22} />
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="#94a3b8"
                                            style={{ fontSize: "11px", fontWeight: 500 }}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="#94a3b8"
                                            style={{ fontSize: "11px", fontWeight: 500 }}
                                            allowDecimals={false}
                                            width={28}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0" }} />
                                        <Area
                                            type="monotone"
                                            dataKey="Students"
                                            stroke="#4F46E5"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#colorStudents)"
                                            activeDot={{ r: 4, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState message="No student records yet. Once students are registered, grade-level trends will appear here." />
                        )}
                    </div>

                    {/* Demographic breakdown */}
                    <div className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                        <div className="mb-1">
                            <h3 className="text-sm font-semibold text-slate-800">Demographic breakdown</h3>
                            <p className="text-xs text-slate-400">Male vs. female composition</p>
                        </div>

                        {hasGenderData ? (
                            <>
                                <div className="relative my-2 flex h-44 w-full items-center justify-center">
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
                                                stroke="none"
                                            >
                                                {genderChartData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    <div className="pointer-events-none absolute flex flex-col items-center">
                                        <span className="text-lg font-bold text-slate-800">{totalStudents}</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                            Total
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-center gap-5 border-t border-slate-100 pt-3 text-xs font-medium text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                                        Male ({maleCount})
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                                        Female ({femaleCount})
                                    </div>
                                </div>
                            </>
                        ) : (
                            <EmptyState message="No demographic data available yet." compact />
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

function EmptyState({ message, compact = false }: { message: string; compact?: boolean }) {
    return (
        <div className={`flex flex-col items-center justify-center gap-2 text-center ${compact ? "h-44" : "h-64"}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Inbox size={16} className="text-slate-400" />
            </div>
            <p className="max-w-[220px] text-xs text-slate-400">{message}</p>
        </div>
    );
}