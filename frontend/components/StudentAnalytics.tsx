import React, { useEffect, useState } from 'react';
import summeryApi from '../common/summeryApi';
import Axios from '@/utils/Axios';

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

interface StudentAnalyticsProps {
    selectedCourseId: string;
    selectedSectionId: string;
    selectedSemester?: string;
}

export default function StudentAnalytics({ 
    selectedCourseId, 
    selectedSectionId, 
    selectedSemester 
}: StudentAnalyticsProps) {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!selectedCourseId || !selectedSectionId) return;

        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await Axios({
                    ...summeryApi.studentAnalytics,
                    params: {
                        courseId: selectedCourseId,
                        sectionId: selectedSectionId,
                        semester: selectedSemester || 'semester1'
                    }
                });
                setAnalytics(res.data.data);
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedCourseId, selectedSectionId, selectedSemester]);

    if (loading) return <div className="p-4 text-center">Loading analytics...</div>;
    if (!analytics || analytics.totalStudents === 0) return <div className="p-4 text-center text-gray-500">No grading data available for analytics yet.</div>;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Class Performance Analytics</h2>

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
    );
}