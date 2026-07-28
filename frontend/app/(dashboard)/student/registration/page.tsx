'use client';
import React, { useState, useEffect } from "react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";
import { ArrowRight, Sparkles } from "lucide-react";

export default function StudentRegistrationCard() {
    const [statusData, setStatusData] = useState<any[]>([]);
    const [targetGrade, setTargetGrade] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        Axios({ 
            method: summeryApi.getStudentRegistrationStatus.method, 
            url: summeryApi.getStudentRegistrationStatus.url 
        })
            .then(res => {
                setStatusData(res.data.data || []);
                setTargetGrade(res.data.targetGrade || "");
            })
            .catch(err => console.error(err));
    }, []);

    const handleRegister = async (academicYear: string) => {
        try {
            setSubmitting(true);
            const res = await Axios({
                method: summeryApi.submitStudentRegistration.method,
                url: summeryApi.submitStudentRegistration.url,
                data: { academicYear }
            });
            alert(res.data.message);
        } catch (err: any) {
            alert(err.response?.data?.message || "Registration failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Next Academic Year Enrollment</h3>
                    <p className="text-sm text-slate-500">Register for your upcoming promotional grade level.</p>
                </div>
                {targetGrade && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-xl self-start sm:self-auto">
                        <Sparkles className="w-3.5 h-3.5" /> Target: {targetGrade}
                    </span>
                )}
            </div>

            {statusData.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400 italic">No registration windows are currently open for {targetGrade || "your grade"}.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {statusData.map((item) => (
                        <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{item.academicYear}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-md">
                                        {item.targetGrade}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {item.isRegistrationOpen ? "Status: Open for enrollment" : "Status: Closed"}
                                </p>
                            </div>
                            <button
                                disabled={submitting || !item.isRegistrationOpen}
                                onClick={() => handleRegister(item.academicYear)}
                                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-800 disabled:opacity-40 transition shadow-sm"
                            >
                                {item.isRegistrationOpen ? "Register Now" : "Unavailable"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}