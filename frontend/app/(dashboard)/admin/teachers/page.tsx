'use client';

import React, { useState, useEffect } from "react";
import { Loader2, Search, Download, ChevronLeft, ChevronRight, X, Plus, ArrowLeft, Key } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Axios from "@/utils/Axios";
import summeryApi from "@/common/summeryApi";

const DEPT_PALETTE = [
    { bg: "bg-blue-50", text: "text-blue-700", avatar: "bg-blue-100 text-blue-700" },
    { bg: "bg-purple-50", text: "text-purple-700", avatar: "bg-purple-100 text-purple-700" },
    { bg: "bg-orange-50", text: "text-orange-700", avatar: "bg-orange-100 text-orange-700" },
    { bg: "bg-teal-50", text: "text-teal-700", avatar: "bg-teal-100 text-teal-700" },
    { bg: "bg-pink-50", text: "text-pink-700", avatar: "bg-pink-100 text-pink-700" },
    { bg: "bg-indigo-50", text: "text-indigo-700", avatar: "bg-indigo-100 text-indigo-700" },
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isLeave ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLeave ? "bg-amber-500" : "bg-emerald-500"}`} />
            {isLeave ? "On leave" : "Current"}
        </span>
    );
}

function RoleBadge({ role }: { role: string }) {
    const isDirector = role === "Director";
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isDirector ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-700"}`}>
            {role || "Teacher"}
        </span>
    );
}

