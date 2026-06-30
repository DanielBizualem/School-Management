'use client';

import React, { useState } from "react";
import { registerStudentAPI } from "@/services/adminApi";

interface RegisterStudentProps {
    onSuccess: () => void;
}

export default function RegisterStudent({ onSuccess }: RegisterStudentProps): React.JSX.Element {
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [form, setForm] = useState({
        email: "", fullName: "", gradeLevel: "9th Grade", gender: "Male" as const,
        parentName: "", parentPhone: "", parentJob: "", parentAddress: "", parentRelation: "Father" as const
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await registerStudentAPI(form);
            alert(`🎉 Success!\nGenerated ID: ${res.generatedStudentID}\nTemporary Password: ${res.temporaryPassword}`);
            onSuccess();
        } catch (err) {
            alert("Onboarding transaction rejected.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-6 max-w-3xl mx-auto">
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-4 pb-1 border-b border-indigo-50">1. Student Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Legal Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white" required />
                    <input type="email" placeholder="Personal Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white" required />
                    <select value={form.gradeLevel} onChange={e => setForm({...form, gradeLevel: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                        <option>9th Grade</option><option>10th Grade</option><option>11th Grade</option><option>12th Grade</option>
                    </select>
                    <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as any})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                        <option>Male</option><option>Female</option>
                    </select>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4 pb-1 border-b border-emerald-50">2. Family Kin Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="Parent Full Name" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white" required />
                    <input type="tel" placeholder="Contact Phone" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white" required />
                    <input type="text" placeholder="Occupation" value={form.parentJob} onChange={e => setForm({...form, parentJob: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white" required />
                    <select value={form.parentRelation} onChange={e => setForm({...form, parentRelation: e.target.value as any})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                        <option>Father</option><option>Mother</option><option>Guardian</option><option>Other</option>
                    </select>
                    <div className="sm:col-span-2">
                        <input type="text" placeholder="Complete Residential Address" value={form.parentAddress} onChange={e => setForm({...form, parentAddress: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white" required />
                    </div>
                </div>
            </div>

            <button type="submit" disabled={actionLoading} className="w-full bg-slate-950 hover:bg-black text-white font-bold py-3 text-xs rounded-xl transition disabled:bg-slate-300">
                {actionLoading ? "Writing Transaction..." : "Commit Onboarding Sequence"}
            </button>
        </form>
    );
}