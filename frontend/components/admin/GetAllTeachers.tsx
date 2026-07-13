'use client';

import React, { useState, useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { getAllTeachersAPI } from "@/services/adminApi"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TeacherRegistrationForm from "./RegisterTeachers";

interface TeacherProps {
    onEditTeacher?: (target: any) => void;
    onViewDepartment?: (dept: any) => void;
}

export default function TeacherRegistry({onEditTeacher, onViewDepartment}: TeacherProps) {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [view, setView] = useState("list"); 
    const itemsPerPage = 10;

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const response = await getAllTeachersAPI();
            // Handle variations in API response structure
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

    // Robust filter that looks at both flat and nested properties
    const filteredTeachers = teachers.filter((t: any) => {
        const fullName = t.fullName || t.personalInfo?.fullName || "";
        const id = t.employeeID || t.teacherID || "";
        return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               id.toString().toLowerCase().includes(searchQuery.toLowerCase());
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
            t.contactAddress?.email || t.email || "N/A"
        ]);
        autoTable(doc, {
            head: [['No.', 'Teacher ID', 'Full Name', 'Subject', 'Email']],
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
                    <ArrowLeft size={20} /> Back to List
                </button>
                <div className="max-w-4xl mx-auto">
                    <TeacherRegistrationForm onSuccess={() => {
                        fetchTeachers(); // Refresh list immediately
                        setView("list"); // Switch view
                    }} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#f8fafc] p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Teachers List</h1>
                <div className="flex gap-2">
                    <button onClick={downloadPDF} className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm hover:bg-green-800">Download PDF</button>
                    <button onClick={() => setView("register")} className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm hover:bg-green-800">Register New</button>
                </div>
            </div>

            <div className="flex gap-4 mb-6 justify-end">
                <input 
                    placeholder="Search by Name or ID..."
                    className="p-2 border rounded-xl border-gray-300 w-64 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>
            ) : (
                <>
                    <table className="w-full text-left text-sm border border-gray-300 rounded-xl overflow-hidden">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-4">No.</th>
                                <th className="px-6 py-4">Teacher ID</th>
                                <th className="px-6 py-4">Full Name</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedTeachers.map((teacher: any, index: number) => (
                                <tr key={teacher._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="px-6 py-4">{teacher.employeeID || teacher.teacherID || "N/A"}</td>
                                    <td className="px-6 py-4 font-medium">{teacher.fullName || teacher.personalInfo?.fullName}</td>
                                    <td className="px-6 py-4">{teacher.department || teacher.personalInfo?.department || "N/A"}</td>
                                    <td 
                                        className="px-6 py-4 text-blue-600 font-medium cursor-pointer underline" 
                                        onClick={() => setSelectedTeacher(teacher)}
                                    >View</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end items-center mt-6 gap-2 text-sm">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white border rounded disabled:opacity-50">Previous</button>
                        <span>Page {currentPage} of {totalPages || 1}</span>
                        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white border rounded disabled:opacity-50">Next</button>
                    </div>
                </>
            )}

            {selectedTeacher && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Teacher Details</h2>
                        <div className="space-y-3 text-sm">
                            <p><strong>Full Name:</strong> {selectedTeacher.fullName || selectedTeacher.personalInfo?.fullName}</p>
                            <p><strong>Teacher ID:</strong> {selectedTeacher.employeeID || selectedTeacher.teacherID}</p>
                            <p><strong>Gender:</strong> {selectedTeacher.gender || selectedTeacher.personalInfo?.gender}</p>
                            <p><strong>Phone Number:</strong> {selectedTeacher.phoneNumber || selectedTeacher.contactAddress?.phoneNumber}</p>
                            <p><strong>Kebele:</strong> {selectedTeacher.kebele || selectedTeacher.contactAddress?.kebele}</p>
                            <p><strong>Experience:</strong> {selectedTeacher.experience || selectedTeacher?.experience}</p>
                            <p><strong>Department:</strong> {selectedTeacher.department || selectedTeacher.personalInfo?.department}</p>

                            <p className="border-b border-gray-300"></p>

                            <p className="text-lg font-semibold">Emergency Contact</p>
                            <p><strong>Full Name:</strong> {selectedTeacher.fullName || selectedTeacher.emergencyContact?.fullName}</p>
                            <p><strong>Phone Number:</strong> {selectedTeacher.phoneNumber || selectedTeacher.emergencyContact?.phoneNumber}</p>
                            <p><strong>Relationship:</strong> {selectedTeacher.relationship || selectedTeacher.emergencyContact?.relationship}</p>
                            
                        </div>
                        <button className="mt-8 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-xl" onClick={() => setSelectedTeacher(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}