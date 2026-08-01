'use client';

import React, { useState, useEffect } from "react";
import { Loader2, Search, Download, User, CheckCircle, MapPin, AlertCircle, BookOpen, UserPlus, ChevronLeft, ChevronRight, X, Plus, ArrowLeft, Key, Camera } from "lucide-react";
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

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        </div>
    );
}

export default function TeacherRegistryPage({ onSuccess }: { onSuccess?: () => void }): React.JSX.Element {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [editStatus, setEditStatus] = useState("Current");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [view, setView] = useState("list");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState("");

    const [formData, setFormData] = useState({
        personalInfo: { fullName: "", birthday: "", department: "Mathematics", nationality: "", gender: "Male", maritalStatus: "Single", photo: "" },
        contactAddress: { city: "", phoneNumber: "", email: "", kebele: "" },
        education: { completionLevel: "" },
        experience: "",
        emergencyContact: { fullName: "", city: "", phoneNumber: "", relationship: "" },
        salary: ""
    });
    
    const itemsPerPage = 10;

    const getAllTeachersAPI = async () => {
        const response = await Axios({
            method: summeryApi.getAllTeachers.method,
            url: summeryApi.getAllTeachers.url
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

    const downloadPDF = (data: any, credentials?: any) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Teacher Registration Details", 20, 20);
        doc.setFontSize(12);
        doc.text(`Full Name: ${data.personalInfo?.fullName || data.fullName || "N/A"}`, 20, 40);
        doc.text(`Employee ID: ${credentials?.employeeID || data.employeeID || data.teacherID || "N/A"}`, 20, 50);
        if (credentials?.password) {
            doc.text(`Generated Password: ${credentials.password}`, 20, 60);
        }
        doc.text(`Department: ${data.personalInfo?.department || data.department || "N/A"}`, 20, 70);
        doc.save(`${(data.personalInfo?.fullName || data.fullName || "teacher").replace(/\s+/g, "_")}_Details.pdf`);
    };

    const downloadSingleTeacherPDF = (teacher: any) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Teacher Profile Report", 20, 20);
        doc.setFontSize(12);
        doc.text(`Full Name: ${teacher.fullName || teacher.personalInfo?.fullName || "N/A"}`, 20, 40);
        doc.text(`Staff ID: ${teacher.employeeID || teacher.teacherID || "N/A"}`, 20, 50);
        doc.text(`Department: ${teacher.department || teacher.personalInfo?.department || "N/A"}`, 20, 60);
        doc.text(`Status: ${teacher.status || "Current"}`, 20, 70);
        doc.text(`Role: ${teacher.role || "Teacher"}`, 20, 80);
        
        if (teacher.emergencyContact) {
            doc.text(`Emergency Contact Name: ${teacher.emergencyContact.fullName || "N/A"}`, 20, 100);
            doc.text(`Emergency Contact Phone: ${teacher.emergencyContact.phoneNumber || "N/A"}`, 20, 110);
            doc.text(`Relationship: ${teacher.emergencyContact.relationship || "N/A"}`, 20, 120);
        }

        doc.save(`${(teacher.fullName || teacher.personalInfo?.fullName || "teacher").replace(/\s+/g, "_")}_Profile.pdf`);
    };

    const downloadTeacherListPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Teacher Registry", 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleDateString()} • ${filteredTeachers.length} record(s)`, 14, 25);

        const rows = filteredTeachers.map((teacher: any) => [
            teacher.employeeID || teacher.teacherID || "N/A",
            teacher.fullName || teacher.personalInfo?.fullName || "N/A",
            teacher.department || teacher.personalInfo?.department || "N/A",
            teacher.role || "Teacher",
            teacher.status || "Current",
        ]);

        autoTable(doc, {
            startY: 32,
            head: [["ID", "Name", "Department", "Role", "Status"]],
            body: rows,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [21, 128, 61] },
        });

        doc.save(`Teacher_Registry_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageError("");

        if (!file.type.startsWith("image/")) {
            setImageError("Please choose an image file.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setImageError("Image must be under 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setImagePreview(base64);
            setFormData((prev) => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, photo: base64 }
            }));
        };
        reader.onerror = () => setImageError("Couldn't read that image, please try again.");
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await Axios({ ...summeryApi.registerTeacher, data: formData });
            downloadPDF(formData, response.data?.credentials);
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Registration failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none transition placeholder:text-slate-400";
    const labelClass = "text-xs font-medium text-slate-500 mb-1.5 block";
    const required = <span className="text-red-500">*</span>;

    if (view === "register") {
        return (
            <div className="flex-1 bg-[#f8fafc] p-8 min-h-screen">
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Teacher registered</h2>
                            <p className="text-slate-500 mb-6 text-sm">Credentials have been downloaded as a PDF.</p>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setFormData({
                                        personalInfo: { fullName: "", birthday: "", department: "Mathematics", nationality: "", gender: "Male", maritalStatus: "Single", photo: "" },
                                        contactAddress: { city: "", phoneNumber: "", email: "", kebele: "" },
                                        education: { completionLevel: "" },
                                        experience: "",
                                        emergencyContact: { fullName: "", city: "", phoneNumber: "", relationship: "" },
                                        salary: ""
                                    });
                                    setImagePreview(null);
                                    setImageError("");
                                    setView("list");
                                    fetchTeachers();
                                    onSuccess?.();
                                }}
                                className="w-full bg-green-700 text-white py-2.5 rounded-xl font-medium hover:bg-green-800 transition"
                            >
                                Return to list
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => {
                        setImagePreview(null);
                        setImageError("");
                        setView("list");
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4 transition"
                >
                    <ArrowLeft size={16} /> Back to list
                </button>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Register teacher</h2>
                        <p className="text-sm text-slate-500 mt-1">Fill in the details below to add a new teacher.</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <SectionHeader icon={<User size={16} />} title="Personal information" />

                        <div className="flex items-center gap-4 mb-5">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Teacher photo preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={28} className="text-slate-400" />
                                    )}
                                </div>
                                <label
                                    htmlFor="teacherPhoto"
                                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center cursor-pointer hover:bg-green-800 transition"
                                >
                                    <Camera size={14} />
                                </label>
                                <input
                                    id="teacherPhoto"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Profile photo</p>
                                <p className="text-xs text-slate-400 mt-0.5">JPG or PNG, up to 2MB</p>
                                {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Full name {required}</label>
                                <input
                                    required
                                    placeholder="e.g. Abebe Kebede"
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, fullName: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Birthday {required}</label>
                                <input
                                    type="date"
                                    required
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, birthday: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Department</label>
                                <select
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, department: e.target.value } })}
                                >
                                    <option>Mathematics</option>
                                    <option>Physics</option>
                                    <option>History</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Nationality</label>
                                <input
                                    placeholder="e.g. Ethiopian"
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, nationality: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Gender</label>
                                <select
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, gender: e.target.value } })}
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Marital status</label>
                                <select
                                    className={inputClass}
                                    onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, maritalStatus: e.target.value } })}
                                >
                                    <option>Single</option>
                                    <option>Married</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <SectionHeader icon={<MapPin size={16} />} title="Contact" />
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>City</label>
                                    <input
                                        placeholder="e.g. Addis Ababa"
                                        className={inputClass}
                                        onChange={(e) => setFormData({ ...formData, contactAddress: { ...formData.contactAddress, city: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone</label>
                                    <input
                                        placeholder="09xx xxx xxx"
                                        className={inputClass}
                                        onChange={(e) => setFormData({ ...formData, contactAddress: { ...formData.contactAddress, phoneNumber: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input
                                        type="email"
                                        placeholder="name@school.edu"
                                        className={inputClass}
                                        onChange={(e) => setFormData({ ...formData, contactAddress: { ...formData.contactAddress, email: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Kebele</label>
                                    <input
                                        className={inputClass}
                                        onChange={(e) => setFormData({ ...formData, contactAddress: { ...formData.contactAddress, kebele: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <SectionHeader icon={<BookOpen size={16} />} title="Professional" />
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Education level</label>
                                    <input
                                        placeholder="e.g. BSc in Mathematics"
                                        className={inputClass}
                                        onChange={(e) => setFormData({ ...formData, education: { completionLevel: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Experience</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Years of teaching experience, previous schools..."
                                        className={inputClass}
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Salary (ETB) {required}</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        className={inputClass}
                                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <SectionHeader icon={<AlertCircle size={16} />} title="Emergency contact" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                placeholder="Full name"
                                className={inputClass}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, fullName: e.target.value } })}
                            />
                            <input
                                placeholder="City"
                                className={inputClass}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, city: e.target.value } })}
                            />
                            <input
                                placeholder="Phone"
                                className={inputClass}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phoneNumber: e.target.value } })}
                            />
                            <input
                                placeholder="Relationship"
                                className={inputClass}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })}
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-green-700 text-white py-3 rounded-xl hover:bg-green-800 disabled:opacity-60 transition flex items-center justify-center gap-2 font-medium"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                        {loading ? "Registering..." : "Register teacher"}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#f8fafc] p-8 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {filteredTeachers.length} {filteredTeachers.length === 1 ? "record" : "records"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={downloadTeacherListPDF}
                        disabled={filteredTeachers.length === 0}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download size={16} /> Download
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

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                            <button
                                onClick={() => downloadSingleTeacherPDF(selectedTeacher)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 transition"
                            >
                                <Download size={16} /> Download PDF
                            </button>
                            <button
                                onClick={() => setSelectedTeacher(null)}
                                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-100"
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