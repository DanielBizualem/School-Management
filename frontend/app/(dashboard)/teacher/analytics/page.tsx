"use client"
import React, { useEffect, useState } from 'react';
import summeryApi from '@/common/summeryApi';
import Axios from '@/utils/Axios.js';

interface StudentInfo {
    _id: string;
    fullName?: string;
    studentID?: string;
}

interface StudentAnalyticsItem {
    student: StudentInfo;
    totalEarned: number;
    totalMax: number;
    scoreOutOf100: number;
    isPassing: boolean;
}

interface AnalyticsData {
    totalStudents: number;
    passedCount: number;
    failedCount: number;
    highestScore: number;
    lowestScore: number;
    topStudents: StudentAnalyticsItem[];
    bottomStudents: StudentAnalyticsItem[];
}

export default function StudentAnalyticsPage() {
    // 1. Dropdown filter states
    const [courses, setCourses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('semester1');

    // 2. Analytics data & loading states
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Fetch initial courses/sections list for the teacher dropdowns on mount
    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                // Adjust endpoint based on how your app fetches courses/sections for the teacher
                const res = await Axios({
                    ...summeryApi.getCourseAndSection
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

    // Fetch analytics whenever the selections change
    useEffect(() => {
        if (!selectedCourseId || !selectedSectionId) {
            setAnalytics(null);
            return;
        }

        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await Axios({
                    ...summeryApi.studentAnalytics,
                    params: {
                        courseId: selectedCourseId,
                        sectionId: selectedSectionId,
                        semester: selectedSemester
                    }
                });
                setAnalytics(res.data.data);
            } catch (error) {
                console.error("Failed to load analytics", error);
                setAnalytics(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedCourseId, selectedSectionId, selectedSemester]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Class Performance Analytics</h1>

            {/* Filter Selectors Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">-- Choose Course --</option>
                        {courses.map((course: any) => (
                            <option key={course._id} value={course._id}>
                                {course.courseName || course.name || course._id}
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
                        <option value="">-- Choose Section --</option>
                        {sections.map((section: any) => (
                            <option key={section._id} value={section._id}>
                                {section.sectionName || section._id}
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

            {/* Content Section */}
            {!selectedCourseId || !selectedSectionId ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                    Please select a course and section above to view analytics.
                </div>
            ) : loading ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200">Loading analytics...</div>
            ) : !analytics || analytics.totalStudents === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                    No grading data available for this course and section yet.
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total Students Passed</p>
                            <p className="text-2xl font-bold text-blue-900">{analytics.passedCount} <span className="text-sm font-normal">/ {analytics.totalStudents}</span></p>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">Total Students Failed</p>
                            <p className="text-2xl font-bold text-red-900">{analytics.failedCount} <span className="text-sm font-normal">/ {analytics.totalStudents}</span></p>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Highest Score (out of 100)</p>
                            <p className="text-2xl font-bold text-green-900">{analytics.highestScore}%</p>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-600 font-medium">Lowest Score (out of 100)</p>
                            <p className="text-2xl font-bold text-amber-900">{analytics.lowestScore}%</p>
                        </div>
                    </div>

                    {/* Lists: Top 3 & Bottom 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {/* Best 3 Students */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-md font-semibold text-green-700 mb-3">🏆 Top 3 Best Performers</h3>
                            <ul className="space-y-2">
                                {analytics.topStudents.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                                        <div>
                                            <p className="font-medium text-gray-800">{item.student?.fullName || "Unknown Student"}</p>
                                            <p className="text-xs text-gray-500">ID: {item.student?.studentID}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold text-sm">
                                            {item.scoreOutOf100}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Bottom 3 Students (Falling Behind) */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-md font-semibold text-red-700 mb-3">⚠️ Students Needing Attention (Bottom 3)</h3>
                            <ul className="space-y-2">
                                {analytics.bottomStudents.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                                        <div>
                                            <p className="font-medium text-gray-800">{item.student?.fullName || "Unknown Student"}</p>
                                            <p className="text-xs text-gray-500">ID: {item.student?.studentID}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold text-sm">
                                            {item.scoreOutOf100}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}