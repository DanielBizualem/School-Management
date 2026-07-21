'use client';

import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface CourseRow {
    courseName: string;
    courseCode: string;
    semester1Mark: number | "Not Graded";
    semester2Mark: number | "Not Graded";
    total: number | null;
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

    const { studentProfile, enrolledLevelCourses } = transcriptData;

    const combinedCourses: CourseRow[] = enrolledLevelCourses.map((course: any) => {
        const existingGradeRecord = studentProfile.grades?.find(
            (g: any) => g.course?._id === course._id || g.course === course._id
        );

        const sem1 = existingGradeRecord?.semester1Mark ?? null;
        const sem2 = existingGradeRecord?.semester2Mark ?? null;

        const hasBoth = sem1 !== null && sem1 !== undefined && sem2 !== null && sem2 !== undefined;
        const total = hasBoth ? Number(((sem1 + sem2) / 2).toFixed(1)) : null;

        return {
            courseName: course.courseName,
            courseCode: course.courseCode || course.code,
            semester1Mark: sem1 !== null && sem1 !== undefined ? sem1 : "Not Graded",
            semester2Mark: sem2 !== null && sem2 !== undefined ? sem2 : "Not Graded",
            total,
        };
    });

    const gradedCourses = combinedCourses.filter((c) => c.total !== null);
    const cumulativeAverage =
        gradedCourses.length > 0
            ? (gradedCourses.reduce((sum, c) => sum + (c.total as number), 0) / gradedCourses.length).toFixed(1)
            : null;

    const issueDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="bg-slate-50 min-h-screen py-10 px-4 print:bg-white print:p-0 print:min-h-0">
            {/* Print-only rule: hide everything on the page except #transcript-print-area */}
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

                <div id="transcript-print-area" className="bg-white border border-slate-200 print:border-0">
                    {/* Header */}
                    <div className="px-8 py-7 sm:px-10 border-b border-slate-900">
                        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase mb-1">
                            {studentProfile.schoolName || "Office of administration"}
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Academic Transcript
                        </h1>

                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-6 text-sm">
                            <Field label="Student" value={studentProfile.fullName} />
                            <Field label="Grade Level" value={studentProfile.gradeLevel} />
                            <Field label="Student ID" value={studentProfile.studentId || studentProfile._id?.slice(-8).toUpperCase()} />
                            <Field label="Issued" value={issueDate} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="px-8 py-6 sm:px-10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-2 text-xs font-medium tracking-wide text-slate-400 uppercase">
                                        Course
                                    </th>
                                    <th className="py-2 text-xs font-medium tracking-wide text-slate-400 uppercase text-center">
                                        Sem 1
                                    </th>
                                    <th className="py-2 text-xs font-medium tracking-wide text-slate-400 uppercase text-center">
                                        Sem 2
                                    </th>
                                    <th className="py-2 text-xs font-medium tracking-wide text-slate-400 uppercase text-right">
                                        Average
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {combinedCourses.length > 0 ? (
                                    combinedCourses.map((item, index) => (
                                        <tr key={index} className="border-b border-slate-100">
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
                                        <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">
                                            No courses are recorded for this grade level yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {gradedCourses.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-slate-900">
                                        <td colSpan={3} className="pt-4 text-sm font-semibold text-slate-600">
                                            Cumulative Average
                                        </td>
                                        <td className="pt-4 text-right text-lg font-bold text-slate-900">
                                            {cumulativeAverage}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-8 py-4 sm:px-10 flex items-center justify-between text-xs text-slate-400">
                        <span>Generated electronically. Valid without signature.</span>
                        <span className="font-mono">Registration ID:{studentProfile._id}</span>
                    </div>
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