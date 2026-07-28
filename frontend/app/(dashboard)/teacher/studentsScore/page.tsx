"use client"
import React, { useEffect, useState } from 'react';
import summeryApi from '@/common/summeryApi';
import Axios from '@/utils/Axios.js';

export default function StudentScoreTablePage() {
    const [allSections, setAllSections] = useState<any[]>([]);
    const [availableAcademicYears, setAvailableAcademicYears] = useState<{ academicYear: string; gradeLevel: string }[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
    const [selectedTargetGrade, setSelectedTargetGrade] = useState<string>('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('semester1');

    // Data & Loading states
    const [gradeConfig, setGradeConfig] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // 1. Fetch User Details & Class Sections, filtering exclusively for the logged-in teacher's assignments
    useEffect(() => {
        const initializeTeacherData = async () => {
            try {
                // Fetch logged-in teacher details
                const userRes = await Axios({
                    ...summeryApi.getUserDetail
                });
                const userData = userRes.data?.data || userRes.data;

                const userRole = userData?.role?.toLowerCase();
                const isAdmin = userRole === 'admin' || userRole === 'superadmin';

                const teacherProfileId = userData?._id;
                const teacherFullName = userData?.personalInfo?.fullName;

                // Fetch all class sections
                const sectionRes = await Axios({
                    ...summeryApi.getAllClassSection
                });
                const sectionsData = sectionRes.data?.data || sectionRes.data || [];

                // Filter sections to ONLY include courses assigned to this specific teacher (unless Admin)
                const teacherSections = sectionsData.map((sec: any) => {
                    const filteredCourses = sec.courses?.filter((c: any) => {
                        if (isAdmin) return true;

                        const courseTeacher = c.teacher;
                        const cTeacherId = typeof courseTeacher === 'string' ? courseTeacher : courseTeacher?._id;
                        const cTeacherName = courseTeacher?.personalInfo?.fullName;

                        const matchesId = teacherProfileId && cTeacherId === teacherProfileId;
                        const matchesName = teacherFullName && cTeacherName && 
                            cTeacherName.toLowerCase().trim() === teacherFullName.toLowerCase().trim();

                        return matchesId || matchesName;
                    }) || [];

                    return {
                        ...sec,
                        courses: filteredCourses
                    };
                }).filter((sec: any) => sec.courses.length > 0);

                setAllSections(teacherSections);

                // Extract unique academic years and grade levels from this teacher's courses
                const yearGradeMap = new Map();
                teacherSections.forEach((sec: any) => {
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
                console.error("Failed to initialize teacher score table filters", error);
            }
        };

        initializeTeacherData();
    }, []);

    // 2. Filter courses and sections based on the selected Academic Year & Grade Level
    useEffect(() => {
        if (!selectedAcademicYear || !selectedTargetGrade || allSections.length === 0) return;

        setSelectedCourseId('');
        setSelectedSectionId('');
        setGradeConfig(null);

        // Filter sections matching the target grade and academic year
        const matchedSections = allSections.filter((sec: any) => {
            if (sec.gradeLevel !== selectedTargetGrade) return false;
            return sec.courses?.some((c: any) => c.academicYear === selectedAcademicYear);
        });

        setSections(matchedSections);

        // Extract unique courses matching the academic year and grade level
        const courseMap = new Map();
        matchedSections.forEach((sec: any) => {
            sec.courses?.forEach((c: any) => {
                if (c.academicYear === selectedAcademicYear && c.course) {
                    courseMap.set(c.course._id, c.course);
                }
            });
        });

        setCourses(Array.from(courseMap.values()));
    }, [selectedAcademicYear, selectedTargetGrade, allSections]);

    // 3. Fetch score table data whenever filters change
    useEffect(() => {
        if (!selectedAcademicYear || !selectedCourseId || !selectedSectionId) {
            setGradeConfig(null);
            return;
        }

        const fetchScoresTable = async () => {
            try {
                setLoading(true);
                const res = await Axios({
                    ...summeryApi.getStudentScoreSheetTable,
                    params: {
                        academicYear: selectedAcademicYear,
                        targetGrade: selectedTargetGrade,
                        courseId: selectedCourseId,
                        sectionId: selectedSectionId,
                        semester: selectedSemester
                    }
                });
                setGradeConfig(res.data.data);
            } catch (error) {
                console.error("Failed to load student score sheet", error);
                setGradeConfig(null);
            } finally {
                setLoading(false);
            }
        };

        fetchScoresTable();
    }, [selectedAcademicYear, selectedTargetGrade, selectedCourseId, selectedSectionId, selectedSemester]);

    const handleAcademicYearChange = (combinedValue: string) => {
        const [year, grade] = combinedValue.split('|');
        setSelectedAcademicYear(year);
        setSelectedTargetGrade(grade);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Student Score Sheet Table</h1>
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

            {/* Filter Selectors Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Choose Course</option>
                        {courses.map((course: any) => (
                            <option key={course._id} value={course._id}>
                                {course.courseName || course.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Section</label>
                    <select
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Choose Section</option>
                        {sections.map((section: any) => (
                            <option key={section._id} value={section._id}>
                                {section.sectionName}
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
            {!selectedAcademicYear || !selectedCourseId || !selectedSectionId ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                    Please select an academic year, course, and section above to view the student score sheet.
                </div>
            ) : loading ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200">
                    Loading score sheet...
                </div>
            ) : !gradeConfig || !gradeConfig.studentTableData || gradeConfig.studentTableData.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                    No student score records found for this selection yet.
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-md font-semibold text-slate-900 tracking-tight">Class Score</h3>
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            Total Students: {gradeConfig.totalStudents}
                        </span>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">No</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student ID</th>
                                    
                                    {/* Dynamic Assessment Columns Header */}
                                    {gradeConfig.assessmentsList?.map((assessment: any, idx: number) => (
                                        <th key={idx} className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                                            {assessment.title}
                                            <span className="block font-normal text-gray-400 text-[10px]">({assessment.maxScore})</span>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {gradeConfig.studentTableData.map((row: any, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {row.student?.fullName || "Unknown Student"}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {row.student?.studentID || "N/A"}
                                        </td>

                                        {/* Dynamic Assessment Individual Scores */}
                                        {gradeConfig.assessmentsList?.map((assessment: any, idx: number) => (
                                            <td key={idx} className="bg-white rounded-lg text-xs outline-none font-mono font-bold text-teal-600 text-center">
                                                {row.scores[assessment.title] !== undefined ? row.scores[assessment.title] : "-"}
                                            </td>
                                        ))}

                                        <td className="w-24 p-2 bg-white rounded-lg text-xs outline-none font-mono font-bold text-teal-600 text-center">
                                            {row.totalEarned} / {row.totalMax}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}