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

    // Dynamic assessment rows
    const [assessments, setAssessments] = useState<AssessmentInput[]>([
        { title: "Quiz 1", maxScore: 10, score: 0 },
        { title: "Midterm Examination", maxScore: 30, score: 0 }
    ]);

    // 1. Fetch courses and sections automatically from profile
    useEffect(() => {
        const fetchTeacherProfileAndData = async () => {
            try {
                setLoading(true);
                const res = await Axios({ ...summeryApi.getTeacherCourses }); 
                const courseList = res.data?.data || res.data || [];
                setCourses(courseList);

                if (courseList.length > 0) {
                    const firstCourseId = courseList[0]._id || courseList[0];
                    setSelectedCourseId(typeof firstCourseId === 'string' ? firstCourseId : firstCourseId._id);
                }

                const sectionsRes = await Axios({ ...summeryApi.getAllClassSection });
                const sectionList = sectionsRes.data?.data || sectionsRes.data || [];
                setSections(sectionList);
            } catch (error) {
                console.error("Failed to load teacher profile data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherProfileAndData();
    }, []);

    // 2. Fetch students enrolled in the selected section
    useEffect(() => {
        if (!selectedSectionId) {
            setStudents([]);
            setSelectedStudentId("");
            return;
        }

        const fetchSectionStudents = async () => {
            try {
                const res = await Axios({ 
                    ...summeryApi.getStudentsByCourse, 
                    url: `${summeryApi.getStudentsByCourse.url}/${selectedSectionId}` 
                });
                const studentList = res.data?.data || res.data || [];
                setStudents(studentList);
                setSelectedStudentId(""); // Reset student selection when section changes
            } catch (error) {
                console.error("Failed to load section students", error);
            }
        };

        fetchSectionStudents();
    }, [selectedSectionId]);

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

    // Step 2: Save Max Scores for the Section
    const handleSaveMaxScores = async () => {
        if (!selectedSectionId || !selectedCourseId) {
            alert("Please select a section first.");
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

            // Use your appropriate endpoint to save section max scores if separate, or pass along
            await Axios({
                ...summeryApi.updateStudentGrades, // Adjust endpoint if you have a specific route for max scores configuration
                data: payload
            });

            alert("Assessment maximum scores saved successfully for this section!");
        } catch (error) {
            console.error("Failed to save max scores", error);
            alert("Error saving max scores. Please try again.");
        } finally {
            setSavingMaxScores(false);
        }
    };

    // Step 3: Submit Student Scores
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
                assessments: assessments
            };

            await Axios({
                ...summeryApi.updateStudentGrades,
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
                {/* 1. Side-by-side Select Section and Select Student Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Section Selector */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Select Section</label>
                        <select 
                            value={selectedSectionId} 
                            onChange={(e) => {
                                setSelectedSectionId(e.target.value);
                                setSelectedStudentId(""); // Reset student on section change
                            }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                        >
                            <option value="">-- Select Section --</option>
                            {sections.map((section: any) => (
                                <option key={section._id} value={section._id}>
                                    {section.sectionName || section.name || `Section ${section._id.slice(-4)}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Student Selector (Only available after section is selected) */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Select Student</label>
                        <select 
                            value={selectedStudentId} 
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            disabled={!selectedSectionId}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">{selectedSectionId ? "-- Select Specific Student --" : "Select a section first"}</option>
                            {students.map((student: any) => (
                                <option key={student._id} value={student._id}>
                                    {student.personalInfo?.fullName || student.fullName} ({student.studentID || student.employeeID || "ID N/A"})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 4. Mutually Exclusive Replacement Blocks (Never stacked together) */}
                
                {/* Condition A: Section is selected, but NO student is selected -> Show Assessment Components & Weights */}
                {selectedSectionId && !selectedStudentId && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Assessment Components & Weights</h3>
                                <p className="text-[10px] text-slate-400">Define titles and maximum point values for this section's course.</p>
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

                {/* Condition B: Student is selected from drop-down -> Replace with Enter Marks for Selected Student */}
                {selectedStudentId && (
                    <form onSubmit={handleSubmitStudentScores} className="space-y-4 pt-4 border-t border-slate-100 animate-fadeIn">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Enter Marks for Selected Student</h3>
                            <p className="text-[10px] text-slate-400">Provide individual scores for the chosen student against the established max limits.</p>
                        </div>

                        <div className="space-y-3">
                            {assessments.map((item, index) => (
                                <div key={`score-${index}`} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
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