"use client"
import React, { useEffect, useState } from 'react';
import summeryApi from '@/common/summeryApi';
import Axios from '@/utils/Axios.js';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

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

interface AssessmentStat {
    title: string;
    maxScore: number;
    averageScore: number;
    averagePercentage: number;
}

interface AnalyticsData {
    totalStudents: number;
    passedCount: number;
    failedCount: number;
    highestScore: number;
    lowestScore: number;
    topStudents: StudentAnalyticsItem[];
    bottomStudents: StudentAnalyticsItem[];
    assessmentAverages: AssessmentStat[];
}

export default function StudentAnalyticsPage() {
    const [allSections, setAllSections] = useState<any[]>([]);
    const [availableAcademicYears, setAvailableAcademicYears] = useState<{ academicYear: string; gradeLevel: string }[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
    const [selectedTargetGrade, setSelectedTargetGrade] = useState<string>('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('semester1');

    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // 1. Fetch User Details & Class Sections, then filter for the logged-in teacher
    useEffect(() => {
        const initializeTeacherData = async () => {
            try {
                // Fetch teacher profile details using your getUserDetail API endpoint
                const userRes = await Axios({
                    ...summeryApi.getUserDetail // Ensure this points to your user details API
                });
                const userData = userRes.data?.data || userRes.data;

                const userRole = userData?.role?.toLowerCase();
                const isAdmin = userRole === 'admin' || userRole === 'superadmin';

                // Teacher profile specific IDs & info
                const teacherProfileId = userData?._id; // e.g. "6a588aa7deaa1f6c5b6b8d47"
                const teacherFullName = userData?.personalInfo?.fullName; // e.g. "Bayane Tamiru"

                // Fetch all class sections
                const sectionRes = await Axios({
                    ...summeryApi.getAllClassSection
                });
                const sectionsData = sectionRes.data?.data || sectionRes.data || [];

                // Filter sections to ONLY include courses assigned to this specific teacher
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

                // Extract unique academic years and grade levels from this teacher's assigned courses
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
                console.error("Failed to initialize teacher analytics data", error);
            }
        };

        initializeTeacherData();
    }, []);

    // 2. Update dropdown filters for Courses and Sections based on selected Academic Year & Grade Level
    useEffect(() => {
        if (!selectedAcademicYear || !selectedTargetGrade || allSections.length === 0) return;

        setSelectedCourseId('');
        setSelectedSectionId('');
        setAnalytics(null);

        // Filter sections matching the chosen academic year and target grade
        const matchedSections = allSections.filter((sec: any) => {
            if (sec.gradeLevel !== selectedTargetGrade) return false;
            return sec.courses?.some((c: any) => c.academicYear === selectedAcademicYear);
        });

        setSections(matchedSections);

        // Extract unique courses belonging to this teacher for the selected year and grade
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

    // 3. Fetch analytics data when course and section are chosen
    useEffect(() => {
        if (!selectedAcademicYear || !selectedCourseId || !selectedSectionId) {
            setAnalytics(null);
            return;
        }

        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await Axios({
                    ...summeryApi.studentAnalytics,
                    params: {
                        academicYear: selectedAcademicYear,
                        targetGrade: selectedTargetGrade,
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
    }, [selectedAcademicYear, selectedTargetGrade, selectedCourseId, selectedSectionId, selectedSemester]);

    const handleAcademicYearChange = (combinedValue: string) => {
        const [year, grade] = combinedValue.split('|');
        setSelectedAcademicYear(year);
        setSelectedTargetGrade(grade);
    };

    // --- Skeleton building blocks ---
    const SkeletonBlock = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
        <div className={`bg-slate-200 rounded animate-pulse ${className}`} style={style} />
    );

    const SkeletonStatCard = ({ colorClass }: { colorClass: string }) => (
        <div className={`p-4 rounded-lg border ${colorClass}`}>
            <SkeletonBlock className="h-3 w-28 mb-2" />
            <SkeletonBlock className="h-6 w-16" />
        </div>
    );

    const SkeletonChartCard = ({ heightClass }: { heightClass: string }) => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className={`w-full ${heightClass} flex flex-col gap-3`}>
                <SkeletonBlock className="h-4 w-48 mx-auto" />
                <div className="flex-1 flex items-end justify-center gap-2 px-4 pb-2">
                    {[40, 65, 50, 80, 55, 70].map((h, i) => (
                        <SkeletonBlock key={i} className="w-8" style={{ height: `${h}%` } as React.CSSProperties} />
                    ))}
                </div>
            </div>
        </div>
    );

    const SkeletonListCard = () => (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <SkeletonBlock className="h-4 w-40 mb-3" />
            <ul className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
                        <div className="flex flex-col gap-1.5">
                            <SkeletonBlock className="h-3.5 w-28" />
                            <SkeletonBlock className="h-2.5 w-16" />
                        </div>
                        <SkeletonBlock className="h-6 w-12 rounded-full" />
                    </li>
                ))}
            </ul>
        </div>
    );

    const AnalyticsSkeleton = () => (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SkeletonStatCard colorClass="bg-blue-50 border-blue-200" />
                <SkeletonStatCard colorClass="bg-red-50 border-red-200" />
                <SkeletonStatCard colorClass="bg-green-50 border-green-200" />
                <SkeletonStatCard colorClass="bg-amber-50 border-amber-200" />
            </div>

            {/* Doughnut + ranked bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonChartCard heightClass="h-72 md:h-80" />
                <SkeletonChartCard heightClass="h-72 md:h-80" />
            </div>

            {/* Assessment averages bar */}
            <SkeletonChartCard heightClass="h-72 md:h-96" />

            {/* Top/bottom lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <SkeletonListCard />
                <SkeletonListCard />
            </div>
        </div>
    );

    // --- Chart 1: Assessment averages (bar) ---
    const assessmentChartData = {
        labels: analytics?.assessmentAverages?.map(item => item.title) || [],
        datasets: [
            {
                label: 'Class Average Performance (%)',
                data: analytics?.assessmentAverages?.map(item => item.averagePercentage) || [],
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgb(37, 99, 235)',
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const assessmentChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: 'Assessment Comparison (Class Average % per Assessment)' },
        },
        scales: { y: { beginAtZero: true, max: 100 } },
    };

    // --- Chart 2: Pass / Fail split (doughnut) ---
    const passFailChartData = {
        labels: ['Passed', 'Failed'],
        datasets: [
            {
                data: [analytics?.passedCount || 0, analytics?.failedCount || 0],
                backgroundColor: ['rgba(16, 185, 129, 0.75)', 'rgba(239, 68, 68, 0.75)'],
                borderColor: ['rgb(5, 150, 105)', 'rgb(220, 38, 38)'],
                borderWidth: 1,
            },
        ],
    };

    const passFailChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const },
            title: { display: true, text: 'Pass / Fail Distribution' },
        },
        cutout: '60%',
    };

    // --- Chart 3: Top vs Bottom performers (horizontal bar) ---
    const rankedStudentsChartData = {
        labels: [
            ...(analytics?.topStudents?.map(s => s.student?.fullName || 'Unknown') || []),
            ...(analytics?.bottomStudents?.map(s => s.student?.fullName || 'Unknown') || []),
        ],
        datasets: [
            {
                label: 'Score (%)',
                data: [
                    ...(analytics?.topStudents?.map(s => s.scoreOutOf100) || []),
                    ...(analytics?.bottomStudents?.map(s => s.scoreOutOf100) || []),
                ],
                backgroundColor: [
                    ...(analytics?.topStudents?.map(() => 'rgba(16, 185, 129, 0.7)') || []),
                    ...(analytics?.bottomStudents?.map(() => 'rgba(239, 68, 68, 0.7)') || []),
                ],
                borderColor: [
                    ...(analytics?.topStudents?.map(() => 'rgb(5, 150, 105)') || []),
                    ...(analytics?.bottomStudents?.map(() => 'rgb(220, 38, 38)') || []),
                ],
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const rankedStudentsChartOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top 3 vs Bottom 3 Performers' },
        },
        scales: { x: { beginAtZero: true, max: 100 } },
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Class Performance Analytics</h1>
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

            {/* Content Section */}
            {!selectedAcademicYear || !selectedCourseId || !selectedSectionId ? (
                <div className="text-sm text-slate-500 mt-1">
                    Please select an academic year, your assigned course, and section above to view analytics.
                </div>
            ) : loading ? (
                <AnalyticsSkeleton />
            ) : !analytics || analytics.totalStudents === 0 ? (
                <div className="text-sm text-slate-500 mt-1">
                    No grading data available for this selection yet.
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Stat cards */}
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
                            <p className="text-sm text-green-600 font-medium">Highest Score</p>
                            <p className="text-2xl font-bold text-green-900">{analytics.highestScore}%</p>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-600 font-medium">Lowest Score</p>
                            <p className="text-2xl font-bold text-amber-900">{analytics.lowestScore}%</p>
                        </div>
                    </div>

                    {/* Pass/Fail doughnut + Top/Bottom performers bar, side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="w-full h-72 md:h-80">
                                <Doughnut data={passFailChartData} options={passFailChartOptions} />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="w-full h-72 md:h-80">
                                <Bar data={rankedStudentsChartData} options={rankedStudentsChartOptions} />
                            </div>
                        </div>
                    </div>

                    {/* Assessment averages bar chart */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="w-full h-72 md:h-96">
                            <Bar data={assessmentChartData} options={assessmentChartOptions} />
                        </div>
                    </div>

                    {/* Detailed top/bottom lists (kept for names/IDs, complements the chart above) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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