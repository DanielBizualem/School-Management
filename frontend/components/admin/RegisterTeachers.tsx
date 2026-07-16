'use client';

import React, { useState } from "react";
import { UserPlus, User, MapPin, AlertCircle, Loader2, BookOpen, CheckCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        </div>
    );
}

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

    const inputClass =
        "w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-gray-400 outline-none transition placeholder:text-slate-400";
    const labelClass = "text-xs font-medium text-slate-500 mb-1.5 block";
    const required = <span className="text-red-500">*</span>;

    return (
        <>
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mb-2">Teacher registered</h2>
                        <p className="text-slate-500 mb-6 text-sm">Credentials have been downloaded as a PDF.</p>
                        <button
                            onClick={onSuccess}
                            className="w-full bg-green-700 text-white py-2.5 rounded-xl font-medium hover:bg-green-800 transition"
                        >
                            Return
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Register teacher</h2>
                    <p className="text-sm text-slate-500 mt-1">Fill in the details below to add a new teacher.</p>
                </div>

                {/* 1. Personal Info */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <SectionHeader icon={<User size={16} />} title="Personal information" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Full name {required}</label>
                            <input
                                required
                                placeholder="e.g. Abebe Kebede"
                                className={inputClass}
                                onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, fullName: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Birthday {required}</label>
                            <input
                                type="date"
                                required
                                className={inputClass}
                                onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, birthday: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Department {required}</label>
                            <select
                                className={inputClass}
                                required
                                onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, department: e.target.value } })}
                            >
                                <option>Mathematics</option>
                                <option>Physics</option>
                                <option>History</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Nationality {required}</label>
                            <input
                                required
                                placeholder="e.g. Ethiopian"
                                className={inputClass}
                                onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, nationality: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Gender {required}</label>
                            <select
                                required
                                className={inputClass}
                                onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, gender: e.target.value } })}
                            >
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Marital status</label>
                            <select
                                className={inputClass}
                                onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, maritalStatus: e.target.value } })}
                            >
                                <option>Single</option>
                                <option>Married</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Contact & Professional */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <SectionHeader icon={<MapPin size={16} />} title="Contact" />
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>City</label>
                                <input
                                    placeholder="e.g. Addis Ababa"
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, contactAddress: { ...formData.contactAddress, city: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Phone {required}</label>
                                <input
                                    required
                                    placeholder="09xx xxx xxx"
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, contactAddress: { ...formData.contactAddress, phoneNumber: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    placeholder="name@school.edu"
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, contactAddress: { ...formData.contactAddress, email: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Kebele</label>
                                <input
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, contactAddress: { ...formData.contactAddress, kebele: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <SectionHeader icon={<BookOpen size={16} />} title="Professional" />
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Education level {required}</label>
                                <input
                                    required
                                    placeholder="e.g. BSc in Mathematics"
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, education: { completionLevel: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Experience</label>
                                <textarea
                                    rows={3}
                                    placeholder="Years of teaching experience, previous schools..."
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Salary (ETB) {required}</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Emergency Contact */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <SectionHeader icon={<AlertCircle size={16} />} title="Emergency contact" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            required
                            placeholder="Full name"
                            className={inputClass}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, fullName: e.target.value } })}
                        />
                        <input
                            placeholder="City"
                            className={inputClass}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, city: e.target.value } })}
                        />
                        <input
                            placeholder="Phone"
                            required
                            className={inputClass}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phoneNumber: e.target.value } })}
                        />
                        <input
                            required
                            placeholder="Relationship"
                            className={inputClass}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })}
                        />
                    </div>
                </div>

                <button
                    disabled={loading}
                    className="w-50 bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 disabled:opacity-60 transition flex items-center justify-center gap-2 font-medium"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
        </>
    );
}
