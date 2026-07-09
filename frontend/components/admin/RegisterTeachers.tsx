'use client';

import React, { useState } from "react";
import { UserPlus, Mail, Lock, Phone, DollarSign, Loader2, Building, User } from "lucide-react";
import { jsPDF } from "jspdf";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

export default function TeacherRegistrationForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "", phoneNumber: "",
        department: "Mathematics", salary:""
    });

    // Helper to generate the PDF
    const generateCredentialsPDF = (teacherData: any) => {
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("ONESMOS NESIB HIGH SCHOOL", 105, 20, { align: "center" });
        
        doc.setFontSize(14);
        doc.text("Faculty Login Credentials", 105, 35, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Full Name: ${teacherData.fullName}`, 20, 55);
        doc.text(`Teacher ID: ${teacherData.employeeID}`, 20, 65);
        doc.text(`Initial Password: ${teacherData.password}`, 20, 75);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Note: Please change this password upon your first login for security.", 20, 95);
        
        doc.save(`${teacherData.fullName}_Credentials.pdf`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Perform your actual API registration call here
            // const response = await registerTeacherAPI(payload);
            const response = await Axios({
                ...summeryApi.registerTeacher,
                data: formData
            })
            const { credentials } = response.data;
            // 2. Mock response: Replace this with your actual API response data
            {/**
            const mockResponse = { 
                fullName: formData.fullName, 
                employeeID: "ONS-2026-" + Math.floor(Math.random() * 1000), 
                password: formData.password // Note: Ensure your API returns the password or you handle it securely
            };
         */}

            // 3. Generate PDF and then trigger success
            generateCredentialsPDF(credentials);
            onSuccess();
        } catch (error) {
            console.error("Registration failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Register New Teacher</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2"><User size={16}/>Full Name</label>
                        <input required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition text-sm" 
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Enter Full Name"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2"><Phone size={16}/>Phone Number</label>
                        <input required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition text-sm" 
                            placeholder="+251..." onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}/>
                    </div>
                </div>

                

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2"><Building size={16}/>Subject</label>
                        <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition bg-white text-sm" 
                            onChange={(e) => setFormData({...formData, department: e.target.value})}>
                            <option>Mathematics</option>
                            <option>Physics</option>
                            <option>History</option>
                        </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">Salary (ETB)</label>
                        <input type="number" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition text-sm" 
                            onChange={(e) => setFormData({...formData, salary: e.target.value})} placeholder="Enter Salary"/>
                    </div>
                </div>

                <button 
                    disabled={loading}
                    className="w-full bg-green-700 text-white font-semibold py-3 rounded-xl hover:bg-green-800 transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
}