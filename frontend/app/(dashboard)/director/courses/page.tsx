'use client';

import React, { useMemo, useState, useEffect } from "react";
import {
    Plus, Search, Loader2, BookOpen, GraduationCap, Inbox, UserCheck, AlertTriangle,
    Users, Pencil, CheckCircle2, Calendar, User, Trash2, ChevronDown, ChevronUp, X
} from "lucide-react";
import { UXCourseItem } from "@/types/uxAdmin";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface CourseAssignmentEntry {
    course: string;
    academicYear: string;
    teacher: string;
}

interface ClassSection {
    _id: string;
    sectionName: string;
    gradeLevels: string;
    academicYear?: string;
    courses?: Array<{
        course?: any;
        academicYear?: string;
        teacher?: any;
    }>;
    students?: string[] | Array<any>;
}

interface TeacherUser {
    _id: string;
    fullName?: string;
    personalInfo?: {
        fullName: string;
        department: string;
    };
}

const GRADE_OPTIONS = ["9", "10", "11", "12"];

function Bone({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />;
}

function CourseRowSkeleton() {
    return (
        <tr className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-5 sm:px-6">
                <Bone className="h-4 w-6" />
            </td>
            <td className="px-4 py-5 sm:px-6">
                <Bone className="h-4 w-48" />
            </td>
            <td className="px-4 py-5 sm:px-6">
                <Bone className="h-4 w-24" />
            </td>
            <td className="px-4 py-5 text-right sm:px-6">
                <Bone className="ml-auto h-8 w-24 rounded-lg" />
            </td>
        </tr>
    );
}

function CourseCardSkeleton() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/3" />
        </div>
    );
}

function AssignmentRowSkeleton() {
    return (
        <tr className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-5 align-top sm:px-6">
                <Bone className="mb-2 h-4 w-20" />
                <Bone className="h-3 w-14" />
            </td>
            <td className="px-4 py-5 align-top sm:px-6">
                <Bone className="h-6 w-24 rounded-lg" />
            </td>
            <td className="px-4 py-5 align-top sm:px-6">
                <Bone className="h-14 w-full max-w-md rounded-xl" />
            </td>
            <td className="px-4 py-5 align-top text-right sm:px-6">
                <Bone className="ml-auto h-8 w-20 rounded-xl" />
            </td>
        </tr>
    );
}

function AssignmentCardSkeleton() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <Bone className="h-4 w-32" />
            <Bone className="h-6 w-24 rounded-lg" />
            <Bone className="h-14 w-full rounded-xl" />
            <Bone className="h-8 w-24 rounded-xl" />
        </div>
    );
}

function PageHeaderSkeleton() {
    return (
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <Bone className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="min-w-0 space-y-2">
                    <Bone className="h-5 w-40 sm:w-48" />
                    <Bone className="h-3.5 w-52 sm:w-64" />
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Bone className="h-10 w-full rounded-xl sm:w-40" />
                <Bone className="h-10 w-full rounded-xl sm:w-40" />
            </div>
        </div>
    );
}

