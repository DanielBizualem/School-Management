'use client';

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Users, LogOut, PanelLeftClose, BookOpen, UserPlus, Presentation, ScrollText, PanelLeftOpen, Settings, ChevronsUpDown, ClipboardList, Menu, X
} from "lucide-react";
import summeryApi from "@/common/summeryApi";
import Axios from "@/utils/Axios";

interface DirectorProfile {
    _id: string;
    status: string;
    employeeID?: string;
    user: {
        email: string;
    };
}

export default function DirectorSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [directorDetail, setDirectorDetail] = useState<DirectorProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const navItems = [
        { label: "Students Analytics", id: "analytics", path: "/director/analytics", icon: Users },
        { label: "Manage Courses", id: "courses", path: "/director/courses", icon: BookOpen },
        { label: "All Rosters", id: "rosters", path: "/director/roster", icon: ClipboardList },
        { label: "Assign Sections", id: "sections", path: "/director/sections", icon: UserPlus },
        { label: "Manage Teachers", id: "teachers", path: "/director/teachers", icon: Presentation },
        { label: "Generate Transcript", id: "transcript", path: "/director/transcript", icon: ScrollText },
        { label: "Settings", id: "settings", path: "/director/settings", icon: Settings }
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
            setDirectorDetail(response.data.data);
        } catch (error) {
            console.error("Failed to fetch teacher details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, []);

    // Lock body scroll while the mobile sidebar is open
    useEffect(() => {
        document.body.style.overflow = isMobileOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileOpen]);

    const email = directorDetail?.user?.email || "";
    const initial = email.trim().charAt(0).toUpperCase() || "D";

    return (
        <>
            {/* Mobile Header Bar - hidden while the drawer is open so it can't peek out beside it */}
            {!isMobileOpen && (
                <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a2f2b] px-4 flex items-center gap-3 z-40 text-white shadow-sm">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition"
                        aria-label="Open sidebar"
                    >
                        <Menu size={20} />
                    </button>
                    <span className="font-bold text-sm tracking-wide">ONESMOS NESIB</span>
                </header>
            )}

            {/* Mobile Backdrop Overlay */}
            {isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`bg-[#0b1329] text-slate-300 flex flex-col border-r border-slate-900 shrink-0 transition-all duration-300 ease-in-out fixed lg:static inset-y-0 left-0 z-50 h-screen ${
                    isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
                } ${
                    isCollapsed ? "w-20" : "w-72 sm:w-64"
                }`}
            >
                {/* Desktop Collapse Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex absolute top-7 -right-3.5 z-50 p-1.5 rounded-lg bg-[#0b1329] text-white hover:bg-slate-800 border border-slate-700 shadow-xl transition-all items-center justify-center"
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                </button>

                {/* Brand Header */}
                <div className="px-5 py-5 border-b border-slate-800/80 relative shrink-0">
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden absolute right-3.5 top-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center font-sans">
                        {!isCollapsed ? (
                            <div className="flex flex-col items-center w-full">
                                <p className="text-white font-black text-base tracking-wider truncate font-serif">ONESMOS NESIB</p>
                                <p className="text-sm tracking-widest text-cyan-400 uppercase mt-0.5 font-serif">Academy</p>
                            </div>
                        ) : (
                            <div className="text-white font-black text-xs w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">ONA</div>
                        )}
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-3 space-y-1 font-sans overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    router.push(item.path);
                                    setIsMobileOpen(false);
                                }}
                                className={`w-full flex items-center rounded-xl text-[13px] font-semibold tracking-wide transition-all ${
                                    isCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5"
                                } ${
                                    isActive
                                        ? "bg-cyan-500/10 text-cyan-400"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                                }`}
                            >
                                <item.icon size={17} strokeWidth={2} className={isActive ? "text-cyan-400 shrink-0" : "text-slate-500 shrink-0"} />
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="relative mt-auto px-3 pb-3 pt-3 border-t border-slate-800/70 shrink-0">
                    {/* Floating Logout Popover */}
                    {isProfileMenuOpen && (
                        <div className={`absolute bottom-[calc(100%+8px)] left-3 bg-[#111c3a] border border-slate-800 rounded-xl shadow-xl p-1.5 z-50 ${
                            isCollapsed ? "w-40" : "w-56"
                        }`}>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                            >
                                <LogOut size={14} strokeWidth={2.5} />
                                Log out
                            </button>
                        </div>
                    )}

                    {/* Main Profile Trigger Frame */}
                    <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className={`w-full flex items-center rounded-xl transition-all border ${
                            isCollapsed ? "justify-center p-1.5" : "justify-between p-2"
                        } ${isProfileMenuOpen ? "bg-slate-800/50 border-slate-700/60" : "bg-transparent border-transparent hover:bg-slate-800/30"}`}
                    >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            {/* User Avatar */}
                            <div className={`rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-sm shrink-0 ring-1 ring-white/10 ${
                                isCollapsed ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm"
                            }`}>
                                {loading ? "" : initial}
                            </div>

                            {/* Profile Subtext */}
                            {!isCollapsed && (
                                <div className="text-left overflow-hidden flex-1">
                                    <span className="text-sm font-bold text-slate-200 block truncate leading-tight">
                                        {loading ? "Loading..." : (email || "Director")}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium block truncate mt-0.5">
                                        Director
                                    </span>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && <ChevronsUpDown size={16} className="text-slate-500 shrink-0 ml-2" />}
                    </button>
                </div>
            </aside>
        </>
    );
}