export default function TeacherRegistryPage(): React.JSX.Element {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [editStatus, setEditStatus] = useState("Current");
    const [updatingStatus, setUpdatingStatus] = useState(false);
    
    // State for assigning an additional role
    const [additionalRole, setAdditionalRole] = useState("Director");
    const [generatedCredentials, setGeneratedCredentials] = useState<{ newID: string; tempPass: string } | null>(null);

    const [view, setView] = useState("list");

    const [formData, setFormData] = useState({
        fullName: "",
        teacherID: "",
        department: "",
        status: "Current",
        role: "Teacher",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const itemsPerPage = 10;

    const getAllTeachersAPI = async () => {
        const response = await Axios({
            method: summeryApi.getAllTeachers.method,
            url: summeryApi.getAllTeachers.url
        });
        return response.data;
    };

    const updateTeacherStatusAPI = async (teacherId: string, status: string) => {
        const response = await Axios({
            method: summeryApi.updateTeacher?.method || "PUT",
            url: summeryApi.updateTeacher?.url || "/api/teacher/update-status",
            data: { teacherId, status }
        });
        return response.data;
    };

    const addRoleAPI = async (teacherId: string, newRole: string) => {
        const response = await Axios({
            method: summeryApi.assignSecondaryRole?.method || "POST",
            url: summeryApi.assignSecondaryRole?.url || "/api/teacher/add-role",
            data: { teacherId, newRole }
        });
        return response.data;
    };

    const registerTeacherAPI = async (payload: any) => {
        const response = await Axios({
            method: summeryApi.registerTeacher.method,
            url: summeryApi.registerTeacher.url,
            data: payload
        });
        return response.data;
    };

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
        if (selectedTeacher) {
            setEditStatus(selectedTeacher.status || "Current");
            setGeneratedCredentials(null);
        }
    }, [selectedTeacher]);

    const filteredTeachers = Array.isArray(teachers)
        ? teachers.filter((t: any) => {
            const fullName = t.fullName || t.personalInfo?.fullName || "";
            const teacherId = t.employeeID || t.teacherID || "";
            const teacherStatus = t.status || "Current";

            const matchesStatus = statusFilter === "All" || teacherStatus === statusFilter;
            const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  teacherId.toString().toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
          })
        : [];

    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
    const paginatedTeachers = filteredTeachers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const downloadPDF = () => {
        const doc = new jsPDF();
        const title = statusFilter === "All" ? "All Teachers List" : `Teachers - ${statusFilter}`;

        doc.text(title, 14, 15);

        const tableData = filteredTeachers.map((t: any, index: number) => [
            index + 1,
            t.employeeID || t.teacherID || "N/A",
            t.fullName || t.personalInfo?.fullName || "N/A",
            t.department || t.personalInfo?.department || "N/A",
            t.role || "Teacher",
            t.status || "Current",
        ]);

        autoTable(doc, {
            head: [["No.", "Teacher ID", "Full Name", "Department", "Role", "Status"]],
            body: tableData,
            startY: 20,
        });

        doc.save(`Teachers_List_${statusFilter.replace(/\s+/g, "_")}.pdf`);
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await registerTeacherAPI({
                fullName: formData.fullName,
                teacherID: formData.teacherID,
                department: formData.department,
                status: formData.status,
                role: formData.role,
                emergencyContact: {
                    fullName: formData.emergencyContactName,
                    phoneNumber: formData.emergencyContactPhone,
                    relationship: formData.emergencyContactRelationship
                }
            });
            setFormData({
                fullName: "",
                teacherID: "",
                department: "",
                status: "Current",
                role: "Teacher",
                emergencyContactName: "",
                emergencyContactPhone: "",
                emergencyContactRelationship: ""
            });
            fetchTeachers();
            setView("list");
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Failed to register teacher.");
        } finally {
            setSubmitting(false);
        }
    };

    if (view === "register") {
        return (
            <div className="flex-1 bg-[#f8fafc] p-8 min-h-screen">
                <button
                    onClick={() => setView("list")}
                    className="flex items-center gap-2 mb-6 text-slate-600 hover:text-black font-medium"
                >
                    <ArrowLeft size={20} /> Back to list
                </button>
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Register New Staff</h2>
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-slate-500 bg-white"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Teacher ID / Employee ID</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-slate-500 bg-white"
                                    value={formData.teacherID}
                                    onChange={(e) => setFormData({ ...formData, teacherID: e.target.value })}
                                    placeholder="TCH-001"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-slate-500 bg-white"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="Computer Science"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                                <select
                                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-slate-500 bg-white text-slate-700"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="Teacher">Teacher</option>
                                    <option value="Director">Director</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                                <select
                                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-slate-500 bg-white text-slate-700"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Current">Current</option>
                                    <option value="Leave">On leave</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-sm font-semibold text-slate-800 mb-3">Emergency Contact</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-slate-500 bg-white"
                                        value={formData.emergencyContactName}
                                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-slate-500 bg-white"
                                        value={formData.emergencyContactPhone}
                                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                        placeholder="+123456789"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-slate-500 bg-white"
                                        value={formData.emergencyContactRelationship}
                                        onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                                        placeholder="Spouse"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                type="button"
                                onClick={() => setView("list")}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                            >
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                Save Staff
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#f8fafc] p-8 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Teachers & Directors</h1>
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
                        className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-slate-800"
                    >
                        <Plus size={16} /> Register new
                    </button>
                </div>
            </div>

            <div className="flex gap-3 mb-6 justify-end">
                <div className="relative flex-1 max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search by name or ID"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-gray-400 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="p-2 border border-slate-300 rounded-xl text-sm outline-none w-40 text-slate-700 focus:border-gray-400 bg-white"
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
                    <p className="text-slate-500 text-sm">No records match your search.</p>
                </div>
            ) : (
                <>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-12">No.</th>
                                    <th className="px-6 py-3 font-medium">Staff Member</th>
                                    <th className="px-6 py-3 font-medium">ID</th>
                                    <th className="px-6 py-3 font-medium">Department</th>
                                    <th className="px-6 py-3 font-medium">Role</th>
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
                                    const role = teacher.role || "Teacher";
                                    const style = getDeptStyle(dept);

                                    return (
                                        <tr key={teacher._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3.5 text-slate-400">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-slate-800">{name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 font-mono text-slate-500 text-xs">
                                                {id}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                                                    {dept}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <RoleBadge role={role} />
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <StatusBadge status={status} />
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <button
                                                    className="border px-3 py-1 rounded-xl border-gray-300 font-medium hover:bg-slate-50"
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
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedTeacher(null)}
                            className="absolute top-6 right-6 p-1 hover:bg-slate-100 rounded-full transition"
                            aria-label="Close"
                        >
                            <X size={24} className="text-slate-500" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${getDeptStyle(selectedTeacher.department || selectedTeacher.personalInfo?.department).avatar}`}>
                                {getInitials(selectedTeacher.fullName || selectedTeacher.personalInfo?.fullName)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {selectedTeacher.fullName || selectedTeacher.personalInfo?.fullName}
                                </h2>
                                <div className="flex gap-2 mt-1">
                                    <StatusBadge status={selectedTeacher.status || "Current"} />
                                    <RoleBadge role={selectedTeacher.role || "Teacher"} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-3 text-sm">
                                <p className="text-base font-semibold border-b border-slate-200 pb-2 text-slate-800">
                                    Profile info
                                </p>
                                <p>
                                    <span className="text-slate-500">Staff ID: </span>
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

                        {/* Section to Edit Status (Current or Leave) */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Update Status</h3>
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                                    <select
                                        className="w-full p-2 border border-slate-300 rounded-xl bg-white text-sm outline-none text-slate-700"
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                    >
                                        <option value="Current">Current</option>
                                        <option value="Leave">On leave</option>
                                    </select>
                                </div>
                                <button
                                    disabled={updatingStatus}
                                    className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-slate-800 shrink-0 disabled:opacity-50 flex items-center gap-2"
                                    onClick={async () => {
                                        try {
                                            setUpdatingStatus(true);
                                            const teacherId = selectedTeacher._id || selectedTeacher.id;
                                            await updateTeacherStatusAPI(teacherId, editStatus);
                                            
                                            // Update local state smoothly
                                            setSelectedTeacher((prev: any) => ({ ...prev, status: editStatus }));
                                            await fetchTeachers();
                                        } catch (err) {
                                            console.error("Failed to update status:", err);
                                            alert("Failed to update status.");
                                        } finally {
                                            setUpdatingStatus(false);
                                        }
                                    }}
                                >
                                    {updatingStatus && <Loader2 size={16} className="animate-spin" />}
                                    Save Status
                                </button>
                            </div>
                        </div>

                        {/* Section to Assign New Role with New ID/Password */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
                            <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                                <Key size={16} className="text-slate-600" /> Assign Additional Role (Generate New Credentials)
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">
                                This creates a separate login ID and password for the secondary role without deleting the user's current account.
                            </p>

                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Select Role to Add</label>
                                    <select
                                        className="w-full p-2 border border-slate-300 rounded-xl bg-white text-sm outline-none text-slate-700"
                                        value={additionalRole}
                                        onChange={(e) => setAdditionalRole(e.target.value)}
                                    >
                                        <option value="Director">Director</option>
                                        <option value="Teacher">Teacher</option>
                                    </select>
                                </div>
                                <button
                                    className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-slate-800 shrink-0"
                                    onClick={async () => {
                                        try {
                                            const teacherId = selectedTeacher._id || selectedTeacher.id;
                                            const res = await addRoleAPI(teacherId, additionalRole);
                                            setGeneratedCredentials({
                                                newID: res?.newID || res?.data?.newID || "DIR-" + Math.floor(1000 + Math.random() * 9000),
                                                tempPass: res?.tempPass || res?.data?.tempPass || "Pass@1234"
                                            });
                                            fetchTeachers();
                                        } catch (err) {
                                            alert("Failed to generate credentials for the new role.");
                                        }
                                    }}
                                >
                                    Generate Credentials
                                </button>
                            </div>

                            {generatedCredentials && (
                                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                                    <p className="font-semibold">Successfully generated new role credentials:</p>
                                    <p><span className="font-medium">New ID:</span> {generatedCredentials.newID}</p>
                                    <p><span className="font-medium">Temp Password:</span> {generatedCredentials.tempPass}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedTeacher(null)}
                                className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-slate-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}