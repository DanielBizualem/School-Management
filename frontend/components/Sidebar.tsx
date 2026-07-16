'use client';

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
    LayoutDashboard, Users, LogOut, PanelLeftClose, PanelLeftOpen, Settings2, ChevronsUpDown
} from "lucide-react";
import summeryApi from "@/common/summeryApi";
import Axios from "@/utils/Axios";


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

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [teacherDetail, setTeacherDetail] = useState<TeacherProfile | null>(null);
    const [loading, setLoading] = useState(true)


    const navItems = [
        { label: "Teacher Profile", id: "profile", path: "/teacher/profile", icon: Users },
        { label: "Dashboard Overview", id: "analytics", path: "/teacher/analytics", icon: LayoutDashboard },
        { label: "Enter Marks", id: "marks", path: "/teacher/marks", icon: Users },
        { label: "Settings", id: "settings", path: "/teacher/settings", icon: Settings2 }
    ];
    const handleLogout = () => {
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("accessToken");
      router.push("/login");
  };

  const fetchDetail = async () => {
    try {
        setLoading(true);
        const response = await Axios({
            ...summeryApi.getUserDetail
        });
        setTeacherDetail(response.data.data);
    } catch (error) {
        console.error("Failed to fetch teacher details", error);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchDetail();
    }, []);
    
    const  personalInfo  = teacherDetail?.personalInfo;
    const contactAddress = teacherDetail?.contactAddress;

    return (
        /* Using your dark navy background and layout */
        <aside 
            className={`bg-[#0b1329] text-slate-300 flex flex-col border-r border-slate-900 shrink-0 transition-all duration-300 ease-in-out relative h-screen ${
                isCollapsed ? "w-20" : "w-68"
            }`}
        >
            {/* Collapse Toggle: Positioned absolutely to the right border */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-7 -right-3.5 z-50 p-1.5 rounded-lg bg-[#0b1329] text-white hover:bg-slate-800 border border-slate-700 shadow-xl transition-all"
                title={isCollapsed ? "Expand" : "Collapse"}
            >
                {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>

            {/* Brand Header */}
            <div className="p-6 border-b border-slate-800/50">
                <div className="flex flex-col items-center font-sans">
                    {!isCollapsed ? (
                        <>
                            <span className="text-white font-black text-lg tracking-wider">ONESMOS NESIB</span>
                            <span className="text-3xs font-mono tracking-widest text-cyan-500 uppercase">HIGH SCHOOL</span>
                        </>
                    ) : (
                        <div className="text-white font-black text-sm w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">ONA</div>
                    )}
                </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-3 space-y-3 font-sans">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className={`w-full flex items-center rounded-2xl text-xs font-semibold tracking-wide transition-all border ${ // Added 'border' here
                                isCollapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3"
                            } ${
                                isActive 
                                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold" // Removed redundant 'border' class
                                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40" // Added 'border-transparent'
                            }`}
                        >
                            <item.icon size={16} className={isActive ? "text-cyan-400" : "text-slate-500"} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="relative mt-auto pt-4 border-t border-slate-800/60">
                    
                    {/* Floating Logout Popover */}
                    {isProfileMenuOpen && (
                        <div className={`absolute bottom-[calc(100%+8px)] left-0 bg-[#111c3a] border border-slate-800 rounded-xl shadow-xl p-1.5 animate-fadeIn z-50 ${
                            isCollapsed ? "w-40 left-2" : "w-50 ml-5"
                        }`}>
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-slate-800/50 hover:text-red-300 transition"
                            >
                                <LogOut size={14} strokeWidth={2.5} />
                                Log out
                            </button>
                        </div>
                    )}

                    {/* Main Profile Trigger Frame */}
                    <button 
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className={`w-full flex items-center rounded-2xl transition-all border ${
                            isCollapsed ? "justify-center p-1" : "justify-between p-2.5 mb-3"
                        } ${isProfileMenuOpen ? "bg-slate-800/40 border-slate-700/50" : "bg-transparent border-transparent hover:bg-slate-800/30"}`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            {/* User Avatar */}
                            <div className={`rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-sm shrink-0 transition-all duration-300 ${
                                isCollapsed ? "w-7 h-7 text-xs mb-4" : "w-9 h-9 text-sm"
                            }`}>
                                D
                            </div>
                            
                            {/* Profile Subtext */}
                            {!isCollapsed && (
                                <div className="text-left overflow-hidden flex-1">
                                    <span className="text-sm font-bold text-slate-200 block truncate leading-tight">
                                        {personalInfo?.fullName || "Daniel Kasa"}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium block truncate mt-0.5">
                                        {contactAddress?.email}
                                    </span>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && <ChevronsUpDown size={16} className="text-slate-500 shrink-0 ml-2" />}
                    </button>
                </div>
        </aside>
    );
}