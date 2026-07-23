'use client';

import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface AssessmentItem {
    _id?: string;
    title: string;          // Assessment Name
    score?: number;         // Result obtained by student
    maxScore: number;       // Maximum Mark
}

interface CourseOption {
    _id: string;
    courseName: string;
    courseCode: string;
}

export default function StudentAcademicsPage() {
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");

    // Performance state fetched dynamically
    const [teacherName, setTeacherName] = useState<string>("TBA");
    const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
    const [activeSemester, setActiveSemester] = useState<"semester1" | "semester2">("semester1");
    const [performanceLoading, setPerformanceLoading] = useState(false);

    // 1. Initial load: Fetch student transcript/courses list to populate the dropdown
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const response = await Axios({ ...summeryApi.getTranscript });
                const profile = response.data?.data?.studentProfile;

                if (profile && profile.grades && profile.grades.length > 0) {
                    const extractedCourses = profile.grades.map((g: any) => g.course).filter(Boolean);
                    setCourses(extractedCourses);
                    if (extractedCourses.length > 0) {
                        setSelectedCourseId(extractedCourses[0]._id);
                    }
                }
            } catch (error) {
                console.error("Failed to load academic transcript data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // 2. Fetch specific course scores, max scores, and teacher info when course selection or semester changes
    useEffect(() => {
        if (!selectedCourseId) return;

        const fetchCoursePerformance = async () => {
            try {
                setPerformanceLoading(true);
                
                // Keep the exact summeryApi route you have configured (e.g., summeryApi.viewScore)
                // Appending the courseId as a parameter matching your backend setup
                const response = await Axios({
                    url: `${summeryApi.viewScore.url}/${selectedCourseId}`,
                    method: summeryApi.viewScore.method,
                    params: { semester: activeSemester }
                });
                console.log(response.data)
                const responseData = response.data?.data || response.data;
                if (responseData) {
                    setTeacherName(responseData.teacherName || "TBA");
                    
                    // Maps assessments array containing both max scores and actual student scores
                    const rawAssessments = responseData.assessments || [];
                    const formattedAssessments = rawAssessments.map((item: any) => ({
                        _id: item._id,
                        title: item.title,
                        maxScore: item.maxScore,
                        // Checks for score or nested score structure depending on your updated backend output
                        score: item.score !== undefined ? item.score : (item.obtainedScore ?? undefined)
                    }));

                    setAssessments(formattedAssessments);
                }
            } catch (error) {
                console.error("Failed to load course performance metrics", error);
                setTeacherName("TBA");
                setAssessments([]);
            } finally {
                setPerformanceLoading(false);
            }
        };

        fetchCoursePerformance();
    }, [selectedCourseId, activeSemester]);

    if (loading) {
        return (
            <div className="h-full max-w-6xl mx-auto p-8 overflow-hidden">
                <div className="animate-pulse space-y-6">
                    <div className="h-20 bg-slate-100 rounded-xl" />
                    <div className="h-72 bg-slate-100 rounded-xl" />
                </div>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="max-w-md mx-auto mt-16 p-10 text-center border border-slate-200 rounded-xl bg-white">
                <p className="text-sm font-semibold text-slate-800">No academic records found</p>
                <p className="text-sm text-slate-500 mt-1">
                    You don't have any course enrollments yet. Check back once you're enrolled in a course.
                </p>
            </div>
        );
    }

    const activeCourse = courses.find(c => c._id === selectedCourseId) || courses[0];

    const totalMaxPossible = assessments.reduce((acc, curr) => acc + (curr.maxScore || 0), 0);
    const totalObtained = assessments.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const percentage = totalMaxPossible > 0 ? Math.round((totalObtained / totalMaxPossible) * 100) : null;

    const teacherInitials = teacherName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join("") || "T";

    return (
        <div className="h-full max-w-6xl mx-auto p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
            {/* Header */}
            <div className="shrink-0">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Academic Record</h1>
                <p className="text-sm text-slate-500 mt-1">Review your course breakdown and assessment marks</p>
            </div>

            {/* Controls */}
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full sm:w-72 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                >
                    {courses.map((course, index) => (
                        <option key={course._id || index} value={course._id}>
                            {course.courseName || "Unknown Course"} · {course.courseCode}
                        </option>
                    ))}
                </select>

                <div className="inline-flex bg-slate-100 p-1 rounded-lg text-sm font-medium w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveSemester("semester1")}
                        aria-pressed={activeSemester === "semester1"}
                        className={`px-4 py-1.5 rounded-md transition ${
                            activeSemester === "semester1"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        Semester 1
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSemester("semester2")}
                        aria-pressed={activeSemester === "semester2"}
                        className={`px-4 py-1.5 rounded-md transition ${
                            activeSemester === "semester2"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        Semester 2
                    </button>
                </div>
            </div>

            {/* Main card */}
            <div className="bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">

                {/* Left panel: course info */}
                <div className="md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/60 flex flex-col justify-between overflow-y-auto min-h-0">
                    <div className="space-y-5">
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Course</span>
                            <h2 className="text-base font-semibold text-slate-900 mt-1 leading-snug">
                                {activeCourse?.courseName || "N/A"}
                            </h2>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">{activeCourse?.courseCode || "N/A"}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold flex items-center justify-center shrink-0">
                                {teacherInitials}
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">Teacher</span>
                                <span className="text-sm font-medium text-slate-800">{teacherName}</span>
                            </div>
                        </div>
                    </div>

                    {percentage !== null && (
                        <div className="mt-8 pt-5 border-t border-slate-200">
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Overall score</span>
                                <span className="text-sm font-semibold text-slate-900">{percentage}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-indigo-500 transition-all"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right panel: assessment table */}
                <div className="md:w-2/3 flex flex-col relative overflow-x-auto min-h-0">
                    {performanceLoading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                            <span className="text-xs font-medium text-slate-400">Loading marks…</span>
                        </div>
                    )}

                    <div role="table" className="flex-1 flex flex-col min-w-[560px] min-h-0">
                        {/* Header row */}
                        <div
                            role="row"
                            className="shrink-0 grid grid-cols-[3rem_1fr_8rem_8rem] px-5 py-3 text-[11px] uppercase font-semibold text-slate-400 border-b border-slate-200"
                        >
                            <span role="columnheader">#</span>
                            <span role="columnheader">Assessment Name</span>
                            <span role="columnheader">Maximum Mark</span>
                            <span role="columnheader" className="text-right">Result</span>
                        </div>

                        {/* Body */}
                        {assessments.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-sm text-slate-400 p-8">
                                No assessments configured for this course yet.
                            </div>
                        ) : (
                            <div role="rowgroup" className="flex-1 flex flex-col divide-y divide-slate-100 text-sm text-slate-800 overflow-y-auto min-h-0">
                                {assessments.map((item, index) => {
                                    const rowKey = item._id ? String(item._id) : `assessment-${index}`;
                                    const hasScore = item.score !== undefined && item.score !== null;

                                    return (
                                        <div
                                            key={rowKey}
                                            role="row"
                                            className="flex-1 grid grid-cols-[3rem_1fr_8rem_8rem] items-center px-5 hover:bg-slate-50 transition"
                                        >
                                            <span role="cell" className="text-slate-400 tabular-nums">{index + 1}</span>
                                            <span role="cell" className="font-medium text-slate-900">{item.title}</span>
                                            <span role="cell" className="font-mono text-slate-600 tabular-nums">{item.maxScore}</span>
                                            <span role="cell" className="text-right font-mono font-semibold text-slate-900 tabular-nums">
                                                {hasScore ? (
                                                    item.score
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-amber-600 font-sans font-medium text-xs">
                                                        Pending
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Footer / totals row */}
                        {assessments.length > 0 && (
                            <div
                                role="row"
                                className="shrink-0 grid grid-cols-[3rem_1fr_8rem_8rem] items-center px-8 py-3.5 bg-slate-50 border-t border-slate-200 text-sm font-semibold"
                            >
                                <span role="cell" className="col-span-2 text-left uppercase tracking-wide text-xs text-slate-500 pr-4">
                                    Totals
                                </span>
                                <span role="cell" className="text-center font-mono text-slate-700 tabular-nums">{totalMaxPossible}</span>
                                <span role="cell" className="text-right font-mono text-slate-900 tabular-nums">
                                    {totalObtained} / {totalMaxPossible}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}