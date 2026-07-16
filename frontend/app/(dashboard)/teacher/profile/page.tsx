'use client';

import React, { useEffect, useState } from "react";
import { User, Mail, MapPin, Phone, BookOpen, Briefcase, Cake, Globe, Users, ShieldAlert } from "lucide-react";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

interface TeacherProfile {
    _id: string;
    status: string;
    employeeID?: string;
    user: {
        email: string;
    };
    personalInfo: {
        fullName: string;
        department: string;
        birthday: string;
        nationality: string;
        gender: string;
        employeeID: string;
    };
    contactAddress: {
        email: string;
        phoneNumber: string;
        city: string;
        kebele: string;
    };
    education: {
        completionLevel: string;
    };
    experience?: string;
    emergencyContact?: {
        fullName?: string;
        relationship?: string;
        phoneNumber?: string;
    };
    
}

export default function TeacherProfile() {
    const [teacherDetail, setTeacherDetail] = useState<TeacherProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...summeryApi.getUserDetail
            });
            setTeacherDetail(response.data.data);
            console.log(response.data.data)
        } catch (error) {
            console.error("Failed to fetch teacher details", error);
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

    const SectionCard = ({
        icon,
        title,
        children,
    }: {
        icon: React.ReactNode;
        title: string;
        children: React.ReactNode;
    }) => (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200">
                <div className="text-[#159eb5]">{icon}</div>
                <h2 className="text-sm font-bold text-slate-700 tracking-wide">{title}</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {children}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="w-full bg-white border border-slate-200 rounded-xl p-10 flex items-center justify-center">
                <span className="text-slate-400 text-sm animate-pulse">Loading profile...</span>
            </div>
        );
    }

    if (!teacherDetail) {
        return (
            <div className="w-full bg-white border border-slate-200 rounded-xl p-10 flex items-center justify-center">
                <span className="text-slate-400 text-sm">No profile data available.</span>
            </div>
        );
    }

    const { personalInfo, contactAddress, education, experience, emergencyContact, status, user, employeeID } = teacherDetail;

    return (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#159eb5] to-[#0f7e91] px-6 py-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/15 p-2 rounded-lg">
                        <User size={22} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">{personalInfo?.fullName || "Teacher Profile"}</h1>
                        <p className="text-xs text-white/80">{education?.completionLevel || "Faculty Member"}</p>
                    </div>
                </div>
                {status && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/15 border border-white/30 capitalize">
                        {status}
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                {/* Photo + quick info */}
                <div className="w-full md:w-52 flex-shrink-0 flex flex-col items-center gap-3">
                    <div className="w-40 h-48 md:w-full md:h-56 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden">
                        <span className="text-slate-400 text-xs">Profile Photo</span>
                    </div>
                    <button className="w-full text-[#159eb5] font-semibold text-sm border border-[#159eb5] rounded-lg py-2 hover:bg-[#159eb5] hover:text-white transition-colors">
                        Edit Profile
                    </button>
                </div>

                {/* Sections */}
                <div className="flex-1 flex flex-col gap-5">
                    <SectionCard icon={<User size={16} />} title="Personal Information">
                        <ProfileRow label="Full Name" value={personalInfo?.fullName} />
                        <ProfileRow label="ID" value={employeeID} />
                        <ProfileRow
                            label="Birth Day"
                            value={
                                personalInfo?.birthday
                                    ? new Date(personalInfo.birthday).toLocaleDateString()
                                    : undefined
                            }
                        />
                        <ProfileRow label="Nationality" value={personalInfo?.nationality} />
                        <ProfileRow label="Gender" value={personalInfo?.gender} />
                        <ProfileRow label="Department" value={personalInfo?.department} />
                    </SectionCard>

                    <SectionCard icon={<MapPin size={16} />} title="Contact Address">
                        <ProfileRow label="Email" value={contactAddress?.email || user?.email} />
                        <ProfileRow label="Phone" value={contactAddress?.phoneNumber} />
                        <ProfileRow label="City" value={contactAddress?.city} />
                        <ProfileRow label="Kebele" value={contactAddress?.kebele} />
                    </SectionCard>

                    <SectionCard icon={<BookOpen size={16} />} title="Education">
                        <ProfileRow label="Completion Level" value={education?.completionLevel} />
                    </SectionCard>

                    <SectionCard icon={<Briefcase size={16} />} title="Experience">
                        <ProfileRow label="Years of Experience" value={experience} />
                        
                    </SectionCard>

                    <SectionCard icon={<ShieldAlert size={16} />} title="Emergency Contact">
                        <ProfileRow label="Name" value={emergencyContact?.fullName} />
                        <ProfileRow label="Relationship" value={emergencyContact?.relationship} />
                        <ProfileRow label="Phone" value={emergencyContact?.phoneNumber} />
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}