'use client';

import React, { useState, useEffect } from "react";
import { Loader2, Search, Download, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getAllStudentsAPI } from "@/services/adminApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UXStudentRecord } from "@/types/uxAdmin";

interface StudentProps {
    students: UXStudentRecord[];
    onEnrollClick: (target: any) => void;
    onViewParent: (parent: any) => void;
}

// Consistent color assignment per grade level, so the same grade always
// gets the same tag + avatar color without a hardcoded lookup table.
const GRADE_PALETTE = [
    { bg: "bg-blue-50", text: "text-blue-700", avatar: "bg-blue-100 text-blue-700" },
    { bg: "bg-purple-50", text: "text-purple-700", avatar: "bg-purple-100 text-purple-700" },
    { bg: "bg-orange-50", text: "text-orange-700", avatar: "bg-orange-100 text-orange-700" },
    { bg: "bg-teal-50", text: "text-teal-700", avatar: "bg-teal-100 text-teal-700" },
    { bg: "bg-pink-50", text: "text-pink-700", avatar: "bg-pink-100 text-pink-700" },
    { bg: "bg-indigo-50", text: "text-indigo-700", avatar: "bg-indigo-100 text-indigo-700" },
];

function getGradeStyle(grade: string) {
    if (!grade) return GRADE_PALETTE[0];
    let hash = 0;
    for (let i = 0; i < grade.length; i++) hash = grade.charCodeAt(i) + ((hash << 5) - hash);
    return GRADE_PALETTE[Math.abs(hash) % GRADE_PALETTE.length];
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

export default function StudentRegistry({ students, onEnrollClick, onViewParent }: StudentProps) {
    const [student, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [gradeFilter, setGradeFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const response = await getAllStudentsAPI();
                // Ensure we are working with the array of students
                setStudents(response.data || response);
            } catch (error) {
                console.error("Failed to fetch students:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    // Filter logic uses strict grade matching instead of "includes"
    const filteredStudents = Array.isArray(student)
        ? student.filter((s: any) => {
              const matchesGrade = gradeFilter === "All" || s.gradeLevel === gradeFilter;
              const matchesSearch = s.studentID?.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesGrade && matchesSearch;
          })
        : [];

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const downloadPDF = () => {
        const doc = new jsPDF();
        const title = gradeFilter === "All" ? "All Students List" : `Students - ${gradeFilter}`;

        doc.text(title, 14, 15);

        const tableData = filteredStudents.map((s: any, index: number) => [
            index + 1,
            s.studentID,
            s.fullName,
            s.gradeLevel,
            s.gender,
        ]);

        autoTable(doc, {
            head: [["No.", "Student ID", "Full Name", "Grade Level", "Gender"]],
            body: tableData,
            startY: 20,
        });

        doc.save(`Student_List_${gradeFilter.replace(/\s+/g, "_")}.pdf`);
    };

    return (
        <div className="flex-1 bg-[#f8fafc] p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Students</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {filteredStudents.length} {filteredStudents.length === 1 ? "record" : "records"}
                    </p>
                </div>
                <button
                    onClick={downloadPDF}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                    <Download size={16} /> Download PDF
                </button>
            </div>

            <div className="flex gap-3 mb-6 justify-end">
                <div className="relative flex-1 max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        placeholder="Search by student ID"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-gray-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="p-2 border border-slate-300 rounded-xl text-sm outline-none w-40 text-slate-700 focus:border-gray-400"
                    onChange={(e) => setGradeFilter(e.target.value)}
                >
                    <option value="All">All grades</option>
                    <option value="12th Grade">12th grade</option>
                    <option value="11th Grade">11th grade</option>
                    <option value="10th Grade">10th grade</option>
                    <option value="9th Grade">9th grade</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="animate-spin text-slate-400" />
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500 text-sm">No students match your search.</p>
                </div>
            ) : (
                <>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-12">No.</th>
                                    <th className="px-6 py-3 font-medium">Student</th>
                                    <th className="px-6 py-3 font-medium">Student ID</th>
                                    <th className="px-6 py-3 font-medium">Grade level</th>
                                    <th className="px-6 py-3 font-medium">Gender</th>
                                    <th className="px-6 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedStudents.map((s: any, index: number) => {
                                    const style = getGradeStyle(s.gradeLevel);
                                    return (
                                        <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3.5 text-slate-400">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    
                                                    <span className="font-medium text-slate-800">{s.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 font-mono text-slate-500 text-xs">
                                                {s.studentID}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span
                                                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium`}
                                                >
                                                    {s.gradeLevel || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">{s.gender || "N/A"}</td>
                                            <td className="px-6 py-3.5 text-right">
                                                <button
                                                    className="border px-3 py-1 rounded-xl border-gray-300 font-medium"
                                                    onClick={() => setSelectedStudent(s)}
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

            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="absolute top-6 right-6 p-1 hover:bg-slate-100 rounded-full transition"
                            aria-label="Close"
                        >
                            <X size={24} className="text-slate-500" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${
                                    getGradeStyle(selectedStudent.gradeLevel).avatar
                                }`}
                            >
                                {getInitials(selectedStudent.fullName)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedStudent.fullName}</h2>
                                <span
                                    className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        getGradeStyle(selectedStudent.gradeLevel).bg
                                    } ${getGradeStyle(selectedStudent.gradeLevel).text}`}
                                >
                                    {selectedStudent.gradeLevel || "N/A"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-3 text-sm">
                                <p className="text-base font-semibold border-b border-slate-200 pb-2 text-slate-800">
                                    Student info
                                </p>
                                <p>
                                    <span className="text-slate-500">Student ID: </span>
                                    <span className="font-mono text-slate-700">{selectedStudent.studentID}</span>
                                </p>
                                <p>
                                    <span className="text-slate-500">Gender: </span>
                                    {selectedStudent.gender}
                                </p>
                                <p>
                                    <span className="text-slate-500">Email: </span>
                                    {selectedStudent.user?.email || "N/A"}
                                </p>

                                <p className="text-base font-semibold border-b border-slate-200 pb-2 pt-4 text-slate-800">
                                    Emergency contact
                                </p>
                                <p>
                                    <span className="text-slate-500">Father's name: </span>
                                    {selectedStudent.familyProfile?.fullName || "N/A"}
                                </p>
                                <p>
                                    <span className="text-slate-500">Phone: </span>
                                    {selectedStudent.familyProfile?.phoneNumber || "N/A"}
                                </p>
                                <p>
                                    <span className="text-slate-500">Address: </span>
                                    {selectedStudent.familyProfile?.address || "N/A"}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 items-center">
                                <div className="text-center">
                                    <p className="text-xs font-semibold mb-1 text-slate-500">Student</p>
                                    <img
                                        src={selectedStudent.studentPhoto || "/placeholder-student.jpg"}
                                        alt="Student"
                                        className="w-32 h-32 rounded-lg object-cover border border-slate-200"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-semibold mb-1 text-slate-500">Parent</p>
                                    <img
                                        src={selectedStudent.parentPhoto || "/placeholder-parent.jpg"}
                                        alt="Parent"
                                        className="w-32 h-32 rounded-lg object-cover border border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            className="mt-8 w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                            onClick={() => setSelectedStudent(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
