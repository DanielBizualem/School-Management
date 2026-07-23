'use client';

import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface AssessmentInput {
    title: string;
    maxScore: number;
    score: number;
}

export default function TeacherGradesPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [savingMaxScores, setSavingMaxScores] = useState<boolean>(false);
    
    // Dropdown lists
    const [courses, setCourses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    // Selected filters & form state
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [activeSemester, setActiveSemester] = useState<"semester1" | "semester2">("semester1");

    // Dynamic assessment rows (defaults to empty until fetched or added)
    const [assessments, setAssessments] = useState<AssessmentInput[]>([]);

    // 1. Fetch teacher's assigned courses and assigned sections using getTeacherAssigned API
    useEffect(() => {
        const fetchTeacherAssignments = async () => {
            try {
                setLoading(true);
                
                const profileRes = await Axios({ ...summeryApi.getTeacherAssigned });
                const teacherProfile = profileRes.data?.data || profileRes.data;

                const courseList = teacherProfile?.assignedCourses || [];
                const sectionList = teacherProfile?.assignedSections || [];

                setCourses(courseList);
                setSections(sectionList);

                if (courseList.length > 0) {
                    const firstCourse = courseList[0];
                    const firstCourseId = typeof firstCourse === 'object' && firstCourse !== null 
                        ? (firstCourse._id || firstCourse.id || firstCourse.course?._id) 
                        : firstCourse;
                    setSelectedCourseId(firstCourseId ? String(firstCourseId) : "");
                }

                if (sectionList.length > 0) {
                    const firstSection = sectionList[0];
                    const firstSectionId = typeof firstSection === 'object' && firstSection !== null 
                        ? (firstSection._id || firstSection.id || firstSection.section?._id) 
                        : firstSection;
                    setSelectedSectionId(firstSectionId ? String(firstSectionId) : "");
                }

            } catch (error) {
                console.error("Failed to load teacher assignments", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherAssignments();
    }, []);

    // 2. Fetch existing max scores/assessments configuration for the selected Course, Section, and Semester
    useEffect(() => {
        const fetchExistingMaxScores = async () => {
            if (!selectedCourseId || !selectedSectionId) {
                setAssessments([]);
                return;
            }

            try {
                const api = summeryApi as any;
                const apiConfig = api.getMaxScore;

                const baseUrl = typeof apiConfig === 'function' 
                    ? apiConfig(selectedCourseId, selectedSectionId, activeSemester).url 
                    : (apiConfig?.url || apiConfig);

                const res = await Axios({
                    ...(typeof apiConfig === 'object' ? apiConfig : { method: 'GET' }),
                    url: `${baseUrl}/${selectedCourseId}/${selectedSectionId}/${activeSemester}`
                });

                const fetchedData = res.data?.data?.assessments || res.data?.assessments || res.data;

                if (Array.isArray(fetchedData) && fetchedData.length > 0) {
                    setAssessments(fetchedData.map((item: any) => ({
                        title: item.title || "",
                        maxScore: Number(item.maxScore) || 0,
                        score: 0
                    })));
                } else {
                    setAssessments([
                        { title: "Quiz 1", maxScore: 10, score: 0 }
                    ]);
                }
            } catch (error) {
                console.error("No pre-configured max scores found or failed to fetch", error);
                setAssessments([
                    { title: "Quiz 1", maxScore: 10, score: 0 }
                ]);
            }
        };

        fetchExistingMaxScores();
    }, [selectedCourseId, selectedSectionId, activeSemester]);

    // 3. Fetch students enrolled in the selected section & course context
    useEffect(() => {
        if (!selectedSectionId) {
            setStudents([]);
            setSelectedStudentId("");
            return;
        }

        const currentSection = sections.find((sec: any) => {
            const sId = typeof sec === 'object' && sec !== null ? (sec._id || sec.id || sec.section?._id) : sec;
            return String(sId) === String(selectedSectionId);
        });

        if (currentSection && currentSection.students && currentSection.students.length > 0) {
            setStudents(currentSection.students);
            setSelectedStudentId("");
            return;
        }

        const fetchSectionStudents = async () => {
            try {
                const studentApi = summeryApi.getStudentsByCourse;
                const baseStudentUrl = typeof studentApi === 'object' ? studentApi.url : studentApi;

                const res = await Axios({ 
                    ...(typeof studentApi === 'object' ? studentApi : { method: 'GET' }),
                    url: `${baseStudentUrl}/${selectedSectionId}` 
                });
                const studentList = res.data?.data || res.data?.students || res.data || [];
                setStudents(studentList);
                setSelectedStudentId(""); 
            } catch (error) {
                console.error("Failed to load section students", error);
                setStudents([]);
            }
        };

        fetchSectionStudents();
    }, [selectedSectionId, sections]);

    // 4. Fetch existing scores when a specific student is selected
    useEffect(() => {
        if (!selectedStudentId || !selectedCourseId || !selectedSectionId) return;

        const fetchStudentExistingScores = async () => {
            try {
                const api = summeryApi as any;
                const getScoreApi = api.getStudentScoresForTeacher || api.viewScore;
                const baseUrl = typeof getScoreApi === 'function' 
                    ? getScoreApi(selectedCourseId, selectedSectionId, selectedStudentId).url 
                    : (getScoreApi?.url || getScoreApi || '/api/teacher/viewScore');

                const res = await Axios({
                    ...(typeof getScoreApi === 'object' ? getScoreApi : { method: 'GET' }),
                    url: `${baseUrl}/${selectedCourseId}/${selectedSectionId}/${selectedStudentId}`,
                    params: { semester: activeSemester }
                });

                const responseData = res.data?.data || res.data;
                const savedAssessments = responseData?.assessments || [];

                if (savedAssessments.length > 0) {
                    // Update assessments with the exact maxScore and score from the backend configuration
                    setAssessments(savedAssessments.map((item: any) => ({
                        title: item.title || "",
                        maxScore: Number(item.maxScore) || 10, // Pulls the true maxScore (e.g. 50 for Final Exam)
                        score: item.score !== undefined ? Number(item.score) : 0
                    })));
                } else {
                    setAssessments(prev => prev.map(item => ({ ...item, score: 0 })));
                }
            } catch (error) {
                console.log("No prior scores found for this student yet, defaulting to 0.");
                setAssessments(prev => prev.map(item => ({ ...item, score: 0 })));
            }
        };

        fetchStudentExistingScores();
    }, [selectedStudentId, selectedCourseId, selectedSectionId, activeSemester]);
    // Add a new assessment row dynamically
    const handleAddAssessmentRow = () => {
        setAssessments([...assessments, { title: "", maxScore: 10, score: 0 }]);
    };

    // Remove an assessment row
    const handleRemoveRow = (index: number) => {
        const updated = assessments.filter((_, i) => i !== index);
        setAssessments(updated);
    };

    // Handle field updates for a specific row
    const handleRowChange = (index: number, field: keyof AssessmentInput, value: any) => {
        const updated = [...assessments];
        updated[index] = { ...updated[index], [field]: value };
        setAssessments(updated);
    };

    // Save Max Scores for the Selected Grade & Section Context
    const handleSaveMaxScores = async () => {
        if (!selectedSectionId || !selectedCourseId) {
            alert("Please select both an assigned course and section first.");
            return;
        }

        try {
            setSavingMaxScores(true);
            const payload = {
                courseId: selectedCourseId,
                sectionId: selectedSectionId,
                semester: activeSemester,
                assessments: assessments.map(a => ({ title: a.title, maxScore: a.maxScore }))
            };

            await Axios({
                ...summeryApi.saveMaxScore,
                data: payload
            });

            alert("Assessment maximum scores successfully configured for this grade and section!");
        } catch (error) {
            console.error("Failed to save max scores", error);
            alert("Error saving max scores. Please try again.");
        } finally {
            setSavingMaxScores(false);
        }
    };

    // Submit Student Scores
    const handleSubmitStudentScores = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !selectedSectionId || !selectedCourseId) {
            alert("Please ensure a section and student are selected.");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                studentId: selectedStudentId,
                courseId: selectedCourseId,
                sectionId: selectedSectionId,
                semester: activeSemester,
                assessments: assessments.map(item => ({
                    title: item.title,
                    score: Number(item.score) || 0
                }))
            };

            const apiConfig = (summeryApi as any).updateStudentGrade;

            await Axios({
                ...apiConfig,
                data: payload
            });

            alert("Student grades successfully updated!");
        } catch (error) {
            console.error("Failed to save student grades", error);
            alert("Error saving grades. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading grading dashboard...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900">Teacher Grade Management</h1>
                    <p className="text-xs text-slate-500 mt-1">Configure section assessments and manage individual student marks</p>
                </div>

                {/* Semester Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button 
                        type="button"
                        onClick={() => setActiveSemester("semester1")}
                        className={`px-3 py-1.5 rounded-lg transition ${activeSemester === 'semester1' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Semester 1
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveSemester("semester2")}
                        className={`px-3 py-1.5 rounded-lg transition ${activeSemester === 'semester2' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Semester 2
                    </button>
                </div>
            </div>

            {/* Selection Controls Form container */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                
                {/* 1. Assigned Course Selector Dropdown */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Assigned Course</label>
                    <select 
                        value={selectedCourseId} 
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                    >
                        <option value="">Select Assigned Course</option>
                        {courses.map((course: any, index: number) => {
                            const cId = typeof course === 'object' && course !== null 
                                ? (course._id || course.id || course.course?._id) 
                                : course;
                            
                            const uniqueKey = cId ? String(cId) : `course-${index}`;
                            const cName = typeof course === 'object' && course !== null 
                                ? (course.courseName || course.name || course.title || course.course?.courseName || course.course?.name || `Course ${String(cId || index).slice(-4)}`) 
                                : `Course ${String(course)}`;

                            return (
                                <option key={uniqueKey} value={cId ? String(cId) : ''}>
                                    {cName}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* 2. Side-by-side Assigned Sections & Students Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Section Selector */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Assigned Section & Grade</label>
                        <select 
                            value={selectedSectionId} 
                            onChange={(e) => {
                                setSelectedSectionId(e.target.value);
                                setSelectedStudentId(""); 
                            }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                        >
                            <option value="">Select Assigned Section</option>
                            {sections.map((section: any, index: number) => {
                                const sId = typeof section === 'object' && section !== null 
                                    ? (section._id || section.id || section.section?._id) 
                                    : section;
                                    
                                const uniqueKey = sId ? String(sId) : `section-${index}`;
                                const gradeVal = typeof section === 'object' && section !== null 
                                    ? (section.gradeLevel || section.section?.gradeLevel) 
                                    : "";
                                const gradeLabel = gradeVal ? `Grade ${gradeVal} - ` : "";
                                const sectionName = typeof section === 'object' && section !== null 
                                    ? (section.sectionName || section.name || section.section?.sectionName || section.section?.name || `Section ${String(sId || index).slice(-4)}`)
                                    : `Section ${String(section)}`;

                                return (
                                    <option key={uniqueKey} value={sId ? String(sId) : ''}>
                                        {gradeLabel}{sectionName}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Student Selector */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Select Student</label>
                        <select 
                            value={selectedStudentId ? String(selectedStudentId) : ""} 
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            disabled={!selectedSectionId}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">{selectedSectionId ? "Select Specific Student" : "Select a section first"}</option>
                            {students.map((student: any, index: number) => {
                                const isObject = typeof student === 'object' && student !== null;
                                const studentObj = isObject ? (student.user || student) : {};
                                
                                const rawId = isObject ? (studentObj._id || studentObj.id || student._id) : student;
                                const studentIdVal = rawId ? String(rawId) : "";
                                
                                const uniqueKey = studentIdVal ? studentIdVal : `student-${index}`;
                                
                                const studentName = 
                                    studentObj.personalInfo?.fullName || 
                                    studentObj.fullName || 
                                    student.fullName || 
                                    studentObj.name || 
                                    student.name || 
                                    `Student ${index + 1}`;

                                const studentNo = 
                                    studentObj.studentID || 
                                    student.studentID || 
                                    studentObj.employeeID || 
                                    student.employeeID || 
                                    (studentIdVal ? studentIdVal.slice(-4) : "ID N/A");
                                
                                return (
                                    <option key={uniqueKey} value={studentIdVal}>
                                        {studentName} ({studentNo})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                {/* Condition A: Section/Grade is selected, but NO student is selected -> Show Max Scores Config */}
                {selectedSectionId && !selectedStudentId && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Assessment Components & Weights</h3>
                                <p className="text-[10px] text-slate-400">Define maximum point limitations specifically for this selected grade and section.</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={handleAddAssessmentRow}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
                            >
                                + Add Assessment
                            </button>
                        </div>

                        <div className="space-y-3">
                            {assessments.map((item, index) => (
                                <div key={`assessment-row-${index}`} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                    <input 
                                        type="text" 
                                        placeholder="Assessment Title (e.g. Quiz 2)" 
                                        value={item.title}
                                        onChange={(e) => handleRowChange(index, 'title', e.target.value)}
                                        className="flex-grow p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none font-medium"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Max Score:</span>
                                        <input 
                                            type="number" 
                                            value={item.maxScore}
                                            onChange={(e) => handleRowChange(index, 'maxScore', Number(e.target.value))}
                                            className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono font-bold text-slate-700 text-center"
                                            min="1"
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveRow(index)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition font-bold text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Save Max Scores Button */}
                        <div className="flex justify-end pt-2">
                            <button 
                                type="button"
                                onClick={handleSaveMaxScores}
                                disabled={savingMaxScores}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                            >
                                {savingMaxScores ? "Saving Max Scores..." : "Save Section Max Scores"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Condition B: Student is selected -> Input Individual Marks */}
                {selectedStudentId && (
                    <form onSubmit={handleSubmitStudentScores} className="space-y-4 pt-4 border-t border-slate-100">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Enter Marks for Selected Student</h3>
                            <p className="text-[10px] text-slate-400">Provide individual scores for the chosen student against the established max limits.</p>
                        </div>

                        <div className="space-y-3">
                            {assessments.map((item, index) => (
                                <div key={`score-row-${index}`} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                    <span className="text-xs font-bold text-slate-700">{item.title || `Assessment ${index + 1}`} (Max: {item.maxScore})</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Score:</span>
                                        <input 
                                            type="number" 
                                            value={item.score}
                                            onChange={(e) => handleRowChange(index, 'score', Number(e.target.value))}
                                            className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono font-bold text-teal-600 text-center"
                                            min="0"
                                            max={item.maxScore}
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Submit Student Marks Button */}
                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                            >
                                {submitting ? "Saving Student Grades..." : "Save Student Grades"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}