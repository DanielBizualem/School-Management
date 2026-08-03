"use client"
import React, { useEffect, useState } from 'react';
import summeryApi from '@/common/summeryApi';
import Axios from '@/utils/Axios.js';
import { Download, Loader2, AlertTriangle, FileSpreadsheet, ChevronDown } from 'lucide-react';

interface StudentInfo {
    _id: string;
    fullName?: string;
    studentID?: string;
}

interface RosterStudentRow {
    student: StudentInfo;
    courses: { [courseId: string]: number };
    totalScore: number;
    averageScore: number;
    rank?: number;
}

interface RosterData {
    academicYear: string;
    targetGrade: string;
    sectionName: string;
    coursesList: { _id: string; courseName: string }[];
    rosterRows: RosterStudentRow[];
    totalStudents: number;
}

export default function HomeroomRosterPage() {
    const [allSections, setAllSections] = useState<any[]>([]);
    const [availableAcademicYears, setAvailableAcademicYears] = useState<{ academicYear: string; gradeLevel: string }[]>([]);
    const [homeroomSections, setHomeroomSections] = useState<any[]>([]);

    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
    const [selectedTargetGrade, setSelectedTargetGrade] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('semester1');

    const [roster, setRoster] = useState<RosterData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [hasAccess, setHasAccess] = useState<boolean>(false);
    const [userRoleType, setUserRoleType] = useState<string>('');

    // 1. Fetch User Details & Sections
    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsCheckingAuth(true);
                const userRes = await Axios({ ...summeryApi.getUserDetail });
                const userData = userRes.data?.data || userRes.data;

                const userRole = userData?.role?.toLowerCase() || '';
                setUserRoleType(userRole);

                const isDirectorOrAdmin = userRole === 'director' || userRole === 'admin' || userRole === 'superadmin';
                const teacherProfileId = userData?._id;
                const teacherFullName = userData?.personalInfo?.fullName;

                const sectionRes = await Axios({ ...summeryApi.getAllClassSection });
                const sectionsData = sectionRes.data?.data || sectionRes.data || [];

                let accessibleSections = sectionsData;

                if (!isDirectorOrAdmin) {
                    accessibleSections = sectionsData.filter((sec: any) => {
                        const secHomeroom = sec.homeroomTeacher;
                        const hId = typeof secHomeroom === 'string' ? secHomeroom : secHomeroom?._id;
                        const hName = secHomeroom?.personalInfo?.fullName;

                        const matchesId = teacherProfileId && hId === teacherProfileId;
                        const matchesName = teacherFullName && hName &&
                            hName.toLowerCase().trim() === teacherFullName.toLowerCase().trim();

                        return matchesId || matchesName;
                    });
                }

                if (accessibleSections.length > 0 || isDirectorOrAdmin) {
                    setHasAccess(true);
                }

                setAllSections(accessibleSections);

                const yearGradeMap = new Map();
                accessibleSections.forEach((sec: any) => {
                    const grade = sec.gradeLevel;
                    sec.courses?.forEach((c: any) => {
                        const year = c.academicYear;
                        if (year && grade) {
                            const key = `${year}-${grade}`;
                            if (!yearGradeMap.has(key)) {
                                yearGradeMap.set(key, { academicYear: year, gradeLevel: grade });
                            }
                        }
                    });
                });

                const uniqueConfigs = Array.from(yearGradeMap.values());
                setAvailableAcademicYears(uniqueConfigs);

                if (uniqueConfigs.length > 0) {
                    setSelectedAcademicYear(uniqueConfigs[0].academicYear);
                    setSelectedTargetGrade(uniqueConfigs[0].gradeLevel);
                }
            } catch (error) {
                console.error("Failed to initialize roster data", error);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        initializeData();
    }, []);

    // 2. Update section dropdown options based on selected Academic Year & Grade Level
    useEffect(() => {
        if (!selectedAcademicYear || !selectedTargetGrade || allSections.length === 0) return;

        setSelectedSectionId('');
        setRoster(null);

        const matchedSections = allSections.filter((sec: any) => {
            if (sec.gradeLevel !== selectedTargetGrade) return false;
            const isDirectorOrAdmin = userRoleType === 'director' || userRoleType === 'admin' || userRoleType === 'superadmin';
            if (isDirectorOrAdmin) return true;

            return sec.courses?.some((c: any) => c.academicYear === selectedAcademicYear);
        });

        setHomeroomSections(matchedSections);

        if (matchedSections.length > 0) {
            setSelectedSectionId(matchedSections[0]._id);
        }
    }, [selectedAcademicYear, selectedTargetGrade, allSections, userRoleType]);

    // 3. Fetch consolidated Roster data
    useEffect(() => {
        if (!selectedAcademicYear || !selectedSectionId) {
            setRoster(null);
            return;
        }

        const fetchRosterData = async () => {
            try {
                setLoading(true);
                const res = await Axios({
                    ...summeryApi.getSectionRoster,
                    params: {
                        academicYear: selectedAcademicYear,
                        targetGrade: selectedTargetGrade,
                        sectionId: selectedSectionId,
                        semester: selectedSemester
                    }
                });
                setRoster(res.data.data);
            } catch (error) {
                console.error("Failed to load section roster", error);
                setRoster(null);
            } finally {
                setLoading(false);
            }
        };

        fetchRosterData();
    }, [selectedAcademicYear, selectedTargetGrade, selectedSectionId, selectedSemester]);

    const handleAcademicYearChange = (combinedValue: string) => {
        const [year, grade] = combinedValue.split('|');
        setSelectedAcademicYear(year);
        setSelectedTargetGrade(grade);
    };

    // 4. Download Table as PDF Function
    const handleDownloadPDF = async () => {
        if (!roster) return;

        try {
            setIsExporting(true);

            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const isLandscape = (roster.coursesList?.length || 0) > 3;
            const doc = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            doc.setFontSize(16);
            doc.setTextColor(30, 41, 59);
            doc.text(`Section Roster Report - ${roster.sectionName}`, 14, 15);

            doc.setFontSize(10);
            doc.setTextColor(100);
            const formattedSem = selectedSemester === 'semester1' ? 'Semester 1' : 'Semester 2';
            doc.text(
                `Academic Year: ${roster.academicYear} | Grade: ${roster.targetGrade} | ${formattedSem} | Total Students: ${roster.totalStudents}`,
                14,
                22
            );

            const headers = [
                ['No', 'Student Name', 'Student ID', ...roster.coursesList.map(c => `${c.courseName} (100%)`), 'Total', 'Avg (%)', 'Rank']
            ];

            const rows = roster.rosterRows.map((row, idx) => {
                const courseScores = roster.coursesList.map(c => {
                    const score = row.courses[c._id];
                    return score !== undefined ? `${score.toFixed(1)}%` : '-';
                });

                return [
                    idx + 1,
                    row.student?.fullName || 'Unknown Student',
                    row.student?.studentID || 'N/A',
                    ...courseScores,
                    row.totalScore?.toFixed(1) || '0.0',
                    `${row.averageScore?.toFixed(1) || '0.0'}%`,
                    row.rank || idx + 1
                ];
            });

            autoTable(doc, {
                startY: 28,
                head: headers,
                body: rows,
                theme: 'striped',
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center'
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5,
                    halign: 'center',
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { halign: 'left', cellWidth: 'auto' },
                    2: { halign: 'left', cellWidth: 'auto' },
                }
            });

            const fileName = `${roster.sectionName}_Roster_${roster.academicYear}_${selectedSemester}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error("Failed to export PDF", error);
            alert("Error generating PDF document. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const selectClass = "w-full appearance-none border border-slate-200 bg-slate-50 rounded-lg pl-3 pr-9 py-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-[#0a2f2b]/20 focus:border-[#0a2f2b]";

    return (
        <div className="p-3 sm:p-6 lg:p-8 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {userRoleType === 'director' ? 'Director Class Roster Reports' : 'Homeroom Student Roster Sheet'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {userRoleType === 'director'
                            ? 'Select any academic year, grade, and section to view consolidated evaluations.'
                            : 'Consolidated evaluations for your homeroom section.'}
                    </p>
                </div>
                {selectedAcademicYear && (
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                            Year: {selectedAcademicYear}
                        </span>
                        {selectedTargetGrade && (
                            <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                Grade {selectedTargetGrade}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {isCheckingAuth ? (
                /* Skeleton Loader while validating permissions */
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="h-10 bg-slate-100 rounded-lg"></div>
                        <div className="h-10 bg-slate-100 rounded-lg"></div>
                        <div className="h-10 bg-slate-100 rounded-lg"></div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <div className="space-y-2">
                                <div className="h-5 w-48 bg-slate-100 rounded"></div>
                                <div className="h-3 w-24 bg-slate-100 rounded"></div>
                            </div>
                            <div className="h-9 w-28 bg-slate-100 rounded-lg"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-10 bg-slate-100 rounded"></div>
                            <div className="h-12 bg-slate-50 rounded"></div>
                            <div className="h-12 bg-slate-50 rounded"></div>
                            <div className="h-12 bg-slate-50 rounded"></div>
                        </div>
                    </div>
                </div>
            ) : !hasAccess ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                    <AlertTriangle size={20} />
                    <p className="text-sm font-medium">You do not have permission to view roster reports.</p>
                </div>
            ) : (
                <>
                    {/* Filter Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Academic Year & Grade</label>
                            <div className="relative">
                                <select
                                    value={`${selectedAcademicYear}|${selectedTargetGrade}`}
                                    onChange={(e) => handleAcademicYearChange(e.target.value)}
                                    className={selectClass}
                                >
                                    {availableAcademicYears.map((config, index) => (
                                        <option key={index} value={`${config.academicYear}|${config.gradeLevel}`}>
                                            {config.academicYear} (Grade {config.gradeLevel})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Class Section</label>
                            <div className="relative">
                                <select
                                    value={selectedSectionId}
                                    onChange={(e) => setSelectedSectionId(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Choose Section</option>
                                    {homeroomSections.map((sec: any) => (
                                        <option key={sec._id} value={sec._id}>
                                            {sec.sectionName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Semester</label>
                            <div className="relative">
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="semester1">Semester 1</option>
                                    <option value="semester2">Semester 2</option>
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    {!selectedSectionId ? (
                        <div className="flex flex-col items-center gap-2 p-10 text-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500">
                            <FileSpreadsheet size={22} className="text-slate-300" />
                            <p className="text-sm">Please select a section above to view the student roster report.</p>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center gap-2 p-10 text-center bg-white rounded-xl shadow-sm border border-slate-200 text-sm text-slate-400">
                            <Loader2 size={16} className="animate-spin" />
                            Loading section roster report...
                        </div>
                    ) : !roster || !roster.rosterRows || roster.rosterRows.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 p-10 text-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500">
                            <FileSpreadsheet size={22} className="text-slate-300" />
                            <p className="text-sm">No student scores submitted or registered for this section yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
                            {/* Table Top Header Bar with PDF Download Button */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">
                                        Student Roster Report — {roster.sectionName}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Total Students: {roster.totalStudents}</p>
                                </div>

                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isExporting}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0a2f2b] hover:bg-[#123f3a] active:bg-[#0a2f2b] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                                >
                                    {isExporting ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Download size={14} />
                                    )}
                                    {isExporting ? 'Generating PDF...' : 'Download PDF'}
                                </button>
                            </div>

                            {/* Roster Table (scrolls horizontally on smaller screens) */}
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="min-w-[720px] w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Student Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Student ID</th>

                                            {roster.coursesList?.map((course: any, idx: number) => (
                                                <th key={idx} className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                                                    {course.courseName}
                                                    <span className="block font-normal text-slate-400 text-[10px]">(100%)</span>
                                                </th>
                                            ))}

                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Total</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Average (%)</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Rank</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {roster.rosterRows.map((row: RosterStudentRow, index: number) => (
                                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.student?.fullName || "Unknown Student"}</td>
                                                <td className="px-4 py-3 text-sm text-slate-500 font-mono">{row.student?.studentID || "N/A"}</td>

                                                {roster.coursesList?.map((course: any, idx: number) => {
                                                    const courseScore = row.courses[course._id];
                                                    return (
                                                        <td key={idx} className="px-4 py-3 text-xs font-mono font-bold text-teal-600 text-center">
                                                            {courseScore !== undefined ? `${courseScore.toFixed(1)}%` : "-"}
                                                        </td>
                                                    );
                                                })}

                                                <td className="px-4 py-3 text-xs font-mono font-bold text-slate-700 text-center">{row.totalScore?.toFixed(1)}</td>
                                                <td className="px-4 py-3 text-xs font-mono font-bold text-blue-600 text-center">{row.averageScore?.toFixed(1)}%</td>
                                                <td className="px-4 py-3 text-sm font-bold text-indigo-600 text-center">{row.rank || index + 1}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}