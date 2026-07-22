'use client';

import React, { useEffect, useState } from "react";
import { getAllStudentsAPI, getSystemCoursesAPI } from "@/services/adminApi";
import { UXStudentRecord, UXCourseItem, UXParentProfile, UXDepartmentProfile} from "@/types/uxAdmin";
import { UXTeacherRecord } from "@/types/uxAdmin";

import AdminNav from "@/components/admin/AdminNav";

import AdminAnalytics from "@/components/admin/AdminAnalytics";
import GetAllStudents from "@/components/admin/GetAllStudents";
import GetSystemCourses from "@/components/admin/GetSystemCourses";
import RegisterStudent from "@/components/admin/RegisterStudents";
import EnrollCourse from "@/components/admin/EnrollCourse";
import TeacherRegistry from "@/components/admin/GetAllTeachers";
import ProfileSettings from "@/components/admin/adminSetting";
import SectionManagementPage from "@/components/admin/SectionManagement";

type AdminTab = "analytics" | "students" | "teachers" | "courses" | "register" | "sections" | "settings";

export default function AdminDashboardPortal(): React.JSX.Element {
    const [activeTab, setActiveTab] = useState<AdminTab>("analytics");
    const [students, setStudents] = useState<UXStudentRecord[]>([]);
    const [courses, setCourses] = useState<UXCourseItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [enrollmentTarget, setEnrollmentTarget] = useState<UXStudentRecord | null>(null);
    const [activeDrawerParent, setActiveDrawerParent] = useState<UXParentProfile | null>(null);

    const [teacherTarget, setTeacherTarget] = useState<UXTeacherRecord | null>(null);

    // State for viewing a specific department or profile associated with a teacher
    const [activeDrawerDepartment, setActiveDrawerDepartment] = useState<UXDepartmentProfile | null>(null);

    const syncRosterContext = async () => {
        try {
            const [studentsRes, coursesRes] = await Promise.all([getAllStudentsAPI(), getSystemCoursesAPI()]);
            if (studentsRes) setStudents(studentsRes.data || studentsRes);
            if (coursesRes) setCourses(coursesRes.data || coursesRes);
        } catch (err) {
            console.error("Context synchronization failure:", err);
        }
    };

    useEffect(() => {
        syncRosterContext().finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading...</p>
            </div>
        );
    }

    return (
        <AdminNav activeDashboardTab={activeTab} onTabChange={(tab: AdminTab) => setActiveTab(tab)}>
            
            {/* Dashboard Viewport Render Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
                {activeTab === "analytics" && (
                    <AdminAnalytics students={students} courses={courses} onNavigateToTab={(tab) => setActiveTab(tab as AdminTab)} />
                )}
                
                {activeTab === "students" && (
                    <GetAllStudents students={students} onEnrollClick={setEnrollmentTarget} onViewParent={setActiveDrawerParent} />
                )}

                {activeTab === "teachers" && (
                    <TeacherRegistry 
                        onEditTeacher={setTeacherTarget} 
                        onViewDepartment={setActiveDrawerDepartment} 
                    />
                )}

                {activeTab === "courses" && (
                    <GetSystemCourses courses={courses} />
                )}

                {activeTab === "sections" && (
                    <SectionManagementPage />
                )}

                {activeTab === "register" && (
                    <RegisterStudent onSuccess={() => { syncRosterContext(); setActiveTab("students"); }} />
                )}

                {activeTab === "settings" && (
                    <ProfileSettings />
                )}
            </div>

            {/* ENROLLMENT MODAL OVERLAY */}
            {enrollmentTarget && (
                <EnrollCourse 
                    student={enrollmentTarget} 
                    courses={courses} 
                    onClose={() => setEnrollmentTarget(null)} 
                    onSuccess={() => { syncRosterContext(); }} 
                />
            )}

            {/* PARENT SYSTEM PROFILE DRAWER VIEW */}
            {activeDrawerParent && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-3xs" onClick={() => setActiveDrawerParent(null)}>
                    <div className="h-full w-80 bg-white shadow-xl p-6 space-y-4 flex flex-col border-l border-slate-100 animate-slideLeft" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Kin Contacts</h3>
                            <button onClick={() => setActiveDrawerParent(null)} className="text-slate-400 text-xs hover:text-slate-900">✕</button>
                        </div>
                        <div className="space-y-3.5 text-2xs flex-1 pt-2">
                            <div><span className="text-slate-400 font-semibold block">Full Name</span><p className="font-bold text-slate-800 mt-0.5">{activeDrawerParent.fullName}</p></div>
                            <div><span className="text-slate-400 font-semibold block">Relationship</span><p className="font-bold text-slate-800 mt-0.5">{activeDrawerParent.relation}</p></div>
                            <div><span className="text-slate-400 font-semibold block">Phone</span><p className="font-mono font-bold text-indigo-600 mt-0.5">{activeDrawerParent.phoneNumber}</p></div>
                            <div><span className="text-slate-400 font-semibold block">Occupation</span><p className="font-medium text-slate-700 mt-0.5">{activeDrawerParent.jobType}</p></div>
                            <div><span className="text-slate-400 font-semibold block">Residential Address</span><p className="font-medium text-slate-600 mt-0.5 leading-relaxed">{activeDrawerParent.address}</p></div>
                        </div>
                    </div>
                </div>
            )}
        </AdminNav>
    );
}