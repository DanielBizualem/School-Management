'use client';

import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface AssessmentItem {
    _id?: string;
    title: string;        // e.g., "Chapter 1 Quiz", "Midterm"
    score: number;        // Marks obtained by student
    maxScore: number;     // Teacher-assigned max score (e.g., 15, 30, etc.)
}

interface CourseGrade {
    course: {
        _id: string;
        courseName: string;
        courseCode: string;
    };
    semester1Mark: number;
    semester2Mark: number;
    assessments?: AssessmentItem[]; // Custom assessments configured/graded by teacher
}

export default function StudentAcademicsPage() {
    const [loading, setLoading] = useState(true);
    const [studentProfile, setStudentProfile] = useState<any>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [activeSemester, setActiveSemester] = useState<"semester1" | "semester2">("semester1");

    useEffect(() => {
        const fetchTranscriptData = async () => {
            try {
                setLoading(true);
                const response = await Axios({ ...summeryApi.getTranscript });
                const profile = response.data?.data?.studentProfile;
                
                if (profile) {
                    setStudentProfile(profile);
                    if (profile.grades && profile.grades.length > 0) {
                        setSelectedCourseId(profile.grades[0].course?._id || "");
                    }
                }
            } catch (error) {
                console.error("Failed to load academic data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTranscriptData();
    }, []);

    if (loading) {
        return <div className="p-12 text-center text-slate-400 font-medium text-xs">Loading academic records...</div>;
    }

    if (!studentProfile || !studentProfile.grades || studentProfile.grades.length === 0) {
        return <div className="p-12 text-center text-slate-500 text-xs">No academic records or course enrollments found.</div>;
    }

    // Find the currently selected course grade object
    const currentGradeRecord: CourseGrade = studentProfile.grades.find(
        (g: any) => g.course?._id === selectedCourseId
    ) || studentProfile.grades[0];

    // Grab assessments specific to this course (if your backend schema nests them per semester, adjust accordingly)
    const assessments: AssessmentItem[] = currentGradeRecord.assessments || [];

    // Calculate total points earned vs total possible max score defined by the teacher
    const totalObtained = assessments.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const totalMaxPossible = assessments.reduce((acc, curr) => acc + (curr.maxScore || 0), 0);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-slate-900">Academic Performance</h1>
                    <p className="text-xs text-slate-500 mt-1">View your course assessments and teacher-assigned point breakdowns</p>
                </div>

                {/* Course Selector Dropdown */}
                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Course:</label>
                    <select 
                        value={selectedCourseId} 
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                    >
                        {studentProfile.grades.map((item: any) => (
                            <option key={item.course?._id} value={item.course?._id}>
                                {item.course?.courseName || "Unknown Course"} ({item.course?.courseCode})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Course Summary Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Subject</p>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{currentGradeRecord.course?.courseName}</h3>
                    <span className="text-xs text-teal-600 font-mono font-semibold">{currentGradeRecord.course?.courseCode}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester 1 Total</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{currentGradeRecord.semester1Mark} <span className="text-xs font-normal text-slate-400">/ 100</span></h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester 2 Total</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{currentGradeRecord.semester2Mark} <span className="text-xs font-normal text-slate-400">/ 100</span></h3>
                </div>
            </div>

            {/* Assessment Breakdown Table */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Teacher Assessment Breakdown</h3>
                        <p className="text-[10px] text-slate-400">Custom weightings assigned per course configuration</p>
                    </div>
                    
                    {/* Semester Toggle Switch */}
                    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                        <button 
                            onClick={() => setActiveSemester("semester1")}
                            className={`px-3 py-1.5 rounded-lg transition ${activeSemester === 'semester1' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Semester 1
                        </button>
                        <button 
                            onClick={() => setActiveSemester("semester2")}
                            className={`px-3 py-1.5 rounded-lg transition ${activeSemester === 'semester2' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            Semester 2
                        </button>
                    </div>
                </div>
                
                {assessments.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                        No individual assessment items have been recorded for this course yet.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Assessment Title</th>
                                <th className="px-6 py-3 text-center">Max Score (Weight)</th>
                                <th className="px-6 py-3 text-right">Score Obtained</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {assessments.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition">
                                    <td className="px-6 py-4 font-semibold text-slate-800">
                                        {item.title}
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-slate-500">
                                        {item.maxScore} pts
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-teal-600 font-mono text-sm">
                                        {item.score} <span className="text-[10px] font-normal text-slate-400">/ {item.maxScore}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
                            <tr>
                                <td className="px-6 py-3 text-slate-700 text-xs">Total Accumulated</td>
                                <td className="px-6 py-3 text-center font-mono text-slate-500 text-xs">{totalMaxPossible} pts</td>
                                <td className="px-6 py-3 text-right font-black text-slate-900 text-sm font-mono">
                                    {totalObtained} <span className="text-[10px] font-normal text-slate-400">/ {totalMaxPossible}</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}