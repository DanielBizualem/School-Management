'use client';

import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface AssessmentInput {
    title: string;
    score: number;
    maxScore: number;
}

export default function TeacherGradesPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    
    // Dropdown lists
    const [courses, setCourses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    // Selected filters & form state
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [activeSemester, setActiveSemester] = useState<"semester1" | "semester2">("semester1");

    // Dynamic assessment rows managed by the teacher
    const [assessments, setAssessments] = useState<AssessmentInput[]>([
        { title: "Quiz 1", score: 0, maxScore: 10 },
        { title: "Midterm Examination", score: 0, maxScore: 30 }
    ]);

    // Fetch courses taught by this teacher (adjust endpoint based on your teacher API)
   {/**
    useEffect(() => {
        const fetchTeacherCourses = async () => {
            try {
                setLoading(true);
                // Example endpoint: fetch courses assigned to the logged-in teacher
                const res = await Axios({ ...summeryApi.getTeacherCourses }); 
                const courseList = res.data?.data || [];
                setCourses(courseList);
                if (courseList.length > 0) {
                    setSelectedCourseId(courseList[0]._id);
                }
            } catch (error) {
                console.error("Failed to load teacher courses", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherCourses();
    }, []);
 */}

    // Fetch students enrolled in the selected course / grade level
    {/**
    useEffect(() => {
        if (!selectedCourseId) return;

        const fetchCourseStudents = async () => {
            try {
                // Example endpoint to fetch students taking this specific course ID
                const res = await Axios({ 
                    ...summeryApi.getStudentsByCourse, 
                    url: `${summeryApi.getStudentsByCourse.url}/${selectedCourseId}` 
                });
                const studentList = res.data?.data || [];
                setStudents(studentList);
                if (studentList.length > 0) {
                    setSelectedStudentId(studentList[0]._id);
                } else {
                    setSelectedStudentId("");
                }
            } catch (error) {
                console.error("Failed to load course students", error);
            }
        };

        fetchCourseStudents();
    }, [selectedCourseId]);
 */}

    // Add a new assessment row dynamically
    const handleAddAssessmentRow = () => {
        setAssessments([...assessments, { title: "", score: 0, maxScore: 10 }]);
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

    // Submit grades to the backend API
    const handleSubmitScores = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !selectedCourseId) {
            alert("Please select both a course and a student.");
            return;
        }

        try {
            setSubmitting(true);
            // Payload to send to your backend student score controller
            const payload = {
                studentId: selectedStudentId,
                courseId: selectedCourseId,
                semester: activeSemester,
                assessments: assessments
            };

            {/**
            await Axios({
                ...summeryApi.updateStudentGrades, // Make sure this matches your summeryApi configuration
                data: payload
            });
         */}

            alert("Student grades successfully updated!");
        } catch (error) {
            console.error("Failed to save grades", error);
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
                    <p className="text-xs text-slate-500 mt-1">Assign custom max scores and record student assessment marks</p>
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

            {/* Selection Controls Form */}
            <form onSubmit={handleSubmitSetup => handleSubmitScores(handleSubmitSetup)} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Course Selector */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Select Course</label>
                        <select 
                            value={selectedCourseId} 
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                            required
                        >
                            {courses.map((course: any) => (
                                <option key={course._id} value={course._id}>
                                    {course.courseName} ({course.courseCode})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Student Selector */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Select Student</label>
                        <select 
                            value={selectedStudentId} 
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                            required
                        >
                            {students.length === 0 ? (
                                <option value="">No students found in this course</option>
                            ) : (
                                students.map((student: any) => (
                                    <option key={student._id} value={student._id}>
                                        {student.fullName} ({student.studentID})
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                {/* Dynamic Assessment Matrix */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Assessment Components & Weights</h3>
                            <p className="text-[10px] text-slate-400">Define titles, student scores, and the teacher-assigned maximum point value.</p>
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
                            <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                <input 
                                    type="text" 
                                    placeholder="Assessment Title (e.g. Quiz 2)" 
                                    value={item.title}
                                    onChange={(e) => handleRowChange(index, 'title', e.target.value)}
                                    className="flex-grow p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none font-medium"
                                    required
                                />
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Score:</span>
                                    <input 
                                        type="number" 
                                        value={item.score}
                                        onChange={(e) => handleRowChange(index, 'score', Number(e.target.value))}
                                        className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono font-bold text-teal-600 text-center"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Max:</span>
                                    <input 
                                        type="number" 
                                        value={item.maxScore}
                                        onChange={(e) => handleRowChange(index, 'maxScore', Number(e.target.value))}
                                        className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono font-bold text-slate-700 text-center"
                                        min="1"
                                        required
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
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button 
                        type="submit" 
                        disabled={submitting || students.length === 0}
                        className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                        {submitting ? "Saving Grades..." : "Save Assessment Grades"}
                    </button>
                </div>
            </form>
        </div>
    );
}