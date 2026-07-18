'use client';

import React, { useMemo, useState } from "react";
import { Plus, Search, Loader2, X, BookOpen, GraduationCap, Inbox } from "lucide-react";
import { UXCourseItem } from "@/types/uxAdmin";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

const AVAILABLE_GRADES = ["9", "10", "11", "12"];

interface GetSystemCoursesProps {
    courses: UXCourseItem[];
}

export default function GetSystemCourses({ courses: initialCourses }: GetSystemCoursesProps): React.JSX.Element {
    const [courses, setCourses] = useState<UXCourseItem[]>(initialCourses);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Form state
    const [courseName, setCourseName] = useState("");
    const [courseId, setCourseId] = useState("");
    const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const toggleGrade = (grade: string) => {
        setSelectedGrades(prev =>
            prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
        );
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCourseName("");
        setCourseId("");
        setSelectedGrades([]);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseName.trim() || !courseId.trim() || selectedGrades.length === 0) {
            setFormError("All fields and at least one grade level are required.");
            return;
        }

        try {
            setSubmitting(true);
            setFormError(null);
            const res = await Axios({
                ...summeryApi.addCourse,
                data: { courseName: courseName.trim(), courseCode: courseId.trim(), gradeLevels: selectedGrades }
            });
            // Optimistically reflect the new course without waiting on a parent refetch.
            if (res?.data?.data) {
                setCourses(prev => [res.data.data as UXCourseItem, ...prev]);
            }
            closeModal();
        } catch (err: any) {
            setFormError(err?.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCourses = useMemo(
        () =>
            courses.filter(
                c =>
                    c.courseName.toLowerCase().includes(search.toLowerCase()) ||
                    c.courseCode.toLowerCase().includes(search.toLowerCase())
            ),
        [courses, search]
    );

    const isFormValid = courseName.trim() && courseId.trim() && selectedGrades.length > 0;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Course Catalog</h2>
                        <p className="text-sm text-slate-500">
                            {courses.length} course{courses.length === 1 ? "" : "s"} registered system-wide
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    Register Course
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name or code..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Course grid */}
            {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((course) => (
                        <div
                            key={course._id}
                            className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200"
                        >
                            <div className="flex items-start justify-between">
                                <span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                                    {course.courseCode}
                                </span>
                            </div>
                            <h4 className="font-semibold leading-snug text-slate-800">{course.courseName}</h4>
                            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                                {course.gradeLevels?.map(grade => (
                                    <span
                                        key={grade}
                                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
                                    >
                                        <GraduationCap size={11} />
                                        Grade {grade}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Inbox size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">
                            {search ? "No courses match your search" : "No courses yet"}
                        </p>
                        <p className="text-sm text-slate-400">
                            {search ? "Try a different name or course code." : "Register your first course to get started."}
                        </p>
                    </div>
                </div>
            )}

            {/* Registration modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Register New Course</h2>
                                <p className="text-sm text-slate-400">Add a course to the system catalog.</p>
                            </div>
                            <button
                                onClick={closeModal}
                                aria-label="Close"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="courseName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Course Name
                                </label>
                                <input
                                    id="courseName"
                                    required
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                                    placeholder="e.g. Advanced Algebra"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="courseId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Course ID
                                </label>
                                <input
                                    id="courseId"
                                    required
                                    value={courseId}
                                    onChange={(e) => setCourseId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                                    placeholder="e.g. MATH301"
                                />
                            </div>

                            <div>
                                <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Target Grades
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_GRADES.map(grade => {
                                        const active = selectedGrades.includes(grade);
                                        return (
                                            <button
                                                type="button"
                                                key={grade}
                                                onClick={() => toggleGrade(grade)}
                                                aria-pressed={active}
                                                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
                                                    active
                                                        ? "border-indigo-600 bg-indigo-600 text-white"
                                                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                                                }`}
                                            >
                                                Grade {grade}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {formError && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                                    {formError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !isFormValid}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            >
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                {submitting ? "Registering..." : "Confirm Registration"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
