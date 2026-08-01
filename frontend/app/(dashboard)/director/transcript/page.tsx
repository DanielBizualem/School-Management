"use client";
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
    totalScore?: number;
    rank?: number | string;
    conduct?: string;
}

interface TranscriptData {
    student: {
        _id: string;
        fullName: string;
        studentID: string;
        enrolledYear?: string;
        sex?: string;
        studentSex?: string;
        age?: number | string;
        photo?: string;
        studentPhoto?: string;
    };
    academicYears: AcademicYearTranscript[];
}

export default function StudentTranscriptSearchPage() {
    const [transcript, setTranscript] = useState<TranscriptData | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [searchId, setSearchId] = useState<string>('');
    const [searchLoading, setSearchLoading] = useState<boolean>(false);

    const handleSearchTranscript = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetId = searchId.trim();
        if (!targetId) return;

        try {
            setSearchLoading(true);
            setErrorMsg(null);
            setTranscript(null);

            const apiConfig = summeryApi.getStudentTranscript(targetId);
            const res = await Axios(apiConfig);

            if (res.data?.success) {
                const rawData = res.data.data;
                if (rawData?.student) {
                    if (rawData.student.studentPhoto && !rawData.student.photo) {
                        rawData.student.photo = rawData.student.studentPhoto;
                    }
                    if (rawData.student.studentSex && !rawData.student.sex) {
                        rawData.student.sex = rawData.student.studentSex;
                    }
                }
                setTranscript(rawData);
            } else {
                setErrorMsg(res.data?.message || "Student transcript could not be found.");
            }
        } catch (error: any) {
            console.error("Failed to load student transcript", error);
            setErrorMsg(error?.response?.data?.message || "Server error while fetching transcript.");
        } finally {
            setSearchLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const preparePageAcademicYears = (category: 'lower' | 'upper', years: AcademicYearTranscript[]) => {
        if (!years || !Array.isArray(years)) return [];
        
        return years.filter(yr => {
            const gradeNum = parseInt(yr.gradeLevel, 10);
            if (isNaN(gradeNum)) return false;
            if (category === 'lower') {
                return gradeNum === 9 || gradeNum === 10;
            } else {
                return gradeNum === 11 || gradeNum === 12;
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#F4F6FB] py-10 px-2 print:bg-white print:p-0 print:m-0">
            <div className="max-w-4xl mx-auto space-y-6">
                
                <div className="bg-white p-6 rounded-xl shadow-md print:hidden space-y-4 border border-indigo-100">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            🔍 Student Transcript Search
                        </h2>
                    </div>
                    <p className="text-xs text-gray-500">Enter student ID to load records directly from the database (e.g., <span className="font-mono text-indigo-600">std/00025/26</span>).</p>
                    
                    <form onSubmit={handleSearchTranscript} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Enter Student ID..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                        <button
                            type="submit"
                            disabled={searchLoading}
                            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {searchLoading ? "Searching..." : "Search Transcript"}
                        </button>
                    </form>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md print:hidden">
                        {errorMsg}
                    </div>
                )}

                {transcript && (() => {
                    const page1Years = preparePageAcademicYears('lower', transcript.academicYears);
                    const page2Years = preparePageAcademicYears('upper', transcript.academicYears);
                    
                    const studentPhotoUrl = transcript.student?.studentPhoto || transcript.student?.photo;
                    const sexDisplay = transcript.student?.sex || transcript.student?.studentSex || '';

                    const renderTranscriptPage = (yearsSegment: AcademicYearTranscript[], pageTitleTag: string) => {
                        if (yearsSegment.length === 0) return null;

                        return (
                            <div className="p-8 bg-white shadow-lg rounded-xl space-y-6 text-black border border-gray-200 print:shadow-none print:p-6 print:w-full print:border-none font-serif page-break-after-always" key={pageTitleTag}>
                                
                                <div className="flex justify-between items-start border-b-2 border-black pb-3">
                                    <div className="w-16 h-16 flex items-center justify-center text-center font-bold text-[10px]">
                                        <img src="https://res.cloudinary.com/dsjiso86u/image/upload/v1785101664/onismos-removebg-preview_h7hrle.png" alt="onismos" width={50} height={20} className="rounded-sm"/>
                                    </div>
                                    <div className="text-center flex-1 px-4">
                                        <h2 className="text-xl font-bold tracking-wide uppercase">EECMY-CS Onesimos Nesib Academy</h2>
                                        <p className="text-xs italic mt-0.5">Gonfoo Warra Mo'anii Argachuuf Nan Kaadha!!! Filp. 3:14</p>
                                        <p className="text-xs italic">Press to win the prize!!! Phil. 3:14</p>
                                    </div>
                                    <div className="w-20 h-24 flex items-center justify-center overflow-hidden bg-white">
                                        {studentPhotoUrl ? (
                                            <img 
                                                src={studentPhotoUrl} 
                                                alt={transcript.student.fullName} 
                                                className="w-full h-full object-cover"
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <span className="text-[9px] text-center text-gray-400 p-1">Student Photo</span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-center">
                                    <h1 className="text-2xl font-bold underline tracking-wider">Student's Transcript</h1>
                                </div>

                                <div className="text-sm space-y-1.5 border-b border-black pb-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold">Student's Name:</span> 
                                        <span className="border-b border-dotted border-black flex-1 px-2 font-medium">{transcript.student.fullName}</span>
                                    </div>
                                    <div className="flex gap-8 pt-1">
                                        <div><span className="font-semibold">Sex:</span> <span className="border-b border-dotted border-black px-2">{sexDisplay}</span></div>
                                        <div><span className="font-semibold">Age:</span> <span className="border-b border-dotted border-black px-2">{transcript.student.age || '-'}</span></div>
                                        <div className="flex-1"><span className="font-semibold">Student ID:</span> <span className="border-b border-dotted border-black px-2 font-mono">{transcript.student.studentID}</span></div>
                                    </div>
                                    <div className="flex gap-8 pt-1">
                                        <div><span className="font-semibold">Promoted to:</span> <span className="border-b border-dotted border-black w-24 inline-block"></span></div>
                                        <div><span className="font-semibold">Detained in:</span> <span className="border-b border-dotted border-black w-24 inline-block"></span></div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-black text-xs table-fixed">
                                        <colgroup>
                                            <col className="w-10" />
                                            <col className="w-48" />
                                            {yearsSegment.map((_, i) => (
                                                <React.Fragment key={i}>
                                                    <col className="w-12" />
                                                    <col className="w-12" />
                                                    <col className="w-14" />
                                                </React.Fragment>
                                            ))}
                                        </colgroup>
                                        <thead>
                                            <tr className="bg-gray-100 text-center font-bold">
                                                <th className="border border-black p-1.5">No</th>
                                                <th className="border border-black p-1.5 text-left truncate">Subject</th>
                                                {yearsSegment.map((yr, idx) => (
                                                    <th key={idx} colSpan={3} className="border border-black p-1.5 truncate">
                                                        {yr.academicYear} (G-{yr.gradeLevel})
                                                    </th>
                                                ))}
                                            </tr>
                                            <tr className="bg-gray-50 text-center font-semibold text-[11px]">
                                                <th className="border border-black p-1"></th>
                                                <th className="border border-black p-1"></th>
                                                {yearsSegment.map((_, idx) => (
                                                    <React.Fragment key={idx}>
                                                        <th className="border border-black p-1 truncate">Sem I</th>
                                                        <th className="border border-black p-1 truncate">Sem II</th>
                                                        <th className="border border-black p-1 truncate">Ave.</th>
                                                    </React.Fragment>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {yearsSegment[0]?.courses?.map((courseRef, courseIdx) => {
                                                const courseName = courseRef.courseName;
                                                return (
                                                    <tr key={courseIdx} className="hover:bg-gray-50">
                                                        <td className="border border-black p-1 text-center font-mono">{courseIdx + 1}</td>
                                                        <td className="border border-black p-1 font-medium truncate">{courseName}</td>
                                                        {yearsSegment.map((yr, yIdx) => {
                                                            const matchedCourse = yr.courses.find(c => c.courseName === courseName);
                                                            return (
                                                                <React.Fragment key={yIdx}>
                                                                    <td className="border border-black p-1 text-center font-mono">
                                                                        {matchedCourse?.semester1Score ?? '-'}
                                                                    </td>
                                                                    <td className="border border-black p-1 text-center font-mono">
                                                                        {matchedCourse?.semester2Score ?? '-'}
                                                                    </td>
                                                                    <td className="border border-black p-1 text-center font-mono font-semibold">
                                                                        {matchedCourse?.yearlyAverage !== undefined ? matchedCourse.yearlyAverage.toFixed(1) : '-'}
                                                                    </td>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}

                                            <tr className="font-bold bg-gray-50">
                                                <td className="border border-black p-1 text-center"></td>
                                                <td className="border border-black p-1">Average</td>
                                                {yearsSegment.map((yr, idx) => (
                                                    <td key={idx} className="border border-black p-1 text-center font-mono" colSpan={3}>
                                                        {yr.overallYearAverage !== undefined ? `${yr.overallYearAverage.toFixed(2)}%` : '-'}
                                                    </td>
                                                ))}
                                            </tr>

                                            <tr className="font-semibold">
                                                <td className="border border-black p-1 text-center"></td>
                                                <td className="border border-black p-1">Rank</td>
                                                {yearsSegment.map((yr, idx) => (
                                                    <td key={idx} className="border border-black p-1 text-center font-mono" colSpan={3}>
                                                        {yr.rank || '-'}
                                                    </td>
                                                ))}
                                            </tr>

                                            <tr className="font-semibold">
                                                <td className="border border-black p-1 text-center"></td>
                                                <td className="border border-black p-1">Absence</td>
                                                {yearsSegment.map((_, idx) => (
                                                    <td key={idx} className="border border-black p-1 text-center font-mono" colSpan={3}>-</td>
                                                ))}
                                            </tr>

                                            <tr className="font-semibold">
                                                <td className="border border-black p-1 text-center"></td>
                                                <td className="border border-black p-1">Conduct</td>
                                                {yearsSegment.map((yr, idx) => (
                                                    <td key={idx} className="border border-black p-1 text-center font-mono" colSpan={3}>
                                                        {yr.conduct || 'A'}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="text-[11px] space-y-1 pt-2">
                                    <p className="font-bold"><u>N.B.</u></p>
                                    <p>a) This transcript is not valid if erasures or alterations are there.</p>
                                    <p>b) The student has returned all the school properties. Therefore, we don't have any claim for his/her testimony.</p>
                                </div>

                                <div className="pt-8 flex justify-between items-end text-xs page-break-inside-avoid">
                                    <div className="space-y-4">
                                        <p className="font-semibold">Record Officer</p>
                                        <div className="border-b border-black w-40"></div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <div className="h-16"></div>
                                        <p className="font-semibold">The School Director</p>
                                    </div>
                                    <div className="space-y-4 text-right">
                                        <p className="font-semibold">Vice Director</p>
                                        <div className="border-b border-black w-40 ml-auto"></div>
                                    </div>
                                </div>

                                <div className="text-center text-[10px] italic border-t border-black pt-2 mt-4 text-gray-600 flex justify-between">
                                    <span>Milka'ina dhalootaaf sababa ni taana!!!</span>
                                    <span>For the generation's success, we are a cause...</span>
                                </div>
                            </div>
                        );
                    };

                    return (
                        <div id="printable-transcript" className="space-y-8">
                            <div className="flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-md shadow hover:bg-slate-900 transition"
                                >
                                    Print / Export PDF
                                </button>
                            </div>

                            {page1Years.length > 0 && renderTranscriptPage(page1Years, "Grades 9 - 10")}
                            {page2Years.length > 0 && renderTranscriptPage(page2Years, "Grades 11 - 12")}
                        </div>
                    );
                })()}
            </div>

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
                    .page-break-after-always {
                        page-break-after: always;
                        break-after: page;
                    }
                }
            `}</style>
        </div>
    );
}