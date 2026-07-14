'use client';

import React, { useState, useEffect } from "react";
import { Loader2, ArrowLeft, X, Search, Download, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllTeachersAPI, updateTeacherStatusAPI } from "@/services/adminApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TeacherRegistrationForm from "./RegisterTeachers";

interface TeacherProps {
    onEditTeacher?: (target: any) => void;
    onViewDepartment?: (dept: any) => void;
}

// Consistent color assignment per department so the same subject always
// gets the same tag + avatar color, without needing a hardcoded map.
const DEPT_PALETTE = [
    { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200", avatar: "bg-blue-100 text-blue-700" },
    { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200", avatar: "bg-purple-100 text-purple-700" },
    { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", avatar: "bg-orange-100 text-orange-700" },
    { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200", avatar: "bg-teal-100 text-teal-700" },
    { bg: "bg-pink-50", text: "text-pink-700", ring: "ring-pink-200", avatar: "bg-pink-100 text-pink-700" },
    { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", avatar: "bg-indigo-100 text-indigo-700" },
];

function getDeptStyle(dept: string) {
    if (!dept) return DEPT_PALETTE[0];
    let hash = 0;
    for (let i = 0; i < dept.length; i++) hash = dept.charCodeAt(i) + ((hash << 5) - hash);
    return DEPT_PALETTE[Math.abs(hash) % DEPT_PALETTE.length];
}

function getInitials(name: string) {
    if (!name) return "?";
    return name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
    const isLeave = status === "Leave";
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isLeave ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${isLeave ? "bg-amber-500" : "bg-emerald-500"}`} />
            {isLeave ? "On leave" : "Current"}
        </span>
    );
}

export default function TeacherRegistry({ onEditTeacher, onViewDepartment }: TeacherProps) {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [editStatus, setEditStatus] = useState("Current");
    const [view, setView] = useState("list");
    const itemsPerPage = 10;

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const response = await getAllTeachersAPI();
            const data = response?.data || response || [];
            setTeachers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch teachers:", error);
            setTeachers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (selectedTeacher) setEditStatus(selectedTeacher.status || "Current");
    }, [selectedTeacher]);

    const filteredTeachers = teachers.filter((t: any) => {
        const fullName = t.fullName || t.personalInfo?.fullName || "";
        const id = t.employeeID || t.teacherID || "";
        const teacherStatus = t.status || "Current";

        const matchesSearch =
            fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            id.toString().toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "All" || teacherStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
    const paginatedTeachers = filteredTeachers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text("Teachers List", 14, 15);
        const tableData = filteredTeachers.map((t: any, index: number) => [
            index + 1,
            t.employeeID || t.teacherID || "N/A",
            t.fullName || t.personalInfo?.fullName || "N/A",
            t.department || t.personalInfo?.department || "N/A",
            t.status || "Current",
            t.contactAddress?.email || t.email || "N/A",
        ]);
        autoTable(doc, {
            head: [["No.", "Teacher ID", "Full Name", "Department", "Status", "Email"]],
            body: tableData,
            startY: 20,
        });
        doc.save("Teachers_List.pdf");
    };

    if (view === "register") {
        return (
            <div className="flex-1 bg-white p-8 min-h-screen">
                <button
                    onClick={() => setView("list")}
                    className="flex items-center gap-2 mb-6 text-slate-600 hover:text-black font-medium"
                >
                    <ArrowLeft size={20} /> Back to list
                </button>
                <div className="max-w-4xl mx-auto">
                    <TeacherRegistrationForm
                        onSuccess={() => {
                            fetchTeachers();
                            setView("list");
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#f8fafc] p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {filteredTeachers.length} {filteredTeachers.length === 1 ? "record" : "records"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={downloadPDF}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                    >
                        <Download size={16} /> Download PDF
                    </button>
                    <button
                        onClick={() => setView("register")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-black/85 text-white rounded-xl text-sm font-medium hover:bg-black"
                    >
                        <Plus size={16} /> Register new
                    </button>
                </div>
            </div>

            <div className="flex mb-6 justify-end">
                <div className="relative flex-1 max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search by name or ID"
                        className="w-75 pl-9 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-gray-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="p-2 border border-slate-300 rounded-xl text-sm outline-none w-40 text-slate-700 focus:border-gray-400"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All status</option>
                    <option value="Current">Current</option>
                    <option value="Leave">On leave</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="animate-spin text-slate-400" />
                </div>
            ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500 text-sm">No teachers match your search.</p>
                </div>
            ) : (
                <>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-12">No.</th>
                                    <th className="px-6 py-3 font-medium">Teacher</th>
                                    <th className="px-6 py-3 font-medium">Teacher ID</th>
                                    <th className="px-6 py-3 font-medium">Department</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedTeachers.map((teacher: any, index: number) => {
                                    const name = teacher.fullName || teacher.personalInfo?.fullName || "N/A";
                                    const dept = teacher.department || teacher.personalInfo?.department || "N/A";
                                    const id = teacher.employeeID || teacher.teacherID || "N/A";
                                    const status = teacher.status || "Current";
                                    const style = getDeptStyle(dept);
                                    return (
                                        <tr key={teacher._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3.5 text-slate-400">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    
                                                    <span className="font-medium text-slate-800">{name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 font-mono text-slate-500 text-xs">{id}</td>
                                            <td className="px-6 py-3.5">
                                                <span
                                                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium`}
                                                >
                                                    {dept}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <StatusBadge status={status} />
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <button
                                                    className="border px-3 py-1 rounded-xl border-gray-300 font-medium"
                                                    onClick={() => setSelectedTeacher(teacher)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end items-center mt-6 gap-2 text-sm">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-xl disabled:opacity-40 hover:bg-slate-50"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span className="text-slate-500 px-2">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 rounded-xl disabled:opacity-40 hover:bg-slate-50"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </>
            )}

            {selectedTeacher && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative">
                        <button
                            onClick={() => setSelectedTeacher(null)}
                            className="absolute top-6 right-6 p-1 hover:bg-slate-100 rounded-full transition"
                            aria-label="Close"
                        >
                            <X size={24} className="text-slate-500" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${
                                    getDeptStyle(
                                        selectedTeacher.department || selectedTeacher.personalInfo?.department
                                    ).avatar
                                }`}
                            >
                                {getInitials(selectedTeacher.fullName || selectedTeacher.personalInfo?.fullName)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {selectedTeacher.fullName || selectedTeacher.personalInfo?.fullName}
                                </h2>
                                <div className="mt-1">
                                    <StatusBadge status={selectedTeacher.status || "Current"} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-3 text-sm">
                                <p className="text-base font-semibold border-b border-slate-200 pb-2 text-slate-800">
                                    Profile info
                                </p>
                                <p>
                                    <span className="text-slate-500">Teacher ID: </span>
                                    <span className="font-mono text-slate-700">
                                        {selectedTeacher.employeeID || selectedTeacher.teacherID}
                                    </span>
                                </p>
                                <p>
                                    <span className="text-slate-500">Department: </span>
                                    <span className="font-medium text-slate-800">
                                        {selectedTeacher.department || selectedTeacher.personalInfo?.department}
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-3 text-sm">
                                <p className="text-base font-semibold border-b border-slate-200 pb-2 text-slate-800">
                                    Emergency contact
                                </p>
                                <p>
                                    <span className="text-slate-500">Full name: </span>
                                    {selectedTeacher.emergencyContact?.fullName || "N/A"}
                                </p>
                                <p>
                                    <span className="text-slate-500">Phone: </span>
                                    {selectedTeacher.emergencyContact?.phoneNumber || "N/A"}
                                </p>
                                <p>
                                    <span className="text-slate-500">Relationship: </span>
                                    {selectedTeacher.emergencyContact?.relationship || "N/A"}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-6 border-t border-slate-200">
                            <label className="text-sm font-semibold text-slate-500">Employment status</label>
                            <select
                                className="w-48 p-2 border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-green-200"
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                            >
                                <option value="Current">Current</option>
                                <option value="Leave">On leave</option>
                            </select>

                            <div className="flex gap-2 mt-2">
                                <button
                                    className="text-white bg-green-700 border border-transparent hover:bg-green-800 focus:ring-4 focus:ring-green-200 font-medium rounded-full text-sm px-4 py-2.5 focus:outline-none"
                                    onClick={async () => {
                                        try {
                                            await updateTeacherStatusAPI(selectedTeacher._id, editStatus);
                                            fetchTeachers();
                                            setSelectedTeacher(null);
                                        } catch (err) {
                                            alert("Update failed!");
                                        }
                                    }}
                                >
                                    Save changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
