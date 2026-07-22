'use client';

import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";
import { UXStudentRecord } from "@/types/uxAdmin";

export default function SectionManagementPage() {
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchingStudents, setFetchingStudents] = useState<boolean>(false);
    
    // Form state
    const [gradeLevel, setGradeLevel] = useState<string>("");
    const [sectionName, setSectionName] = useState<string>("");
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    // Students pool
    const [availableStudents, setAvailableStudents] = useState<UXStudentRecord[]>([]);

    // Function to fetch all class sections so we can check which student IDs are already assigned
    const fetchUnassignedStudentsByGrade = async () => {
        if (!gradeLevel) {
            setAvailableStudents([]);
            setSelectedStudents([]);
            return;
        }

        try {
            setFetchingStudents(true);
            
            // Fetch students and existing sections concurrently to map assigned state accurately
            const [studentsRes, sectionsRes] = await Promise.all([
                Axios({ ...summeryApi.getAllStudents }),
                Axios({ ...summeryApi.getAllClassSection })
            ]);

            const allStudentsList = studentsRes.data?.data || studentsRes.data || [];
            const allSectionsList = sectionsRes.data?.data || sectionsRes.data || [];

            // Collect all student IDs that have already been assigned to *any* section across the system
            const assignedStudentIds = new Set<string>();
            allSectionsList.forEach((sec: any) => {
                if (Array.isArray(sec.students)) {
                    sec.students.forEach((s: any) => {
                        const sId = typeof s === 'object' && s !== null ? String(s._id || s.id || "") : String(s);
                        if (sId) assignedStudentIds.add(sId);
                    });
                }
            });
            
            // Extract digits or normalize the selected grade (e.g., "Grade 12" -> "12")
            const targetGradeClean = gradeLevel.replace(/\D/g, "").trim(); 
            const targetGradeStr = gradeLevel.trim().toLowerCase();

            const filteredList = allStudentsList.filter((student: any) => {
                // Check nested academicInfo first, then fall back to other root properties
                const rawGrade = student.academicInfo?.gradeLevel ?? student.gradeLevel ?? student.grade ?? student.classLevel ?? "";
                const studentGradeStr = String(rawGrade).trim().toLowerCase();
                const studentGradeClean = String(rawGrade).replace(/\D/g, "").trim();

                // Match either by full string or exact number extraction (e.g., "12" matches "Grade 12")
                const matchesGrade = 
                    studentGradeStr === targetGradeStr || 
                    studentGradeStr.includes(targetGradeStr) ||
                    targetGradeStr.includes(studentGradeStr) ||
                    (targetGradeClean !== "" && studentGradeClean === targetGradeClean);

                // Check standard database property fields for section assignment as a secondary safety check
                const sectionField = student.section || student.sectionName || student.classSection || student.sectionId;
                const hasDirectSection = Boolean(sectionField && (!Array.isArray(sectionField) || sectionField.length > 0));

                // A student is truly unassigned if they are not in the global assignedStudentIds set AND have no direct section reference
                const studentIdStr = String(student._id || "");
                const isAssignedGlobally = assignedStudentIds.has(studentIdStr) || hasDirectSection;

                return matchesGrade && !isAssignedGlobally;
            });
            
            setAvailableStudents(filteredList);
            setSelectedStudents([]); 
        } catch (error) {
            console.error("Failed to load students list", error);
            setAvailableStudents([]);
            setSelectedStudents([]);
        } finally {
            setFetchingStudents(false);
        }
    };

    // Robust client-side filtering matching variations like "12", "Grade 12", etc.
    useEffect(() => {
        fetchUnassignedStudentsByGrade();
    }, [gradeLevel]);

    const toggleStudentSelection = (studentId: string) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gradeLevel || !sectionName) {
            alert("Please select a grade level and enter a section name.");
            return;
        }

        if (selectedStudents.length === 0) {
            alert("Please select at least one student for this section.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                gradeLevel: gradeLevel.replace(/\D/g, "").trim(),
                sectionName,
                students: selectedStudents
            };

            await Axios({
                ...summeryApi.createClassSection, 
                data: payload
            });

            alert("Section created and students assigned successfully!");
            setSectionName("");
            
            // Re-fetch or clear to update the unassigned student pool dynamically
            await fetchUnassignedStudentsByGrade();
        } catch (error) {
            console.error("Failed to create section", error);
            alert("Error creating section. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <h1 className="text-xl font-black text-slate-900">Create Section & Assign Students</h1>
                <p className="text-xs text-slate-500 mt-1">Choose a grade level to view unassigned students, select members, and save to the section.</p>
            </div>

            <form onSubmit={handleCreateSection} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Select Grade Level</label>
                        <select 
                            value={gradeLevel} 
                            onChange={(e) => setGradeLevel(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                            required
                        >
                            <option value="">Choose Grade Level</option>
                            <option value="Grade 9">Grade 9</option>
                            <option value="Grade 10">Grade 10</option>
                            <option value="Grade 11">Grade 11</option>
                            <option value="Grade 12">Grade 12</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Section Name</label>
                        <input 
                            type="text"
                            placeholder="e.g. Section A, Blue, etc."
                            value={sectionName}
                            onChange={(e) => setSectionName(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 transition"
                            required
                        />
                    </div>
                </div>

                {gradeLevel && (
                    <div className="space-y-3 pt-4 border-t border-slate-100 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                                Unassigned Students for {gradeLevel} ({(selectedStudents || []).length} selected)
                            </label>
                            <span className="text-[10px] text-slate-400">Unselected students will wait for later assignment</span>
                        </div>

                        <div className="max-h-72 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                            {fetchingStudents ? (
                                <div className="text-center py-8 text-xs text-slate-400 font-medium animate-pulse">
                                    Loading unassigned students for {gradeLevel}...
                                </div>
                            ) : availableStudents.length === 0 ? (
                                <div className="text-center py-8 text-xs text-slate-500 font-medium space-y-1">
                                    <p>No unassigned students found for {gradeLevel}.</p>
                                    <p className="text-[10px] text-slate-400">Note: All students in this grade level have already been assigned to a section.</p>
                                </div>
                            ) : (
                                availableStudents.map((student: any) => {
                                    const isSelected = selectedStudents.includes(student._id);
                                    return (
                                        <div 
                                            key={student._id}
                                            onClick={() => toggleStudentSelection(student._id)}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                                isSelected 
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                                                    : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold">
                                                    {student.personalInfo?.fullName || student.fullName || student.name || "Unnamed Student"}
                                                </span>
                                                <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    ID: {student.studentID || student._id} | Grade: {student.academicInfo?.gradeLevel || student.gradeLevel || student.grade}
                                                </span>
                                            </div>

                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg transition ${
                                                isSelected 
                                                    ? 'bg-white text-slate-900' 
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}>
                                                {isSelected ? "selected" : "select"}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button 
                        type="submit" 
                        disabled={loading || !gradeLevel || !sectionName || selectedStudents.length === 0}
                        className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Saving Section..." : "Save Section & Students"}
                    </button>
                </div>
            </form>
        </div>
    );
}