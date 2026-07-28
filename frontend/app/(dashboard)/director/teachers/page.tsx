'use client';

import React, { useState, useEffect } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface TeacherMember {
    _id: string; // StaffProfile ID
    employeeID: string;
    personalInfo: {
        fullName: string;
    };
}

interface ClassSection {
    _id: string;
    sectionName: string;
    gradeLevel: string;
    homeroomTeacher?: {
        _id: string;
        employeeID?: string;
        personalInfo?: {
            fullName: string;
        };
    } | null;
}

export default function AssignHomeroomPage() {
    const [teachers, setTeachers] = useState<TeacherMember[]>([]);
    const [sections, setSections] = useState<ClassSection[]>([]);
    
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch teachers and sections
    const fetchData = async () => {
        try {
            setLoadingData(true);
            const [teachersRes, sectionsRes] = await Promise.all([
                Axios({ ...summeryApi.getAllTeachers }),
                Axios({ ...summeryApi.getAllClassSection }) // Adjust if you have a summeryApi entry for sections
            ]);

            setTeachers(teachersRes.data?.data || teachersRes.data || []);
            setSections(sectionsRes.data?.data || sectionsRes.data || []);
        } catch (error) {
            console.error("Failed to load initial data", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle assignment submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSectionId || !selectedTeacherId) {
            alert("Please select both a section and a teacher.");
            return;
        }

        try {
            setSaving(true);
            await Axios({
                url: `${summeryApi.assignHomeroomTeacher.url}/${selectedSectionId}/homeroom-teacher`,
                method: summeryApi.assignHomeroomTeacher.method,
                data: { teacherId: selectedTeacherId }
            });

            alert("Homeroom teacher assigned successfully!");
            setSelectedSectionId("");
            setSelectedTeacherId("");
            fetchData(); // Refresh data to update the assigned list below
        } catch (error) {
            console.error("Failed to assign homeroom teacher", error);
            alert("Error assigning homeroom teacher.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Homeroom Management</h1>
                <p className="text-sm text-slate-500 mt-0.5">Assign primary homeroom leads to class sections.</p>
            </div>

            {/* Assignment Form Card */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-base font-semibold text-slate-900">Assign Teacher to Section</h3>

                {/* Side-by-side Selections */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Section Selection */}
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                            Class Section
                        </label>
                        <select
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                            disabled={loadingData}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition disabled:opacity-50"
                        >
                            <option value="">
                                {loadingData ? "Loading sections..." : "Select a section..."}
                            </option>
                            {sections.map((sec) => (
                                <option key={sec._id} value={sec._id}>
                                    Grade {sec.gradeLevel} - {sec.sectionName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Teacher Selection */}
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                            Staff Member (Teacher)
                        </label>
                        <select
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                            disabled={loadingData}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition disabled:opacity-50"
                        >
                            <option value="">
                                {loadingData ? "Loading teachers..." : "Select a teacher..."}
                            </option>
                            {teachers.map((teacher) => (
                                <option key={teacher._id} value={teacher._id}>
                                    {teacher.personalInfo?.fullName || "Unnamed Teacher"} ({teacher.employeeID})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving || !selectedSectionId || !selectedTeacherId}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
                >
                    {saving ? "Saving assignment..." : "Save Assignment"}
                </button>
            </form>

            {/* Assigned Sections List at the Bottom */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-semibold text-slate-900">Current Homeroom Assignments</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Overview of all sections and their active homeroom teachers.</p>
                </div>

                {loadingData ? (
                    <div className="p-8 text-center text-sm text-slate-400">Loading assignments...</div>
                ) : sections.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">No sections found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-800">
                            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-400 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Grade & Section</th>
                                    <th className="px-6 py-3">Homeroom Teacher</th>
                                    <th className="px-6 py-3">Staff ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sections.map((sec) => (
                                    <tr key={sec._id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            Grade {sec.gradeLevel} · {sec.sectionName}
                                        </td>
                                        <td className="px-6 py-4">
                                            {sec.homeroomTeacher?.personalInfo?.fullName ? (
                                                <span className="font-medium text-slate-900">
                                                    {sec.homeroomTeacher.personalInfo.fullName}
                                                </span>
                                            ) : (
                                                <span className="text-amber-600 font-medium text-xs bg-amber-50 px-2 py-1 rounded-md">
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                                            {sec.homeroomTeacher?.employeeID || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}