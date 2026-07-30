"use client"
import React, { useState } from 'react';
import Axios from '@/utils/Axios.js';
import summeryApi from '@/common/summeryApi';

interface CourseTranscriptItem {
    courseId: string;
    courseName: string;
    courseCode: string;
    semester1Score: number | null;
    semester2Score: number | null;
    yearlyAverage: number;
}

interface AcademicYearTranscript {
    academicYear: string;
    gradeLevel: string;
    courses: CourseTranscriptItem[];
    overallYearAverage: number;
}

interface TranscriptData {
    student: {
        _id: string;
        fullName: string;
        studentID: string;
        enrolledYear: string;
    };
    academicYears: AcademicYearTranscript[];
}

export default function StudentTranscriptSearchPage() {
    const [studentIdInput, setStudentIdInput] = useState<string>('');
    const [transcript, setTranscript] = useState<TranscriptData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSearchTranscript = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentIdInput.trim()) {
            setErrorMsg("Please enter a valid Student ID.");
            return;
        }

        try {
            setLoading(true);
            setErrorMsg(null);
            setTranscript(null);

            const apiConfig = summeryApi.getStudentTranscript(studentIdInput.trim());
            const res = await Axios(apiConfig);

            if (res.data?.success) {
                setTranscript(res.data.data);
            } else {
                setErrorMsg(res.data?.message || "Student transcript could not be found.");
            }
        } catch (error: any) {
            console.error("Failed to load student transcript", error);
            setErrorMsg(error?.response?.data?.message || "Server error while fetching transcript.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#F4F6FB] py-10 px-2 print:bg-white print:p-0 print:m-0">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Search Card - Hidden when printing */}
                <div className="bg-white p-6 rounded-xl shadow-md print:hidden space-y-4">
                    <h2 className="text-lg font-bold text-slate-800">Generate Student Transcript</h2>
                    <p className="text-xs text-gray-500">Enter the student identification code (e.g., <span className="font-mono text-blue-600">std/00023/26</span>).</p>
                    
                    <form onSubmit={handleSearchTranscript} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="std/00023/26"
                            value={studentIdInput}
                            onChange={(e) => setStudentIdInput(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? "Searching..." : "Get Transcript"}
                        </button>
                    </form>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md">
                            {errorMsg}
                        </div>
                    )}
                </div>

                {/* Transcript Full Display Container */}
                {transcript && (
                    <div id="printable-transcript" className="p-8 bg-white shadow-lg rounded-xl space-y-8 print:shadow-none print:p-6 print:w-full">
                        {/* Header Actions - Hidden when printing */}
                        <div className="flex justify-between items-center print:hidden border-b pb-4">
                            
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-md shadow hover:bg-slate-900 transition"
                            >
                                Print / Export PDF
                            </button>
                        </div>

                        {/* School / Document Title Header (Visible on print) */}
                        <div className="text-center pb-4 border-b">
                            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">ONESMOS NESIB ACADEMY</h2>
                            <p className="text-xs text-gray-500 mt-1">Student Permanent Record & Grade Report</p>
                        </div>

                        {/* Student Bio Header */}
                        <div className="pb-2 flex justify-between items-end">
                            <div>
                                <h1 className="text-xl font-extrabold text-slate-900">{transcript.student.fullName}</h1>
                                <p className="text-xs text-gray-600 font-mono mt-1">Student ID: {transcript.student.studentID}</p>
                            </div>
                            <div className="text-right text-xs text-gray-600">
                                <p>Enrolled Date: {transcript.student.enrolledYear ? new Date(transcript.student.enrolledYear).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Academic Years Section */}
                        {transcript.academicYears.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm">
                                No class sections or grades found for this student across academic records.
                            </div>
                        ) : (
                            transcript.academicYears.map((yearRecord, idx) => (
                                <div key={idx} className="space-y-3 border border-gray-300 rounded-lg p-5 bg-white print:border-gray-400">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <h3 className="font-bold text-slate-800 text-sm">
                                            Academic Year: <span className="text-blue-600 print:text-black">{yearRecord.academicYear}</span> — Grade {yearRecord.gradeLevel}
                                        </h3>
                                        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 print:bg-gray-100 print:text-black print:border-gray-300">
                                            Year Average: {yearRecord.overallYearAverage.toFixed(1)}%
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                                            <thead className="bg-gray-50 print:bg-gray-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Course Name</th>
                                                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Semester 1</th>
                                                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Semester 2</th>
                                                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Yearly Average</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {yearRecord.courses.map((course, cIdx) => (
                                                    <tr key={cIdx}>
                                                        <td className="px-3 py-2 font-medium text-slate-800">
                                                            {course.courseName}
                                                        </td>
                                                        <td className="px-3 py-2 text-center font-mono text-teal-700 print:text-black">
                                                            {course.semester1Score !== null ? `${course.semester1Score.toFixed(1)}%` : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center font-mono text-teal-700 print:text-black">
                                                            {course.semester2Score !== null ? `${course.semester2Score.toFixed(1)}%` : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center font-mono font-bold text-slate-900">
                                                            {course.yearlyAverage.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Footer Signatures */}
                        <div className="pt-16 grid grid-cols-2 gap-8 text-xs text-center page-break-inside-avoid">
                            <div className="border-t border-gray-400 pt-2">
                                <p className="font-semibold text-gray-700">Registrar Signature</p>
                            </div>
                            <div className="border-t border-gray-400 pt-2">
                                <p className="font-semibold text-gray-700">Director / Principal Stamp</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Print Isolation CSS */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-transcript, #printable-transcript * {
                        visibility: visible;
                    }
                    #printable-transcript {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}