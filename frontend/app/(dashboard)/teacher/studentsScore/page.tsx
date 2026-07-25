"use client"
import React, { useEffect, useState } from 'react';
import summeryApi from '@/common/summeryApi';
import Axios from '@/utils/Axios.js';

export default function StudentScoreTablePage() {
    // Filter states
    const [courses, setCourses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('semester1');

    // Data & Loading states
    const [gradeConfig, setGradeConfig] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Fetch dropdown filter options on mount
    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const res = await Axios({
                    ...summeryApi.getCourseAndSection,
                });
                if (res.data && res.data.success) {
                    setCourses(res.data.courses || []);
                    setSections(res.data.sections || []);
                }
            } catch (error) {
                console.error("Failed to load filter options", error);
            }
        };

        fetchFiltersData();
    }, []);

    // Fetch score table data whenever filters change
    useEffect(() => {
        if (!selectedCourseId || !selectedSectionId) {
            setGradeConfig(null);
            return;
        }

        const fetchScoresTable = async () => {
            try {
                setLoading(true);
                const res = await Axios({
                    ...summeryApi.getStudentScoreSheetTable,
                    params: {
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
    }, [selectedCourseId, selectedSectionId, selectedSemester]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Student Score Sheet Table</h1>

            {/* Filter Selectors Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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
            {!selectedCourseId || !selectedSectionId ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                    Please select a course and section above to view the student score sheet.
                </div>
            ) : loading ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200">
                    Loading score sheet...
                </div>
            ) : !gradeConfig || !gradeConfig.studentTableData || gradeConfig.studentTableData.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                    No student score records found for this course and section yet.
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
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 ">Student Name</th>
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
                                            <td key={idx} className=" bg-white rounded-lg text-xs outline-none font-mono font-bold text-teal-600 text-center">
                                                {row.scores[assessment.title] !== undefined ? row.scores[assessment.title] : "-"}
                                            </td>
                                        ))}

                                        <td className="w-24 p-2 bg-white  rounded-lg text-xs outline-none font-mono font-bold text-teal-600 text-center">
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