export default function StandaloneCourseManagementPage(): React.JSX.Element {
    const [courses, setCourses] = useState<UXCourseItem[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [activeTab, setActiveTab] = useState<"catalog" | "assignments">("catalog");

    // Course modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [gradeFilter, setGradeFilter] = useState<string>(GRADE_OPTIONS[0]);
    const [courseName, setCourseName] = useState("");
    const [courseId, setCourseId] = useState("");
    const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingCourse, setEditingCourse] = useState<UXCourseItem | null>(null);
    const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

    // Teacher assignment state
    const [sections, setSections] = useState<ClassSection[]>([]);
    const [teachers, setTeachers] = useState<TeacherUser[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    const [sectionAssignments, setSectionAssignments] = useState<{ [sectionId: string]: CourseAssignmentEntry[] }>({});
    const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
    const [editingSectionIds, setEditingSectionIds] = useState<{ [key: string]: boolean }>({});

    // Collapse state mapping for sections (default to true/collapsed)
    const [collapsedSections, setCollapsedSections] = useState<{ [sectionId: string]: boolean }>({});

    const fetchCourses = async () => {
        try {
            setLoadingCourses(true);
            const res = await Axios({ ...summeryApi.getSystemCourses });
            const list = res.data?.data || res.data || [];
            setCourses(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error("Failed to load courses", error);
            setCourses([]);
        } finally {
            setLoadingCourses(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchAssignmentData = async () => {
        try {
            setLoadingAssignments(true);
            const [sectionsRes, teachersRes] = await Promise.all([
                Axios({ ...summeryApi.getAllClassSection }),
                Axios({ ...summeryApi.getAllTeachers })
            ]);

            const sectionList = sectionsRes.data?.data || [];
            const teacherList = teachersRes.data?.data || [];
            setSections(sectionList);
            setTeachers(teacherList);

            const initialMap: { [sectionId: string]: CourseAssignmentEntry[] } = {};
            const initialCollapseMap: { [sectionId: string]: boolean } = {};

            sectionList.forEach((sec: ClassSection) => {
                initialCollapseMap[sec._id] = true;
                let populatedEntries: CourseAssignmentEntry[] = [];

                if (Array.isArray(sec.courses) && sec.courses.length > 0) {
                    populatedEntries = sec.courses.map(item => {
                        let cId = "";
                        if (item.course) {
                            if (typeof item.course === 'object' && item.course !== null) {
                                cId = String((item.course as any)._id || (item.course as any).id || "");
                            } else {
                                cId = String(item.course);
                            }
                        }

                        let tId = "";
                        if (item.teacher) {
                            if (typeof item.teacher === 'object' && item.teacher !== null) {
                                tId = String((item.teacher as any)._id || (item.teacher as any).id || "");
                            } else {
                                tId = String(item.teacher);
                            }
                        }

                        return {
                            course: cId,
                            academicYear: item.academicYear || sec.academicYear || "",
                            teacher: tId
                        };
                    });
                }

                if (populatedEntries.length === 0) {
                    populatedEntries.push({ course: "", academicYear: "", teacher: "" });
                }

                initialMap[sec._id] = populatedEntries;
            });

            setSectionAssignments(initialMap);
            setCollapsedSections(initialCollapseMap);
        } catch (error) {
            console.error("Failed to load assignment data", error);
        } finally {
            setLoadingAssignments(false);
        }
    };

    useEffect(() => {
        if (activeTab === "assignments") {
            fetchAssignmentData();
        }
    }, [activeTab]);

    const toggleSectionCollapse = (sectionId: string) => {
        setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const handleAddCourseRow = (sectionId: string) => {
        setSectionAssignments(prev => ({
            ...prev,
            [sectionId]: [
                ...(prev[sectionId] || []),
                { course: "", academicYear: "", teacher: "" }
            ]
        }));
    };

    const handleRemoveCourseRow = (sectionId: string, index: number) => {
        setSectionAssignments(prev => {
            const currentList = prev[sectionId] || [];
            if (currentList.length === 1) {
                return {
                    ...prev,
                    [sectionId]: [{ course: "", academicYear: "", teacher: "" }]
                };
            }
            const updated = currentList.filter((_, i) => i !== index);
            return {
                ...prev,
                [sectionId]: updated
            };
        });
    };

    const handleAssignmentFieldChange = (sectionId: string, index: number, field: keyof CourseAssignmentEntry, value: string) => {
        setSectionAssignments(prev => {
            const currentList = prev[sectionId] ? [...prev[sectionId]] : [{ course: "", academicYear: "", teacher: "" }];
            currentList[index] = {
                ...currentList[index],
                [field]: value
            };
            return {
                ...prev,
                [sectionId]: currentList
            };
        });
    };

    const handleSaveAssignment = async (sectionId: string) => {
        const entries = sectionAssignments[sectionId] || [];

        for (const entry of entries) {
            if (!entry.course || !entry.academicYear || !entry.teacher) {
                alert("Please ensure every course entry has a selected course, academic year, and teacher assigned.");
                return;
            }
        }

        try {
            setSavingSectionId(sectionId);

            await Axios({
                ...summeryApi.assignTeacher,
                data: {
                    sectionId,
                    courses: entries.map(e => ({
                        course: e.course,
                        academicYear: e.academicYear.trim(),
                        teacher: e.teacher
                    }))
                }
            });

            setEditingSectionIds(prev => ({ ...prev, [sectionId]: false }));
            setCollapsedSections(prev => ({ ...prev, [sectionId]: true }));
            await fetchAssignmentData();
        } catch (error: any) {
            console.error("Failed to update section assignments", error);
            alert(error?.response?.data?.message || "Error saving course assignment details.");
        } finally {
            setSavingSectionId(null);
        }
    };

    const toggleEditSection = (sectionId: string) => {
        const enteringEdit = !editingSectionIds[sectionId];
        setEditingSectionIds(prev => ({ ...prev, [sectionId]: enteringEdit }));
        if (enteringEdit) {
            setCollapsedSections(prev => ({ ...prev, [sectionId]: false }));
        }
    };

    const toggleGrade = (grade: string) => {
        setSelectedGrades(prev =>
            prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
        );
    };

    const resetCourseForm = () => {
        setCourseName("");
        setCourseId("");
        setSelectedGrades([]);
        setFormError(null);
        setEditingCourse(null);
    };

    const closeModal = () => {
        if (submitting) return;
        setIsModalOpen(false);
        resetCourseForm();
    };

    const openAddModal = () => {
        resetCourseForm();
        setIsModalOpen(true);
    };

    const openEditModal = (course: UXCourseItem) => {
        setEditingCourse(course);
        setCourseName(course.courseName || "");
        setCourseId(course.courseCode || "");
        setSelectedGrades(course.gradeLevels ?? []);
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleSubmitCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!courseName.trim() || !courseId.trim()) {
            setFormError("Course name and course code are required.");
            return;
        }
        if (selectedGrades.length === 0) {
            setFormError("Select at least one grade level.");
            return;
        }

        try {
            setSubmitting(true);
            if (editingCourse) {
                // NOTE: verify this matches the actual key in your summeryApi config
                // (e.g. summeryApi.updateCourse / summeryApi.editCourse).
                await Axios({
                    ...summeryApi.updateCourse,
                    data: {
                        courseId: editingCourse._id,
                        courseName: courseName.trim(),
                        courseCode: courseId.trim(),
                        gradeLevels: selectedGrades,
                    }
                });
            } else {
                // NOTE: verify this matches the actual key in your summeryApi config
                // (e.g. summeryApi.registerCourse / summeryApi.createCourse).
                await Axios({
                    ...summeryApi.addCourse,
                    data: {
                        courseName: courseName.trim(),
                        courseCode: courseId.trim(),
                        gradeLevels: selectedGrades,
                    }
                });
            }

            await fetchCourses();
            setIsModalOpen(false);
            resetCourseForm();
        } catch (error: any) {
            console.error("Failed to save course", error);
            setFormError(error?.response?.data?.message || "Could not save this course. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCourse = async (course: UXCourseItem) => {
        const confirmed = window.confirm(`Delete "${course.courseName}"? This cannot be undone.`);
        if (!confirmed) return;

        try {
            setDeletingCourseId(course._id);
            // NOTE: verify this matches the actual key in your summeryApi config
            // (e.g. summeryApi.deleteCourse / summeryApi.removeCourse).
            await Axios({
                ...summeryApi.deleteCourse,
                data: { courseId: course._id }
            });
            await fetchCourses();
        } catch (error: any) {
            console.error("Failed to delete course", error);
            alert(error?.response?.data?.message || "Could not delete this course. Please try again.");
        } finally {
            setDeletingCourseId(null);
        }
    };

    const filteredCourses = useMemo(
        () =>
            courses.filter(
                c =>
                    (c.gradeLevels ?? []).includes(gradeFilter) &&
                    (c.courseName.toLowerCase().includes(search.toLowerCase()) ||
                        c.courseCode.toLowerCase().includes(search.toLowerCase()))
            ),
        [courses, search, gradeFilter]
    );

    const gradeCourseCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        GRADE_OPTIONS.forEach(g => {
            counts[g] = courses.filter(c => (c.gradeLevels ?? []).includes(g)).length;
        });
        return counts;
    }, [courses]);

    if (loadingCourses) {
        return (
            <div className="min-h-screen w-full bg-slate-50 px-4 py-6 sm:px-6 sm:py-10 md:px-10">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                    <PageHeaderSkeleton />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Bone className="h-10 w-full rounded-xl sm:w-72" />
                        <Bone className="h-10 w-full rounded-xl sm:w-64" />
                    </div>
                    {/* Mobile skeleton cards */}
                    <div className="grid grid-cols-1 gap-3 sm:hidden">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <CourseCardSkeleton key={i} />
                        ))}
                    </div>
                    {/* Desktop skeleton table */}
                    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white sm:block">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full border-collapse text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3.5 sm:px-6">No.</th>
                                        <th className="px-4 py-3.5 sm:px-6">Course name</th>
                                        <th className="px-4 py-3.5 sm:px-6">Course code</th>
                                        <th className="px-4 py-3.5 text-right sm:px-6">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <CourseRowSkeleton key={i} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-50 px-4 py-6 sm:px-6 sm:py-10 md:px-10">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 sm:gap-6">

                {/* PAGE HEADER — tabs and "Register course" stay visible on every tab */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0a2f2b] text-white shadow-sm shadow-indigo-200 sm:h-11 sm:w-11">
                            {activeTab === "catalog" ? <BookOpen className="w-5 h-5 text-teal-300" size={20} /> : <UserCheck size={20} />}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                                {activeTab === "catalog" ? "Course catalog" : "Course & teacher assignments"}
                            </h1>
                            <p className="truncate text-xs text-slate-500 sm:text-sm">
                                {activeTab === "catalog"
                                    ? `${courses.length} course${courses.length === 1 ? "" : "s"} registered system-wide`
                                    : "Assign courses, academic years, and teachers to each class section"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
                            <button
                                onClick={() => setActiveTab("catalog")}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 ${
                                    activeTab === "catalog" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Catalog
                            </button>
                            <button
                                onClick={() => setActiveTab("assignments")}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 ${
                                    activeTab === "assignments" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Assignments
                            </button>
                        </div>

                        {/* Always available — registering a course shouldn't require leaving the assignments tab */}
                        <button
                            onClick={openAddModal}
                            className="w-full p-2.5 bg-[#0c3a35] text-white font-medium text-sm rounded-lg hover:bg-[#0a2f2b] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-2"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            Register course
                        </button>
                    </div>
                </div>

                {activeTab === "catalog" && (
                    <>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-sm">
                                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or code..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {GRADE_OPTIONS.map((grade) => (
                                    <button
                                        key={grade}
                                        onClick={() => setGradeFilter(grade)}
                                        className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                                            gradeFilter === grade
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        Grade {grade}
                                        <span className="ml-1.5 text-slate-400">
                                            {gradeCourseCounts[grade] ?? 0}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {search && (
                            <p className="-mt-2 text-xs font-medium text-slate-400">
                                {filteredCourses.length} result{filteredCourses.length === 1 ? "" : "s"} in Grade {gradeFilter}
                            </p>
                        )}

                        {filteredCourses.length > 0 ? (
                            <>
                                {/* MOBILE: card list */}
                                <div className="grid grid-cols-1 gap-3 sm:hidden">
                                    {filteredCourses.map((course, i) => (
                                        <div
                                            key={course._id}
                                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-medium text-slate-400">#{i + 1}</p>
                                                    <p className="truncate text-sm font-semibold text-slate-900">{course.courseName}</p>
                                                    <p className="truncate text-xs text-slate-500">{course.courseCode}</p>
                                                </div>
                                                <div className="shrink-0 rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                                                    Grade {gradeFilter}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                                                <button
                                                    onClick={() => openEditModal(course)}
                                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600"
                                                >
                                                    <Pencil size={12} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCourse(course)}
                                                    disabled={deletingCourseId === course._id}
                                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                >
                                                    {deletingCourseId === course._id
                                                        ? <Loader2 size={12} className="animate-spin" />
                                                        : <Trash2 size={12} />}
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* DESKTOP / TABLET: table */}
                                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
                                    <div className="overflow-x-auto w-full">
                                        <table className="w-full border-collapse text-left">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                                    <th className="w-16 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">No.</th>
                                                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Course name</th>
                                                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Course code</th>
                                                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredCourses.map((course, i) => (
                                                    <tr key={course._id} className="transition hover:bg-slate-50/70">
                                                        <td className="px-4 py-4 text-sm tabular-nums text-slate-400 sm:px-6">
                                                            {i + 1}
                                                        </td>
                                                        <td className="px-4 py-4 sm:px-6">
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {course.courseName}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 sm:px-6">
                                                            <span className="text-sm text-slate-500">
                                                                {course.courseCode}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right sm:px-6">
                                                            <div className="inline-flex items-center gap-2">
                                                                <button
                                                                    onClick={() => openEditModal(course)}
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600"
                                                                >
                                                                    <Pencil size={12} /> Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCourse(course)}
                                                                    disabled={deletingCourseId === course._id}
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                                >
                                                                    {deletingCourseId === course._id
                                                                        ? <Loader2 size={12} className="animate-spin" />
                                                                        : <Trash2 size={12} />}
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-16 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                    <Inbox size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">
                                        {search ? "No courses match your search" : `No courses in Grade ${gradeFilter} yet`}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {search
                                            ? "Try a different name or course code."
                                            : `Register a course and include Grade ${gradeFilter} to see it here.`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "assignments" && (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 rounded-2xl border border-amber-200/80 bg-amber-50 p-4 sm:p-5">
                            <div className="mt-0.5 shrink-0 rounded-xl bg-amber-100 p-2 text-amber-700">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-amber-900">Sections can hold multiple courses</h3>
                                <p className="text-xs leading-relaxed text-amber-700">
                                    Each section can be assigned <strong>several courses</strong>, each with its own academic year and teacher.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                            <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <h3 className="text-sm font-bold text-slate-800">Class sections & course assignments</h3>
                                <span className="text-xs font-medium text-slate-500">
                                    Total sections: <strong className="text-slate-800">{sections.length}</strong>
                                </span>
                            </div>

                            {loadingAssignments ? (
                                <>
                                    {/* Mobile skeleton */}
                                    <div className="grid grid-cols-1 gap-3 p-4 lg:hidden">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <AssignmentCardSkeleton key={i} />
                                        ))}
                                    </div>
                                    {/* Desktop skeleton */}
                                    <div className="hidden overflow-x-auto w-full lg:block">
                                        <table className="w-full min-w-[900px] border-collapse text-left">
                                            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                <tr>
                                                    <th className="px-6 py-3.5">Section & grade</th>
                                                    <th className="px-6 py-3.5">Assigned students</th>
                                                    <th className="px-6 py-3.5">Assigned courses & teachers</th>
                                                    <th className="px-6 py-3.5 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 4 }).map((_, i) => (
                                                    <AssignmentRowSkeleton key={i} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : sections.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 p-12 text-center text-xs text-slate-400">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                        <Inbox size={20} />
                                    </div>
                                    <p>No class sections found.</p>
                                </div>
                            ) : (
                                <>
                                    {/* MOBILE / TABLET: stacked cards (below lg) */}
                                    <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
                                        {sections.map((section) => {
                                            const currentEntries = sectionAssignments[section._id] || [{ course: "", academicYear: "", teacher: "" }];
                                            const isEditing = editingSectionIds[section._id] ?? false;
                                            const isCollapsed = collapsedSections[section._id] ?? true;
                                            const courseCount = section.courses?.length || 0;

                                            return (
                                                <div key={section._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-bold text-slate-900">Grade {section.gradeLevels}</p>
                                                            <span className="text-[10px] text-slate-400">{section.sectionName}</span>
                                                        </div>
                                                        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                                            <Users size={13} className="text-indigo-500" />
                                                            <span>{Array.isArray(section.students) ? section.students.length : 0}</span>
                                                            <span className="text-[10px] font-normal text-indigo-400">students</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4">
                                                        {isEditing ? (
                                                            <div className="space-y-4">
                                                                {currentEntries.map((entry, idx) => (
                                                                    <div key={idx} className="flex flex-col items-stretch gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                                        <div className="w-full space-y-2">
                                                                            <select
                                                                                value={entry.course}
                                                                                onChange={(e) => handleAssignmentFieldChange(section._id, idx, 'course', e.target.value)}
                                                                                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                                                                            >
                                                                                <option value="">Choose Course</option>
                                                                                {courses.map((c) => (
                                                                                    <option key={c._id} value={c._id}>
                                                                                        {c.courseName} ({c.courseCode})
                                                                                    </option>
                                                                                ))}
                                                                            </select>

                                                                            <input
                                                                                type="text"
                                                                                placeholder="Academic Year (e.g. 26)"
                                                                                value={entry.academicYear}
                                                                                onChange={(e) => handleAssignmentFieldChange(section._id, idx, 'academicYear', e.target.value)}
                                                                                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                                                                            />

                                                                            <select
                                                                                value={entry.teacher}
                                                                                onChange={(e) => handleAssignmentFieldChange(section._id, idx, 'teacher', e.target.value)}
                                                                                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                                                                            >
                                                                                <option value="">Choose Teacher</option>
                                                                                {teachers.map((teacher) => {
                                                                                    const teacherName = teacher?.fullName || teacher?.personalInfo?.fullName || teacher._id;
                                                                                    const dept = teacher?.personalInfo?.department ? `(${teacher.personalInfo.department})` : "";
                                                                                    return (
                                                                                        <option key={teacher._id} value={teacher._id}>
                                                                                            {teacherName} {dept}
                                                                                        </option>
                                                                                    );
                                                                                })}
                                                                            </select>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveCourseRow(section._id, idx)}
                                                                            className="inline-flex items-center justify-center gap-1.5 self-end rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-400 transition hover:text-red-600"
                                                                        >
                                                                            <Trash2 size={14} /> Remove
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddCourseRow(section._id)}
                                                                    className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                                                >
                                                                    <Plus size={13} strokeWidth={2.5} /> Add Another Course & Teacher
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                {isCollapsed ? (
                                                                    <button
                                                                        onClick={() => toggleSectionCollapse(section._id)}
                                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                                                                    >
                                                                        <BookOpen size={13} className="text-indigo-600" />
                                                                        <span>{courseCount} Course{courseCount === 1 ? '' : 's'} & Teacher{courseCount === 1 ? '' : 's'} assigned</span>
                                                                        <ChevronDown size={14} className="text-slate-400" />
                                                                    </button>
                                                                ) : (
                                                                    <div className="space-y-3">
                                                                        {section.courses && section.courses.length > 0 ? (
                                                                            section.courses.map((item, idx) => {
                                                                                const rawCourseId = typeof item.course === 'object' && item.course !== null ? (item.course._id || item.course.id) : item.course;
                                                                                const matchedCatalogCourse = courses.find(c => c._id === rawCourseId);
                                                                                const courseTitle = (typeof item.course === 'object' && item.course !== null && item.course.courseName) || matchedCatalogCourse?.courseName || 'Unnamed Course';

                                                                                const rawTeacherId = typeof item.teacher === 'object' && item.teacher !== null ? (item.teacher._id || item.teacher.id) : item.teacher;
                                                                                const matchedTeacher = teachers.find(t => t._id === rawTeacherId);
                                                                                const teacherObjName = (typeof item.teacher === 'object' && item.teacher !== null) ? (item.teacher.fullName || item.teacher.personalInfo?.fullName) : null;
                                                                                const teacherObjDept = (typeof item.teacher === 'object' && item.teacher !== null) ? item.teacher.personalInfo?.department : null;
                                                                                const teacherDisplayName = teacherObjName || matchedTeacher?.fullName || matchedTeacher?.personalInfo?.fullName;
                                                                                const teacherDept = teacherObjDept || matchedTeacher?.personalInfo?.department;

                                                                                return (
                                                                                    <div key={idx} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                                                                        <div className="space-y-1">
                                                                                            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                                                                                <BookOpen size={13} className="shrink-0 text-indigo-600" />
                                                                                                <span>{courseTitle}</span>
                                                                                            </div>
                                                                                            <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                                                                                <Calendar size={11} className="shrink-0" />
                                                                                                <span>AY {item.academicYear || 'Not set'}</span>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="flex items-center gap-2 border-t border-slate-200 pt-2">
                                                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700">
                                                                                                {teacherDisplayName ? teacherDisplayName.charAt(0).toUpperCase() : <User size={12} />}
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-xs font-semibold text-slate-800">
                                                                                                    {teacherDisplayName || 'Unassigned'}
                                                                                                </p>
                                                                                                {teacherDept && (
                                                                                                    <span className="text-[10px] text-slate-400">{teacherDept}</span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <p className="text-slate-400 italic">No courses or teachers assigned</p>
                                                                        )}

                                                                        <button
                                                                            onClick={() => toggleSectionCollapse(section._id)}
                                                                            className="inline-flex items-center gap-1 pt-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                                                                        >
                                                                            <span>Collapse list</span>
                                                                            <ChevronUp size={13} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex justify-end">
                                                        {isEditing ? (
                                                            <button
                                                                onClick={() => handleSaveAssignment(section._id)}
                                                                disabled={savingSectionId === section._id}
                                                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
                                                            >
                                                                {savingSectionId === section._id && <Loader2 size={12} className="animate-spin" />}
                                                                <CheckCircle2 size={13} /> Save
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => toggleEditSection(section._id)}
                                                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600 sm:w-auto"
                                                            >
                                                                <Pencil size={12} /> Edit
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* DESKTOP: table (lg and up) */}
                                    <div className="hidden overflow-x-auto w-full lg:block">
                                        <table className="w-full min-w-[900px] text-left border-collapse">
                                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-3.5">Section & Grade</th>
                                                    <th className="px-6 py-3.5">Assigned Students</th>
                                                    <th className="px-6 py-3.5">Assigned Courses & Teachers</th>
                                                    <th className="px-6 py-3.5 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs">
                                                {sections.map((section) => {
                                                    const currentEntries = sectionAssignments[section._id] || [{ course: "", academicYear: "", teacher: "" }];
                                                    const isEditing = editingSectionIds[section._id] ?? false;
                                                    const isCollapsed = collapsedSections[section._id] ?? true;
                                                    const courseCount = section.courses?.length || 0;

                                                    return (
                                                        <tr key={section._id} className="hover:bg-slate-50/50 transition">
                                                            <td className="px-6 py-4 align-top">
                                                                <p className="font-bold text-slate-900 pt-1">Grade {section.gradeLevels}</p>
                                                                <span className="text-[10px] text-slate-400">{section.sectionName}</span>
                                                            </td>
                                                            <td className="px-6 py-4 align-top">
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 text-indigo-700 font-semibold text-xs mt-0.5">
                                                                    <Users size={13} className="text-indigo-500" />
                                                                    <span>{Array.isArray(section.students) ? section.students.length : 0}</span>
                                                                    <span className="text-[10px] text-indigo-400 font-normal">students</span>
                                                                </div>
                                                            </td>

                                                            {/* COMBINED COURSES & TEACHERS ASSIGNMENT CELL */}
                                                            <td className="px-6 py-4 align-middle">
                                                                {isEditing ? (
                                                                    <div className="space-y-4 py-1">
                                                                        {currentEntries.map((entry, idx) => (
                                                                            <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                                                <div className="flex-1 w-full space-y-2">
                                                                                    <select
                                                                                        value={entry.course}
                                                                                        onChange={(e) => handleAssignmentFieldChange(section._id, idx, 'course', e.target.value)}
                                                                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                                                                                    >
                                                                                        <option value="">-- Choose Course --</option>
                                                                                        {courses.map((c) => (
                                                                                            <option key={c._id} value={c._id}>
                                                                                                {c.courseName} ({c.courseCode})
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>

                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="Academic Year (e.g. 26)"
                                                                                        value={entry.academicYear}
                                                                                        onChange={(e) => handleAssignmentFieldChange(section._id, idx, 'academicYear', e.target.value)}
                                                                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                                                                                    />

                                                                                    <select
                                                                                        value={entry.teacher}
                                                                                        onChange={(e) => handleAssignmentFieldChange(section._id, idx, 'teacher', e.target.value)}
                                                                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                                                                                    >
                                                                                        <option value="">-- Choose Teacher --</option>
                                                                                        {teachers.map((teacher) => {
                                                                                            const teacherName = teacher?.fullName || teacher?.personalInfo?.fullName || teacher._id;
                                                                                            const dept = teacher?.personalInfo?.department ? `(${teacher.personalInfo.department})` : "";
                                                                                            return (
                                                                                                <option key={teacher._id} value={teacher._id}>
                                                                                                    {teacherName} {dept}
                                                                                                </option>
                                                                                            );
                                                                                        })}
                                                                                    </select>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveCourseRow(section._id, idx)}
                                                                                    className="self-center sm:self-auto p-2 text-slate-400 hover:text-red-600 rounded-lg transition"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>
                                                                        ))}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleAddCourseRow(section._id)}
                                                                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-xs pt-1"
                                                                        >
                                                                            <Plus size={13} strokeWidth={2.5} /> Add Another Course & Teacher
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        {isCollapsed ? (
                                                                            <button
                                                                                onClick={() => toggleSectionCollapse(section._id)}
                                                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                                                                            >
                                                                                <BookOpen size={13} className="text-indigo-600" />
                                                                                <span>{courseCount} Course{courseCount === 1 ? '' : 's'} & Teacher{courseCount === 1 ? '' : 's'} assigned</span>
                                                                                <ChevronDown size={14} className="text-slate-400" />
                                                                            </button>
                                                                        ) : (
                                                                            <div className="space-y-3 py-1">
                                                                                {section.courses && section.courses.length > 0 ? (
                                                                                    section.courses.map((item, idx) => {
                                                                                        const rawCourseId = typeof item.course === 'object' && item.course !== null ? (item.course._id || item.course.id) : item.course;
                                                                                        const matchedCatalogCourse = courses.find(c => c._id === rawCourseId);
                                                                                        const courseTitle = (typeof item.course === 'object' && item.course !== null && item.course.courseName) || matchedCatalogCourse?.courseName || 'Unnamed Course';

                                                                                        const rawTeacherId = typeof item.teacher === 'object' && item.teacher !== null ? (item.teacher._id || item.teacher.id) : item.teacher;
                                                                                        const matchedTeacher = teachers.find(t => t._id === rawTeacherId);
                                                                                        const teacherObjName = (typeof item.teacher === 'object' && item.teacher !== null) ? (item.teacher.fullName || item.teacher.personalInfo?.fullName) : null;
                                                                                        const teacherObjDept = (typeof item.teacher === 'object' && item.teacher !== null) ? item.teacher.personalInfo?.department : null;
                                                                                        const teacherDisplayName = teacherObjName || matchedTeacher?.fullName || matchedTeacher?.personalInfo?.fullName;
                                                                                        const teacherDept = teacherObjDept || matchedTeacher?.personalInfo?.department;

                                                                                        return (
                                                                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                                                                                <div className="space-y-1">
                                                                                                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                                                                                        <BookOpen size={13} className="text-indigo-600 shrink-0" />
                                                                                                        <span>{courseTitle}</span>
                                                                                                    </div>
                                                                                                    <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                                                                                        <Calendar size={11} className="shrink-0" />
                                                                                                        <span>AY {item.academicYear || 'Not set'}</span>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                                                                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] shrink-0">
                                                                                                        {teacherDisplayName ? teacherDisplayName.charAt(0).toUpperCase() : <User size={12} />}
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <p className="font-semibold text-slate-800 text-xs">
                                                                                                            {teacherDisplayName || 'Unassigned'}
                                                                                                        </p>
                                                                                                        {teacherDept && (
                                                                                                            <span className="text-[10px] text-slate-400">{teacherDept}</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })
                                                                                ) : (
                                                                                    <p className="text-slate-400 italic">No courses or teachers assigned</p>
                                                                                )}

                                                                                <button
                                                                                    onClick={() => toggleSectionCollapse(section._id)}
                                                                                    className="pt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                                                                                >
                                                                                    <span>Collapse list</span>
                                                                                    <ChevronUp size={13} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* ACTION CELL */}
                                                            <td className="px-6 py-4 align-middle text-right">
                                                                {isEditing ? (
                                                                    <button
                                                                        onClick={() => handleSaveAssignment(section._id)}
                                                                        disabled={savingSectionId === section._id}
                                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                                                                    >
                                                                        {savingSectionId === section._id && <Loader2 size={12} className="animate-spin" />}
                                                                        <CheckCircle2 size={13} /> Save
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => toggleEditSection(section._id)}
                                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold text-xs rounded-xl transition border border-slate-200/80"
                                                                    >
                                                                        <Pencil size={12} /> Edit
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* REGISTER COURSE MODAL */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-45 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:p-4"
                    onClick={closeModal}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
                    >
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-base text-slate-900 font-normal">
                                    {editingCourse ? "Edit course" : "Register a course"}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {editingCourse ? "Update this course's details." : "Add a new course to the system catalog."}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitCourse} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Course name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Introduction to Biology"
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Course code
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. BIO101"
                                    value={courseId}
                                    onChange={(e) => setCourseId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Grade levels
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {GRADE_OPTIONS.map((grade) => {
                                        const active = selectedGrades.includes(grade);
                                        return (
                                            <button
                                                type="button"
                                                key={grade}
                                                onClick={() => toggleGrade(grade)}
                                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition ${
                                                    active
                                                        ? "bg-[#0c3a35] text-white"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                            >
                                                <GraduationCap size={12} />
                                                Grade {grade}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-col-reverse justify-end gap-3 pt-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-[50%] px-2 py-2.5 bg-white text-black border hover:bg-slate-200 border-slate-200 font-medium text-sm rounded-lg flex items-center justify-center gap-2 mt-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-[50%] px-2 py-2.5 bg-[#0c3a35] text-white font-medium text-sm rounded-lg hover:bg-[#0a2f2b] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-2"
                                >
                                    {submitting && <Loader2 size={13} className="animate-spin" />}
                                    {submitting
                                        ? (editingCourse ? "Saving…" : "Registering…")
                                        : (editingCourse ? "Save changes" : "Register course")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}