'use client';

import React, { useState } from "react";
import { User, Mail, MapPin, Phone, BookOpen, Briefcase } from "lucide-react";

export default function TeacherProfile() {
    const tabs = ["Personal", "Contact Address", "Education", "Experience", "Emergency Contact"];
    const [activeTab, setActiveTab] = useState("Personal");

    return (
        <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans">
            {/* Header */}
            <div className="bg-[#159eb5] p-3 text-white flex items-center gap-3">
                <User size={24} />
                <h1 className="text-md font-bold">Teacher Profile</h1>
            </div>

            {/* Navigation Tabs */}
            <div className="flex px-6 pt-4 space-x-6 border-b border-slate-100 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-1 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                            activeTab === tab ? "text-[#159eb5]" : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#159eb5]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="p-8 flex gap-5">
                <div className="w-48 h-60 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                    <span className="text-slate-400 text-xs">Profile Photo</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 flex-1">
                    {[
                        { label: "Full Name", value: "Daniel Bizualem" },
                        { label: "Nationality", value: "Ethiopian" },
                        { label: "Date of Birth", value: "1995-05-28" },
                        { label: "Gender", value: "Male" },
                        { label: "Department", value: "Computer Science" },
                        { label: "Marital Status", value: "Single" }
                    ].map((info) => (
                        <div key={info.label}>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{info.label}</p>
                            <p className="text-sm font-semibold text-slate-800 mt-1">{info.value}</p>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="px-8 pb-6">
                <button className="text-[#159eb5] font-bold text-sm hover:underline">Edit Profile</button>
            </div>
        </div>
    );
}