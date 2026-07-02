'use client';

import React, { useState } from "react";
import { registerStudentAPI } from "@/services/adminApi";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface RegisterStudentProps {
    onSuccess: () => void;
}

export default function RegisterStudent({ onSuccess }: RegisterStudentProps): React.JSX.Element {
    const [step, setStep] = useState(1);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [form, setForm] = useState({
        email: "", fullName: "", gradeLevel: "9th Grade", gender: "Male" as const,
        studentPhoto: "", studentDob: "",
        parentName: "", parentPhone: "", parentJob: "", parentAddress: "", parentRelation: "Father" as const,
        familyPhoto: "", familyPersonDob: ""
    });
    const [files, setFiles] = useState<{ studentPhoto: File | null; familyPhoto: File | null }>({
        studentPhoto: null,
        familyPhoto: null
    });

    const [previews, setPreviews] = useState<{ studentPhoto: string | null; familyPhoto: string | null }>({
        studentPhoto: null, familyPhoto: null
    });

    const downloadRegistrationPDF = (data: any, studentID: string) => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Registration Confirmation", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated ID: ${studentID}`, 14, 30);
        
        (doc as any).autoTable({
            startY: 40,
            head: [['Field', 'Details']],
            body: [
                ['Student Name', data.fullName], ['Email', data.email],
                ['Date of Birth', data.studentDob], ['Grade', data.gradeLevel],
                ['Parent Name', data.parentName], ['Parent Phone', data.parentPhone],
                ['Relation', data.parentRelation]
            ],
        });
        doc.save(`Student_${data.fullName.replace(/\s+/g, '_')}.pdf`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
    
        const formData = new FormData();
        
        // Append all text fields
        Object.entries(form).forEach(([key, value]) => {
            formData.append(key, value as string);
        });
    
        // Append the actual files
        if (files.studentPhoto) formData.append("studentPhoto", files.studentPhoto);
        if (files.familyPhoto) formData.append("familyPhoto", files.familyPhoto);
    
        try {
            // Now you send the whole bundle to your register-student endpoint
            
            const res = await registerStudentAPI(formData);
    
            downloadRegistrationPDF(form, res.data.data.customStudentID);
            alert("Registration Successful!");
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Registration failed. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "studentPhoto" | "familyPhoto") => {
        const file = e.target.files?.[0];
        if (file) {
            // Save file for submission later
            setFiles(prev => ({ ...prev, [field]: file }));
            
            // Save preview for UI
            const reader = new FileReader();
            reader.onloadend = () => setPreviews(prev => ({ ...prev, [field]: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <h1 className="text-2xl font-black text-slate-900 mb-8">Student Registration</h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm w-full max-w-3xl">
                {/* --- UPPER NAVIGATOR --- */}
                <div className="flex justify-center items-center gap-8 mb-10">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full border-2 font-bold text-[10px] flex items-center justify-center ${step === 1 ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 text-slate-300'}`}>1</div>
                        <span className={`text-[10px] font-bold uppercase ${step === 1 ? 'text-slate-950' : 'text-slate-400'}`}>Student Detail</span>
                    </div>
                    <div className="w-8 h-px bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full border-2 font-bold text-[10px] flex items-center justify-center ${step === 2 ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 text-slate-300'}`}>2</div>
                        <span className={`text-[10px] font-bold uppercase ${step === 2 ? 'text-slate-950' : 'text-slate-400'}`}>Parent Detail</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="flex gap-4">
                        <label className="flex-shrink-0 w-[100px] h-[133px] border border-slate-200 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden bg-slate-50 hover:bg-slate-100 transition">
                            {previews.studentPhoto ? <img src={previews.studentPhoto} className="w-full h-full object-cover" /> : <span className="text-[9px] text-slate-400 font-bold uppercase text-center">3x4<br/>Photo</span>}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'studentPhoto')} />
                        </label>
                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" placeholder="Full Legal Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" required />
                            <input type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" required />
                            <input type="date" value={form.studentDob} onChange={e => setForm({...form, studentDob: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" required />
                            <select value={form.gradeLevel} onChange={e => setForm({...form, gradeLevel: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                                <option>9th Grade</option><option>10th Grade</option><option>11th Grade</option><option>12th Grade</option>
                            </select>
                            <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as any})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                                <option>Male</option><option>Female</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex gap-4">
                        <label className="flex-shrink-0 w-[100px] h-[133px] border border-slate-200 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden bg-slate-50 hover:bg-slate-100 transition">
                            {previews.familyPhoto ? <img src={previews.familyPhoto} className="w-full h-full object-cover" /> : <span className="text-[9px] text-slate-400 font-bold uppercase text-center">3x4<br/>Photo</span>}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'familyPhoto')} />
                        </label>
                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" placeholder="Parent Full Name" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" required />
                            <input type="tel" placeholder="Contact Phone" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" required />
                            <input type="text" placeholder="Occupation" value={form.parentJob} onChange={e => setForm({...form, parentJob: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" required />
                            <select value={form.parentRelation} onChange={e => setForm({...form, parentRelation: e.target.value as any})} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                                <option>Father</option><option>Mother</option><option>Guardian</option><option>Other</option>
                            </select>
                            <input type="text" placeholder="Residential Address" value={form.parentAddress} onChange={e => setForm({...form, parentAddress: e.target.value})} className="sm:col-span-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" required />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-10">
                    {step > 1 && <button type="button" onClick={() => setStep(1)} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold text-[11px] rounded-lg">Back</button>}
                    {step < 2 ? (
                        <button type="button" onClick={() => setStep(2)} className="px-8 py-2 bg-slate-950 text-white font-bold text-[11px] rounded-lg">Next</button>
                    ) : (
                        <button type="submit" disabled={actionLoading} className="px-8 py-2 bg-slate-950 text-white font-bold text-[11px] rounded-lg">
                            {actionLoading ? "Processing..." : "Submit"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}