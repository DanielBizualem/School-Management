'use client';

import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface GradeRecord {
    courseName: string;
    courseCode: string;
    semester1Mark: number | "Not Graded";
    semester2Mark: number | "Not Graded";
    total: number | null;
}

interface GradeLevelSection {
    gradeLevel: string | number;
    academicYear?: string;
    courses: GradeRecord[];
    sectionAverage: string | null;
    sortOrder: number;
}

export default function TranscriptPage() {
    const [transcriptData, setTranscriptData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchTranscript = async () => {
            try {
                const response = await Axios({ ...summeryApi.getTranscript });
                setTranscriptData(response.data.data);
            } catch (err) {
                console.error("Failed to load transcript", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchTranscript();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <p className="text-sm text-slate-400">Loading transcript…</p>
            </div>
        );
    }

    if (error || !transcriptData) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center max-w-sm">
                    <p className="text-slate-800 font-semibold mb-1">Transcript unavailable</p>
                    <p className="text-sm text-slate-500">
                        We couldn't load this record. Refresh the page or contact the registrar's office if the problem continues.
                    </p>
                </div>
            </div>
        );
    }

    const { studentProfile } = transcriptData;
    const gradeSectionsMap = new Map<string, GradeLevelSection>();

    const getSectionKey = (level: any, year: any) => `${level}_${year || 'current'}`;

    const getGradeLevelOrder = (level: any): number => {
        const parsed = parseInt(String(level).replace(/\D/g, ''), 10);
        return isNaN(parsed) ? 99 : parsed;
    };

    // Process academic history (past years)
    if (studentProfile.academicHistory && Array.isArray(studentProfile.academicHistory)) {
        studentProfile.academicHistory.forEach((historyItem: any) => {
            const level = historyItem.gradeLevel || "Unknown";
            const year = historyItem.academicYear || "";
            const historyGrades = historyItem.grades || [];

            const sectionKey = getSectionKey(level, year);
            
            if (!gradeSectionsMap.has(sectionKey)) {
                gradeSectionsMap.set(sectionKey, {
                    gradeLevel: level,
                    academicYear: year,
                    courses: [],
                    sectionAverage: null,
                    sortOrder: getGradeLevelOrder(level)
                });
            }

            const currentSection = gradeSectionsMap.get(sectionKey)!;
            const formattedCourses: GradeRecord[] = historyGrades.map((g: any) => {
                let courseName = "Unknown Course";
                let courseCode = "—";

                if (typeof g.course === 'object' && g.course !== null) {
                    courseName = g.course.courseName || g.course.name || "Unknown Course";
                    courseCode = g.course.courseCode || g.course.code || "—";
                } else if (typeof g.course === 'string') {
                    courseCode = g.course;
                    courseName = `Course (${g.course.slice(-6)})`;
                }

                const sem1 = g.semester1Mark ?? null;
                const sem2 = g.semester2Mark ?? null;
                const hasBoth = sem1 !== null && sem1 !== undefined && sem2 !== null && sem2 !== undefined;
                const total = hasBoth ? Number(((sem1 + sem2) / 2).toFixed(1)) : null;

                return {
                    courseName,
                    courseCode,
                    semester1Mark: sem1 !== null && sem1 !== undefined ? sem1 : "Not Graded",
                    semester2Mark: sem2 !== null && sem2 !== undefined ? sem2 : "Not Graded",
                    total,
                };
            });

            const graded = formattedCourses.filter((c) => c.total !== null);
            const sectionAverage =
                graded.length > 0
                    ? (graded.reduce((sum, c) => sum + (c.total as number), 0) / graded.length).toFixed(1)
                    : null;

            currentSection.courses = formattedCourses;
            currentSection.sectionAverage = sectionAverage;
        });
    }

    // Process current active grade level
    const currentLevelKey = studentProfile.gradeLevel || "Current";
    const currentYear = studentProfile.academicYear || "";
    const currentGradesList = studentProfile.grades || [];

    const activeSectionKey = getSectionKey(currentLevelKey, currentYear);

    if (!gradeSectionsMap.has(activeSectionKey)) {
        gradeSectionsMap.set(activeSectionKey, {
            gradeLevel: currentLevelKey,
            academicYear: currentYear,
            courses: [],
            sectionAverage: null,
            sortOrder: getGradeLevelOrder(currentLevelKey)
        });
    }

    const activeSection = gradeSectionsMap.get(activeSectionKey)!;
    if (currentGradesList.length > 0 && activeSection.courses.length === 0) {
        const formattedActiveCourses: GradeRecord[] = currentGradesList.map((g: any) => {
            let courseName = "Unknown Course";
            let courseCode = "—";

            if (typeof g.course === 'object' && g.course !== null) {
                courseName = g.course.courseName || g.course.name || "Unknown Course";
                courseCode = g.course.courseCode || g.course.code || "—";
            } else if (typeof g.course === 'string') {
                courseCode = g.course;
                courseName = `Course (${g.course.slice(-6)})`;
            }

            const sem1 = g.semester1Mark ?? null;
            const sem2 = g.semester2Mark ?? null;
            const hasBoth = sem1 !== null && sem1 !== undefined && sem2 !== null && sem2 !== undefined;
            const total = hasBoth ? Number(((sem1 + sem2) / 2).toFixed(1)) : null;

            return {
                courseName,
                courseCode,
                semester1Mark: sem1 !== null && sem1 !== undefined ? sem1 : "Not Graded",
                semester2Mark: sem2 !== null && sem2 !== undefined ? sem2 : "Not Graded",
                total,
            };
        });

        const gradedActive = formattedActiveCourses.filter((c) => c.total !== null);
        const activeSectionAverage =
            gradedActive.length > 0
                ? (gradedActive.reduce((sum, c) => sum + (c.total as number), 0) / gradedActive.length).toFixed(1)
                : null;

        activeSection.courses = formattedActiveCourses;
        activeSection.sectionAverage = activeSectionAverage;
    }

    const gradeSections: GradeLevelSection[] = Array.from(gradeSectionsMap.values()).sort(
        (a, b) => a.sortOrder - b.sortOrder
    );

    const issueDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="bg-slate-50 min-h-screen py-10 px-4 print:bg-white print:p-0 print:min-h-0">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #transcript-print-area,
                    #transcript-print-area * {
                        visibility: visible;
                    }
                    #transcript-print-area {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        margin: 0;
                    }
                }
            `}</style>

            <div className="max-w-5xl mx-auto print:max-w-none">
                <div className="flex justify-end mb-4 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="text-sm font-medium text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-md px-4 py-2 transition-colors"
                    >
                        Print / Save as PDF
                    </button>
                </div>

                <div id="transcript-print-area" className="space-y-6">
                    {gradeSections.length > 0 ? (
                        gradeSections.map((section, sIndex) => (
                            <div key={sIndex} className="bg-white border border-slate-200 print:border-0 shadow-sm rounded-xl overflow-hidden">
                                <div className="px-8 py-6 sm:px-10 border-b border-slate-900">
                                    <p className="text-xs font-medium tracking-wide text-slate-400 uppercase mb-1">
                                        {studentProfile.schoolName || "Office of administration"}
                                    </p>
                                    <h1 className="text-2xl font-semibold text-slate-900">
                                        Academic Transcript
                                    </h1>

                                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-6 text-sm">
                                        <Field label="Student" value={studentProfile.fullName} />
                                        <Field label="Grade Level" value={section.gradeLevel} />
                                        <Field label="Student ID" value={studentProfile.studentID || studentProfile._id?.slice(-8).toUpperCase()} />
                                        <Field label="Issued" value={issueDate} />
                                    </div>
                                </div>

                                <div className="px-8 py-6 sm:px-10 space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <div>
                                            <h3 className="text-md font-bold text-slate-900 uppercase tracking-wide">
                                                Grade Level: {section.gradeLevel}
                                            </h3>
                                            {section.academicYear && (
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Academic Year: {section.academicYear}
                                                </p>
                                            )}
                                        </div>
                                        {section.sectionAverage && (
                                            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                                                Section Average: {section.sectionAverage}
                                            </span>
                                        )}
                                    </div>

                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-slate-400">
                                                <th className="py-2 text-xs font-medium tracking-wide uppercase">Course</th>
                                                <th className="py-2 text-xs font-medium tracking-wide uppercase text-center">Sem 1</th>
                                                <th className="py-2 text-xs font-medium tracking-wide uppercase text-center">Sem 2</th>
                                                <th className="py-2 text-xs font-medium tracking-wide uppercase text-right">Average</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.courses.length > 0 ? (
                                                section.courses.map((item, index) => (
                                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                                                        <td className="py-3">
                                                            <span className="block font-medium text-slate-800">{item.courseName}</span>
                                                            <span className="block text-xs text-slate-400 mt-0.5">{item.courseCode}</span>
                                                        </td>
                                                        <td className="py-3 text-center tabular-nums">
                                                            <Mark value={item.semester1Mark} />
                                                        </td>
                                                        <td className="py-3 text-center tabular-nums">
                                                            <Mark value={item.semester2Mark} />
                                                        </td>
                                                        <td className="py-3 text-right font-semibold tabular-nums">
                                                            {item.total !== null ? (
                                                                <span className="text-slate-900">{item.total.toFixed(1)}</span>
                                                            ) : (
                                                                <span className="text-slate-300 italic text-sm font-normal">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-6 text-center text-slate-400 text-sm italic">
                                                        No courses are recorded for this grade level yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="border-t border-slate-100 px-8 py-4 sm:px-10 flex items-center justify-between text-xs text-slate-400 bg-slate-50/50">
                                    <span>Generated electronically. Valid without signature.</span>
                                    <span className="font-mono">Registration ID: {studentProfile._id}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">
                            No academic records available.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value?: string | number }) {
    return (
        <div>
            <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase mb-0.5">{label}</p>
            <p className="text-slate-800 font-medium">{value || "—"}</p>
        </div>
    );
}

function Mark({ value }: { value: number | "Not Graded" }) {
    if (typeof value === "number") {
        return <span className="text-slate-700 font-semibold">{value}</span>;
    }
    return <span className="text-slate-300 italic text-xs">Not graded</span>;
}