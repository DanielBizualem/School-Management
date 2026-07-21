'use client';

import React, { useEffect, useState } from "react";
import { User, BookOpen, Calendar, Mail, MapPin } from "lucide-react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface StudentProfileData {
    fullName: string;
    studentID: string;
    gradeLevel: string;
    gender: string;
    studentDob: string;
    studentPhoto?: string;
    // Add other fields from your DB as needed
}

export default function StudentProfile() {
    const [studentDetail, setStudentDetail] = useState<StudentProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const response = await Axios({ ...summeryApi.getUserDetail });
            // Based on your previous logic, response.data.data is the profile object
            setStudentDetail(response.data.data);
        } catch (error) {
            console.error("Failed to fetch student details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, []);

    const ProfileRow = ({ label, value }: { label: string; value: string | undefined }) => (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
            <span className="text-sm text-slate-800 font-medium">{value || "N/A"}</span>
        </div>
    );

    const SectionCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200">
                <div className="text-teal-600">{icon}</div>
                <h2 className="text-sm font-bold text-slate-700 tracking-wide">{title}</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {children}
            </div>
        </div>
    );

    if (loading) return <div className="p-10 text-center text-slate-400 animate-pulse">Loading profile...</div>;
    if (!studentDetail) return <div className="p-10 text-center text-slate-400">No profile data available.</div>;

    return (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 text-white">
                <h1 className="text-lg font-bold">{studentDetail.fullName}</h1>
                <p className="text-xs text-teal-100">{studentDetail.studentID}</p>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8">
                <SectionCard icon={<User size={16} />} title="Personal Information">
                    <ProfileRow label="Full Name" value={studentDetail.fullName} />
                    <ProfileRow label="Student ID" value={studentDetail.studentID} />
                    <ProfileRow label="Gender" value={studentDetail.gender} />
                    <ProfileRow 
                        label="Date of Birth" 
                        value={new Date(studentDetail.studentDob).toLocaleDateString()} 
                    />
                </SectionCard>

                <SectionCard icon={<BookOpen size={16} />} title="Academic Details">
                    <ProfileRow label="Grade Level" value={studentDetail.gradeLevel} />
                </SectionCard>
            </div>
        </div>
    );
}