'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    LayoutDashboard, 
    Users, 
    BookOpen, 
    UserPlus, 
    LogOut, 
    Menu, 
    X, 
    ChevronsUpDown,
    PanelLeftClose,
    PanelLeftOpen,
    Settings2
} from "lucide-react";

type AdminTab = "analytics" | "students" | "courses" | "register";

interface AdminNavProps {
    children: React.ReactNode;
    activeDashboardTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
}

export default function AdminNav({ children, activeDashboardTab, onTabChange }: AdminNavProps): React.JSX.Element {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    const navItems = [
        { label: "Dashboard Overview", id: "analytics" as const, icon: LayoutDashboard },
        { label: "Students List", id: "students" as const, icon: Users },
        { label: "Teachers List", id: "teachers" as const, icon: Users },
        { label: "All Courses", id: "courses" as const, icon: BookOpen },
        { label: "Register Students", id: "register" as const, icon: UserPlus },
        { label: "Settings", id: "settings" as const, icon: Settings2 }
    ];

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        router.push("/login");
    };

    const RenderNavLinks = () => (
        <div className="space-y-3">
            {navItems.map((item) => {
                const isActive = activeDashboardTab === item.id;
                const IconComponent = item.icon;
                
                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            onTabChange(item.id);
                            setIsMobileMenuOpen(false);
                        }}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center rounded-2xl text-xs font-semibold tracking-wide transition-all relative group ${
                            isCollapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3"
                        } ${
                            isActive 
                                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold" 
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                    >
                        {isActive && (
                            <span className="absolute left-0 w-1 h-4 bg-cyan-400 rounded-r-md" />
                        )}
                        <IconComponent 
                            size={16} 
                            strokeWidth={isActive ? 2.5 : 2}
                            className={`transition-colors shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`}
                        />
                        {!isCollapsed && <span>{item.label}</span>}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="flex h-screen w-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-800 antialiased flex-col md:flex-row">
            
            {/* 🌌 DEEP DARK BLUE DESKTOP SIDEBAR WITH EXTERNAL OVERLAY TOGGLE */}
            <aside 
                className={`hidden md:flex bg-[#0b1329] text-slate-300 flex-col border-r border-slate-900 shrink-0 p-5 justify-between relative transition-all duration-300 ${
                    isCollapsed ? "w-20" : "w-68"
                }`}
            >
                {/* 🔘 FIXED COLLAPSE TRIGGER MOUNTED ON THE VERTICAL BORDER LINE */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-7 -right-4 z-40 p-1.5 rounded-lg bg-[#0b1329] text-white hover:bg-slate-800 border border-slate-800/80 transition-colors flex items-center justify-center focus:outline-none shadow-md"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? (
                        <PanelLeftOpen size={15} strokeWidth={2.5} className="text-white" />
                    ) : (
                        <PanelLeftClose size={15} strokeWidth={2.5} className="text-white" />
                    )}
                </button>

                {/* Upper Body Stack */}
                <div className="space-y-8">
                    {/* Brand Header Display Node */}
                    <div className={`flex items-center min-h-[40px] ${isCollapsed ? "justify-center" : "px-1"}`}>
                        {!isCollapsed ? (
                            <div className="flex flex-col items-center">
                                <span className="flex justify-center text-white font-black text-lg tracking-wider block">ONESMOS NESIB</span>
                                <span className="flex justify-center text-3xs font-mono tracking-widest text-cyan-500 uppercase">HIGH SCHOOL</span>
                            </div>
                        ) : (
                            <div className="text-white font-black text-sm tracking-widest bg-slate-900/40 w-8 h-8 rounded-xl flex items-center justify-center border border-slate-800/50">
                                A
                            </div>
                        )}
                    </div>

                    <nav className="space-y-1">
                        <RenderNavLinks />
                    </nav>
                </div>

                {/* 👤 INTERACTIVE BOTTOM PROFILE FOOTER */}
                <div className="relative mt-auto pt-4 border-t border-slate-800/60">
                    
                    {/* Floating Logout Popover */}
                    {isProfileMenuOpen && (
                        <div className={`absolute bottom-[calc(100%+8px)] left-0 bg-[#111c3a] border border-slate-800 rounded-xl shadow-xl p-1.5 animate-fadeIn z-50 ${
                            isCollapsed ? "w-40 left-2" : "w-full"
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
                            isCollapsed ? "justify-center p-1" : "justify-between p-2.5"
                        } ${isProfileMenuOpen ? "bg-slate-800/40 border-slate-700/50" : "bg-transparent border-transparent hover:bg-slate-800/30"}`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            {/* User Avatar */}
                            <div className={`rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-sm shrink-0 transition-all duration-300 ${
                                isCollapsed ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"
                            }`}>
                                D
                            </div>
                            
                            {/* Profile Subtext */}
                            {!isCollapsed && (
                                <div className="text-left overflow-hidden flex-1">
                                    <span className="text-sm font-bold text-slate-200 block truncate leading-tight">
                                        Daniel Bizualem
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium block truncate mt-0.5">
                                        daniel@sovereign.dev
                                    </span>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && <ChevronsUpDown size={16} className="text-slate-500 shrink-0 ml-2" />}
                    </button>
                </div>

            </aside>

            {/* MOBILE NAVIGATION HEADER */}
            <header className="md:hidden h-14 bg-[#0b1329] border-b border-slate-900 px-4 flex items-center justify-between shrink-0">
                <span className="text-white font-black text-sm tracking-wide">ACADEMY CORE</span>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-white bg-slate-900/60 border border-slate-800 p-2 rounded-xl transition"
                >
                    {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </header>

            {/* MOBILE MENU PANEL */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-[#0b1329] p-4 border-b border-slate-900 shrink-0 z-50 space-y-4 animate-fadeIn">
                    <RenderNavLinks />
                    <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">D</div>
                            <span className="text-xs text-slate-300 font-bold">Daniel Bizualem</span>
                        </div>
                        <button onClick={handleLogout} className="text-red-400 text-xs font-bold flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-lg">
                            <LogOut size={14} /> Leave
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT CANVAS STAGE */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#fbfcfd]">
                {children}
            </div>
        </div>
    );
}