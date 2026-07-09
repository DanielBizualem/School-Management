'use client';

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getAllTeachersAPI } from "@/services/adminApi"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TeacherRegistrationForm from "./RegisterTeachers";

interface TeacherProps {
    onEditTeacher?: (target: any) => void;
    onViewDepartment?: (dept: any) => void;
}

export default function TeacherRegistry({onEditTeacher,onViewDepartment}:TeacherProps) {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false); // NEW STATE
    const itemsPerPage = 10;

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const response = await getAllTeachersAPI();
            setTeachers(response.data || response); 
        } catch (error) {
            console.error("Failed to fetch teachers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text("Teachers List", 14, 15);
        
        const tableData = filteredTeachers.map((t: any, index: number) => [
            index + 1,
            t.teacherID || "N/A",
            t.fullName,
            t.subject || "N/A",
            t.email || "N/A"
        ]);
    
        autoTable(doc, {
            head: [['No.', 'Teacher ID', 'Full Name', 'Subject', 'Email']],
            body: tableData,
            startY: 20,
        });
    
        doc.save("Teachers_List.pdf");
    };

    const filteredTeachers = teachers.filter((t: any) => 
        t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.teacherID?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
    const paginatedTeachers = filteredTeachers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="flex-1 bg-[#f8fafc] p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Teachers List</h1>
                <div className="flex gap-2">
                    <button onClick={downloadPDF} className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm hover:bg-green-800">
                        Download PDF
                    </button>
                    {/* TRIGGER FOR REGISTER MODAL */}
                    <button 
                        onClick={() => setIsRegisterOpen(true)}
                        className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm hover:bg-green-800"
                    >
                        Register New
                    </button>
                </div>
            </div>

            {/* REGISTER MODAL */}
            {isRegisterOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl relative">
                       
                        <TeacherRegistrationForm onSuccess={() => {
                            setIsRegisterOpen(false);
                            fetchTeachers(); // Refresh list after success
                        }} />
                        <button className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-xl" onClick={() => setIsRegisterOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}

            <div className="flex gap-4 mb-6 justify-end">
                <input 
                    placeholder="Search by Name or ID..."
                    className="p-2 border rounded-xl border-gray-300 hover:border-green-800 text-sm outline-0 w-64"
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
                                <th className="px-6 py-4 font-semibold">No.</th>
                                <th className="px-6 py-4 font-semibold">Teacher ID</th>
                                <th className="px-6 py-4 font-semibold">Full Name</th>
                                <th className="px-6 py-4 font-semibold">Subject</th>
                                <th className="px-6 py-4 font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedTeachers.map((teacher: any, index: number) => (
                                <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="px-6 py-4">{teacher.employeeID || "N/A"}</td>
                                    <td className="px-6 py-4 font-medium">{teacher.fullName}</td>
                                    <td className="px-6 py-4">{teacher.department || "N/A"}</td>
                                    <td 
                                        className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer"
                                        onClick={() => setSelectedTeacher(teacher)}
                                    >
                                        View
                                    </td>
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
                            <p><strong>Full Name:</strong> {selectedTeacher.fullName}</p>
                            <p><strong>Teacher ID:</strong> {selectedTeacher.employeeID}</p>
                            <p><strong>Subject:</strong> {selectedTeacher.department}</p>
                            
                            <p><strong>Phone:</strong> {selectedTeacher.phoneNumber || "N/A"}</p>
                            <p><strong>Salary:</strong> {selectedTeacher.salary || "N/A"} ETB</p>
                            <p><strong>Role:</strong> {selectedTeacher.role || "N/A"}</p>
                        </div>
                        <button className="mt-8 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-xl" onClick={() => setSelectedTeacher(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}