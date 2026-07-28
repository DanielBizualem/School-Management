'use client';
import React, { useState, useEffect } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";
import { Calendar, CheckCircle2, XCircle, Plus, Clock, UserCheck } from "lucide-react";

export default function RegistrationManagementPage() {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [pendingList, setPendingList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"windows" | "pending">("windows");
    
    const [formData, setFormData] = useState({
        academicYear: "2026-2027",
        targetGrade: "Grade 10",
        isRegistrationOpen: true
    });

    const fetchRegistrations = async () => {
        try {
            const response = await Axios({
                method: summeryApi.getRegistrationStatus.method,
                url: summeryApi.getRegistrationStatus.url
            });
            if (response.data.success) {
                setRegistrations(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch registration status:", error);
        }
    };

    const fetchPending = async () => {
        try {
            const res = await Axios({
                method: summeryApi.getPendingRegistrations.method,
                url: summeryApi.getPendingRegistrations.url
            });
            if (res.data.success) {
                setPendingList(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch pending registrations", error);
        }
    };

    useEffect(() => {
        fetchRegistrations();
        fetchPending();
    }, []);

    const handleToggle = async (academicYear: string, targetGrade: string, currentState: boolean) => {
        try {
            const response = await Axios({
                method: summeryApi.toggleRegistration.method,
                url: summeryApi.toggleRegistration.url,
                data: {
                    academicYear,
                    targetGrade,
                    isRegistrationOpen: !currentState
                }
            });
            if (response.data.success) {
                fetchRegistrations();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to update registration status");
        }
    };

    const handleCreateConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await Axios({
                method: summeryApi.toggleRegistration.method,
                url: summeryApi.toggleRegistration.url,
                data: formData
            });
            if (response.data.success) {
                alert("Registration window created/updated successfully.");
                fetchRegistrations();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Error saving registration window");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (registrationId: string) => {
        try {
            setLoadingId(registrationId);
            const res = await Axios({
                method: summeryApi.approveStudentRegistration.method,
                url: `${summeryApi.approveStudentRegistration.url}/${registrationId}`
            });
            alert(res.data.message);
            fetchPending();
        } catch (error: any) {
            alert(error.response?.data?.message || "Approval failed");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="p-8 w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Academic Registration Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Open/close enrollment windows and approve student grade promotions.</p>
                </div>
                {/* Navigation Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start">
                    <button
                        onClick={() => setActiveTab("windows")}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                            activeTab === "windows" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        Registration Windows
                    </button>
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`relative px-4 py-2 text-xs font-semibold rounded-lg transition ${
                            activeTab === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                        Pending Approvals
                        {pendingList.length > 0 && (
                            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">
                                {pendingList.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === "windows" ? (
                <div className="space-y-8 w-full">
                    {/* Create / Configure Form */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
                        <h3 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-teal-600" /> Open New Registration Window
                        </h3>
                        <form onSubmit={handleCreateConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Academic Year</label>
                                <input 
                                    type="text" 
                                    value={formData.academicYear}
                                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                    placeholder="e.g. 2026-2027"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-teal-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Target Grade</label>
                                <input 
                                    type="text" 
                                    value={formData.targetGrade}
                                    onChange={(e) => setFormData({ ...formData, targetGrade: e.target.value })}
                                    placeholder="e.g. Grade 10"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-teal-600"
                                    required
                                />
                            </div>
                            <div className="flex items-end">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition"
                                >
                                    {loading ? "Saving..." : "Set Configuration"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Existing Configurations Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-md font-semibold text-slate-800">Active Registration Windows</h3>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Academic Year</th>
                                        <th className="p-4 font-semibold">Target Grade</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {registrations.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-slate-400">No configuration records found.</td>
                                        </tr>
                                    ) : (
                                        registrations.map((item) => (
                                            <tr key={item._id} className="hover:bg-slate-50/50 transition">
                                                <td className="p-4 font-medium flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" /> {item.academicYear}
                                                </td>
                                                <td className="p-4">{item.targetGrade}</td>
                                                <td className="p-4">
                                                    {item.isRegistrationOpen ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Open
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full">
                                                            <XCircle className="w-3.5 h-3.5" /> Closed
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => handleToggle(item.academicYear, item.targetGrade, item.isRegistrationOpen)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                                                            item.isRegistrationOpen 
                                                                ? "border-rose-200 text-rose-700 hover:bg-rose-50" 
                                                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                        }`}
                                                    >
                                                        {item.isRegistrationOpen ? "Close Window" : "Open Window"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* Pending Student Approvals Section */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" /> Student Re-Enrollment Requests
                        </h3>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                            {pendingList.length} Pending
                        </span>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-semibold">Student Name</th>
                                    <th className="p-4 font-semibold">Student ID</th>
                                    <th className="p-4 font-semibold">Current Grade</th>
                                    <th className="p-4 font-semibold">Target Grade</th>
                                    <th className="p-4 font-semibold">Academic Year</th>
                                    <th className="p-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {pendingList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                            No pending registration requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    pendingList.map((item) => (
                                        <tr key={item._id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-4 font-medium text-slate-900">
                                                {item.student?.fullName || "Unknown"}
                                            </td>
                                            <td className="p-4 text-slate-500">{item.student?.studentID}</td>
                                            <td className="p-4">Grade {item.student?.gradeLevel}</td>
                                            <td className="p-4 font-semibold text-teal-700">{item.targetGrade}</td>
                                            <td className="p-4">{item.academicYear}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    disabled={loadingId === item._id}
                                                    onClick={() => handleApprove(item._id)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
                                                >
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                    {loadingId === item._id ? "Approving..." : "Approve"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}