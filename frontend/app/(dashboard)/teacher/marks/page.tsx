'use client';

import React, { useState } from "react";
import { GraduationCap } from "lucide-react";

export default function MarksHeader() {
    const grades = ["9th Grade", "10th Grade", "11th Grade", "12th Grade"];
    const [activeGrade, setActiveGrade] = useState("9th Grade");

    return (
        <header className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans">
            {/* Header Section */}
            <div className="bg-[#115e70] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2.5 rounded-lg">
                        <GraduationCap size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Academic Grade Management</h1>
                        <p className="text-cyan-100/80 text-xs uppercase tracking-wider font-medium">Students Grade Submission Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tab Bar */}
            <nav className="flex items-center px-6 gap-8 border-b border-slate-200 bg-slate-50/50">
                {grades.map((grade) => {
                    const isActive = activeGrade === grade;
                    return (
                        <button
                            key={grade}
                            onClick={() => setActiveGrade(grade)}
                            className={`py-4 text-sm font-semibold transition-all duration-200 relative ${
                                isActive 
                                    ? "text-[#115e70]" 
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {grade}
                            {/* Active Tab Indicator */}
                            {isActive && (
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#115e70] shadow-[0_0_8px_rgba(17,94,112,0.4)]" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </header>
    );
}