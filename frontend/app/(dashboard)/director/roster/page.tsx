"use client"
import React, { useEffect, useState } from 'react';
import summeryApi from '@/common/summeryApi';
import Axios from '@/utils/Axios.js';

interface StudentInfo {
    _id: string;
    fullName?: string;
    studentID?: string;
}

interface RosterStudentRow {
    student: StudentInfo;
    courses: { [courseId: string]: number }; // courseId -> score out of 100
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
    const [hasAccess, setHasAccess] = useState<boolean>(false);
    const [userRoleType, setUserRoleType] = useState<string>('');

    // 1. Fetch User Details & Sections, handling Director/Admin vs Homeroom Teacher permissions
    useEffect(() => {
        const initializeData = async () => {
            try {
                // Fetch logged-in user profile
                const userRes = await Axios({
                    ...summeryApi.getUserDetail
                });
                const userData = userRes.data?.data || userRes.data;

                const userRole = userData?.role?.toLowerCase() || '';
                setUserRoleType(userRole);
                
                const isDirectorOrAdmin = userRole === 'director' || userRole === 'admin' || userRole === 'superadmin';

                const teacherProfileId = userData?._id;
                const teacherFullName = userData?.personalInfo?.fullName;

                // Fetch all class sections
                const sectionRes = await Axios({
                    ...summeryApi.getAllClassSection
                });
                const sectionsData = sectionRes.data?.data || sectionRes.data || [];

                let accessibleSections = sectionsData;

                if (!isDirectorOrAdmin) {
                    // Filter sections strictly where this teacher is designated as homeroomTeacher
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

                // Extract unique academic years and grade levels from accessible sections
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
            // For Directors/Admins, show all sections for this grade/year even if courses array structure varies
            const isDirectorOrAdmin = userRoleType === 'director' || userRoleType === 'admin' || userRoleType === 'superadmin';
            if (isDirectorOrAdmin) return true;

            return sec.courses?.some((c: any) => c.academicYear === selectedAcademicYear);
        });

        setHomeroomSections(matchedSections);

        if (matchedSections.length > 0) {
            setSelectedSectionId(matchedSections[0]._id);
        }
    }, [selectedAcademicYear, selectedTargetGrade, allSections, userRoleType]);

    // 3. Fetch consolidated Roster data when Section and Semester change
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

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                        {userRoleType === 'director' ? 'Director Class Roster Reports' : 'Homeroom Student Roster Sheet'}
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {userRoleType === 'director' 
                            ? 'Select any academic year, grade, and section to view consolidated 100% course evaluations.' 
                            : 'Consolidated 100% course evaluations for your homeroom section.'}
                    </p>
                </div>
                {selectedAcademicYear && (
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-full">
                            Year: {selectedAcademicYear}
                        </span>
                        {selectedTargetGrade && (
                            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
                                Grade {selectedTargetGrade}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {!hasAccess && availableAcademicYears.length === 0 ? (
                <div className="p-8 text-center bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm">
                    ⚠️ You do not have permission to view roster reports.
                </div>
            ) : (
                <>
                    {/* Filter Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year & Grade</label>
                            <select
                                value={`${selectedAcademicYear}|${selectedTargetGrade}`}
                                onChange={(e) => handleAcademicYearChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                {availableAcademicYears.map((config, index) => (
                                    <option key={index} value={`${config.academicYear}|${config.gradeLevel}`}>
                                        {config.academicYear} (Grade {config.gradeLevel})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class Section</label>
                            <select
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Choose Section</option>
                                {homeroomSections.map((sec: any) => (
                                    <option key={sec._id} value={sec._id}>
                                        {sec.sectionName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Semester</label>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="semester1">Semester 1</option>
                                <option value="semester2">Semester 2</option>
                            </select>
                        </div>
                    </div>

                    {/* Content Area */}
                    {!selectedSectionId ? (
                        <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                            Please select a section above to view the student roster report.
                        </div>
                    ) : loading ? (
                        <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200">
                            Loading section roster report...
                        </div>
                    ) : !roster || !roster.rosterRows || roster.rosterRows.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                            No student scores submitted or registered for this section yet.
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-md font-semibold text-slate-900 tracking-tight">
                                    Section Roster Report ({roster.sectionName})
                                </h3>
                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                    Total Students: {roster.totalStudents}
                                </span>
                            </div>

                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student ID</th>

                                            {/* Dynamic Course Columns */}
                                            {roster.coursesList?.map((course: any, idx: number) => (
                                                <th key={idx} className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                                                    {course.courseName}
                                                    <span className="block font-normal text-gray-400 text-[10px]">(100%)</span>
                                                </th>
                                            ))}

                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Total</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Average (%)</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Rank</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {roster.rosterRows.map((row: RosterStudentRow, index: number) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {row.student?.fullName || "Unknown Student"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {row.student?.studentID || "N/A"}
                                                </td>

                                                {/* Scores per course */}
                                                {roster.coursesList?.map((course: any, idx: number) => {
                                                    const courseScore = row.courses[course._id];
                                                    return (
                                                        <td key={idx} className="bg-white rounded-lg text-xs outline-none font-mono font-bold text-teal-600 text-center">
                                                            {courseScore !== undefined ? `${courseScore.toFixed(1)}%` : "-"}
                                                        </td>
                                                    );
                                                })}

                                                <td className="px-4 py-3 text-xs outline-none font-mono font-bold text-slate-700 text-center">
                                                    {row.totalScore?.toFixed(1)}
                                                </td>
                                                <td className="px-4 py-3 text-xs outline-none font-mono font-bold text-blue-600 text-center">
                                                    {row.averageScore?.toFixed(1)}%
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-indigo-600 text-center">
                                                    {row.rank || index + 1}
                                                </td>
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