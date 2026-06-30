'use client';

import React, { useState } from "react";
import { UXStudentRecord, UXCourseItem } from "@/types/uxAdmin";

interface EnrollCourseProps {
    student: UXStudentRecord;
    courses: UXCourseItem[];
    onClose: () => void;
    onSuccess: (studentId: string, courseId: string) => void;
}

export default function EnrollCourse({ student, courses, onClose, onSuccess }: EnrollCourseProps): React.JSX.Element {
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseId) return;
        setActionLoading(true);
        try {
            onSuccess(student._id, selectedCourseId);
            onClose();
        } catch (err) {
            alert("Allocation aborted.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 border border-slate-100">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Course Allocation</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Assigning course to: <span className="font-semibold text-slate-800">{student.fullName}</span></p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select 
                        value={selectedCourseId} 
                        onChange={e => setSelectedCourseId(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                        required
                    >
                        <option value="">Select target catalog track...</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.courseName} ({c.courseCode})</option>)}
                    </select>
                    <div className="flex justify-end gap-2 text-xs font-bold">
                        <button type="button" onClick={onClose} className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg transition">Cancel</button>
                        <button type="submit" disabled={actionLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg transition hover:bg-indigo-700">
                            {actionLoading ? "Processing..." : "Confirm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}