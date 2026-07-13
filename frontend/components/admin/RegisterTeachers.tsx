'use client';

import React, { useState } from "react";
import { UserPlus, User, MapPin, AlertCircle, Loader2, BookOpen, CheckCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

export default function TeacherRegistrationForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [teacherData, setTeacherData] = useState<any>(null);
    
    const [formData, setFormData] = useState({
        personalInfo: { fullName: "", birthday: "", department: "Mathematics", nationality: "", gender: "Male", maritalStatus: "Single" },
        contactAddress: { city: "", phoneNumber: "", email: "", kebele: "" },
        education: { completionLevel: "" },
        experience: "",
        emergencyContact: { fullName: "", city: "", phoneNumber: "", relationship: "" },
        salary: ""
    });

    const downloadPDF = (data: any, credentials: any) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Teacher Registration Details", 20, 20);
        doc.setFontSize(12);
        doc.text(`Full Name: ${data.personalInfo.fullName}`, 20, 40);
        doc.text(`Employee ID: ${credentials.employeeID}`, 20, 50);
        doc.text(`Generated Password: ${credentials.password}`, 20, 60);
        doc.text(`Department: ${data.personalInfo.department}`, 20, 70);
        doc.save(`${data.personalInfo.fullName}_Registration.pdf`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await Axios({ ...summeryApi.registerTeacher, data: formData });
            
            // Trigger PDF download with the returned credentials
            downloadPDF(formData, response.data.credentials);
            
            // Show the Success Modal
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Registration failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#159eb5]/20 focus:border-[#159eb5] outline-none transition";
    const labelClass = "text-xs font-bold text-slate-500 mb-1 block";

    return (
        <>
            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Teacher Registered!</h2>
                        <p className="text-slate-600 mb-6 text-sm">Credentials have been downloaded as a PDF.</p>
                        <button 
                            onClick={onSuccess} 
                            className="w-full bg-[#159eb5] text-white py-2 rounded-lg font-bold hover:bg-[#118a9e] transition"
                        >
                            Return to List
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Personal Info */}
                <div className="space-y-3">
                    <h4 className="font-bold text-slate-700 text-sm border-b border-gray-300 pb-4 flex items-center gap-2"><User size={16}/> Personal Information</h4>
                    <div className="grid grid-cols-4 gap-3 pb-8 pt-3">
                        <div><label className={labelClass}>Full Name</label><input required className={inputClass} onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, fullName: e.target.value}})} /></div>
                        <div><label className={labelClass}>Birthday</label><input type="date" required className={inputClass} onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, birthday: e.target.value}})} /></div>
                        <div><label className={labelClass}>Department</label><select className={inputClass} onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, department: e.target.value}})}><option>Mathematics</option><option>Physics</option><option>History</option></select></div>
                        <div><label className={labelClass}>Nationality</label><input className={inputClass} onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, nationality: e.target.value}})} /></div>
                        <div><label className={labelClass}>Gender</label><select className={inputClass} onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, gender: e.target.value}})}><option>Male</option><option>Female</option></select></div>
                        <div><label className={labelClass}>Marital Status</label><select className={inputClass} onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, maritalStatus: e.target.value}})}><option>Single</option><option>Married</option></select></div>
                    </div>
                </div>

                {/* 2. Contact & Professional */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-700 text-sm border-b border-gray-300 pb-4 flex items-center gap-2"><MapPin size={16}/> Contact</h4>
                        <div><label className={labelClass}>City</label><input className={inputClass} onChange={(e) => setFormData({...formData, contactAddress: {...formData.contactAddress, city: e.target.value}})} /></div>
                        <div><label className={labelClass}>Phone</label><input className={inputClass} onChange={(e) => setFormData({...formData, contactAddress: {...formData.contactAddress, phoneNumber: e.target.value}})} /></div>
                        <div><label className={labelClass}>Email</label><input type="email" className={inputClass} onChange={(e) => setFormData({...formData, contactAddress: {...formData.contactAddress, email: e.target.value}})} /></div>
                        <div><label className={labelClass}>Kebele</label><input className={inputClass} onChange={(e) => setFormData({...formData, contactAddress: {...formData.contactAddress, kebele: e.target.value}})} /></div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-700 text-sm border-b border-gray-300 pb-4 flex items-center gap-2"><BookOpen size={16}/> Professional</h4>
                        <div><label className={labelClass}>Education Level</label><input className={inputClass} onChange={(e) => setFormData({...formData, education: { completionLevel: e.target.value }})} /></div>
                        <div><label className={labelClass}>Experience</label><textarea className={inputClass} onChange={(e) => setFormData({...formData, experience: e.target.value})} /></div>
                        <div><label className={labelClass}>Salary (ETB)</label><input type="number" required className={inputClass} onChange={(e) => setFormData({...formData, salary: e.target.value})} /></div>
                    </div>
                </div>

                {/* 3. Emergency Contact */}
                <div className="space-y-3">
                    <h4 className="font-bold text-slate-700 text-sm border-b border-gray-300 pb-4 flex items-center gap-2"><AlertCircle size={16}/> Emergency Contact</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Full Name" className={inputClass} onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, fullName: e.target.value}})} />
                        <input placeholder="City" className={inputClass} onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, city: e.target.value}})} />
                        <input placeholder="Phone" className={inputClass} onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, phoneNumber: e.target.value}})} />
                        <input placeholder="Relationship" className={inputClass} onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, relationship: e.target.value}})} />
                    </div>
                </div>

                <button disabled={loading} className="w-full bg-[#130ce8] text-white py-3 rounded-lg hover:bg-[#11269eee] transition flex items-center justify-center gap-2 font-bold">
                    {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />} Register Teacher
                </button>
            </form>
        </>
    );
}