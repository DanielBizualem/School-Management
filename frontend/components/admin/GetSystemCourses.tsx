'use client';

import React, { useMemo, useState, useEffect } from "react";
import { Plus, Search, Loader2, BookOpen, GraduationCap, Inbox, UserCheck, AlertTriangle, Users, Pencil, CheckCircle2, Calendar, User, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
    gradeLevel: string;
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

interface GetSystemCoursesProps {
    courses: UXCourseItem[];
}

export default function GetSystemCourses({ courses: initialCourses }: GetSystemCoursesProps): React.JSX.Element {
    const [courses, setCourses] = useState<UXCourseItem[]>(initialCourses);
    const [activeTab, setActiveTab] = useState<"catalog" | "assignments">("catalog");
    
    // Course modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [courseName, setCourseName] = useState("");
    const [courseId, setCourseId] = useState("");
    const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Teacher assignment state
    const [sections, setSections] = useState<ClassSection[]>([]);
    const [teachers, setTeachers] = useState<TeacherUser[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    
    const [sectionAssignments, setSectionAssignments] = useState<{ [sectionId: string]: CourseAssignmentEntry[] }>({});
    const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
    const [editingSectionIds, setEditingSectionIds] = useState<{ [key: string]: boolean }>({});
    
    // Collapse state mapping for sections (default to true/collapsed)
    const [collapsedSections, setCollapsedSections] = useState<{ [sectionId: string]: boolean }>({});

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

    const filteredCourses = useMemo(
        () =>
            courses.filter(
                c =>
                    c.courseName.toLowerCase().includes(search.toLowerCase()) ||
                    c.courseCode.toLowerCase().includes(search.toLowerCase())
            ),
        [courses, search]
    );

    return (
        <div className="flex flex-col gap-6 p-6 w-full max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        {activeTab === "catalog" ? <BookOpen size={20} /> : <UserCheck size={20} />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            {activeTab === "catalog" ? "Course Catalog" : "Section Course & Teacher Assignments"}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {activeTab === "catalog" 
                                ? `${courses.length} course${courses.length === 1 ? "" : "s"} registered system-wide`
                                : "Assign multiple courses, academic years, and teachers to class sections"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab("catalog")}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                                activeTab === "catalog" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            Catalog
                        </button>
                        <button
                            onClick={() => setActiveTab("assignments")}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                                activeTab === "assignments" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            Assignments
                        </button>
                    </div>

                    {activeTab === "catalog" && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            Register Course
                        </button>
                    )}
                </div>
            </div>

            {activeTab === "catalog" && (
                <>
                    <div className="relative max-w-sm">
                        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

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
                                        {course.gradeLevel?.map(grade => (
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
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === "assignments" && (
                <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 flex items-start gap-4">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-amber-900">Multi-Course Section Configuration Notice</h3>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Sections can accommodate <strong>multiple courses</strong> along with their respective academic years and assigned teachers.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm">Class Sections & Course Assignments</h3>
                            <span className="text-xs text-slate-500 font-medium">
                                Total Sections: <strong className="text-slate-800">{sections.length}</strong>
                            </span>
                        </div>

                        {loadingAssignments ? (
                            <div className="p-12 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-indigo-600" /> Loading section details...
                            </div>
                        ) : sections.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                                <p>No class sections found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[900px]">
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
                                                        <p className="font-bold text-slate-900 pt-1">Grade {section.gradeLevel}</p>
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
                                                                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                                                                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                                                                                <span>AY: {item.academicYear || 'Not set'}</span>
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}