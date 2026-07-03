'use client';

import React, { useState, useEffect } from "react";
import { Trash2, Edit3, Loader2 } from "lucide-react";
import { getAllStudentsAPI } from "@/services/adminApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

export default function StudentRegistry() {
    const [students, setStudents] = useState([]);
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

    const downloadPDF = () => {
        const doc = new jsPDF();
        const title = gradeFilter === "All" ? "All Students List" : `Students - ${gradeFilter}`;
        
        doc.text(title, 14, 15);
        
        // Prepare table data from filteredStudents (respects current search and filter)
        const tableData = filteredStudents.map((s: any, index: number) => [
            index + 1,
            s.studentID,
            s.fullName,
            s.gradeLevel,
            s.gender
        ]);
    
        autoTable(doc, {
            head: [['No.', 'Student ID', 'Full Name', 'Grade Level', 'Gender']],
            body: tableData,
            startY: 20,
        });
    
        doc.save(`Student_List_${gradeFilter.replace(/\s+/g, '_')}.pdf`);
    };

    // FIXED: Filter logic uses strict matching instead of 'includes("12")'
    const filteredStudents = Array.isArray(students) 
        ? students.filter((s: any) => {
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

    return (
        <div className="flex-1 bg-[#f8fafc] p-8">
            <div className="flex-1 bg-[#f8fafc] p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Students List</h1>
                    <button 
                        onClick={downloadPDF}
                        className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm hover:bg-green-800"
                    >
                        Download PDF
                    </button>
                </div>
                </div>
            
            
            
            <div className="flex gap-4 mb-6 justify-end">
                <input 
                    placeholder="Search by Student ID..."
                    className="p-2 border rounded-xl border-gray-300 hover:border-green-800 text-sm outline-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select className="p-2 border rounded-xl border-gray-300 hover:border-green-800 text-sm outline-0" onChange={(e) => setGradeFilter(e.target.value)}>
                    <option value="All">All Grades</option>
                    {/* Make sure the value matches your database string EXACTLY */}
                    <option value="12th Grade">12th Grade</option>
                    <option value="11th Grade">11th Grade</option>
                    <option value="10th Grade">10th Grade</option>
                    <option value="9th Grade">9th Grade</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>
            ) : (
                <> 
                <table className="w-full text-left text-sm border border-gray-300 rounded-xl overflow-hidden">
                    <thead className="bg-gray-50 text-gray-600"><tr>
                        <th className="px-6 py-4 font-semibold">No.</th>
                        <th className="px-6 py-4 font-semibold">Student ID</th>
                        <th className="px-6 py-4 font-semibold">Full Name</th>
                        <th className="px-6 py-4 font-semibold">Grade Level</th>
                        <th className="px-6 py-4 font-semibold">Gender</th>
                        <th className="px-6 py-4">Action</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedStudents.map((student: any, index: number) => (
                        <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-gray-700">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="px-6 py-4 text-gray-700">{student.studentID}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{student.fullName}</td>
                            <td className="px-6 py-4 text-gray-600">{student.gradeLevel || "N/A"}</td>
                            <td className="px-6 py-4 text-gray-600">{student.gender || "N/A"}</td>
                            <td 
                                className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer"
                                onClick={() => setSelectedStudent(student)}
                            >
                                View
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                                    

                    <div className="flex justify-end items-center mt-6 gap-2 text-sm">
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(p => p - 1)} 
                            className="px-4 py-2 bg-white border rounded disabled:opacity-50 border-gray-500"
                        >
                            Previous
                        </button>
                        <button 
                            disabled={currentPage >= totalPages} 
                            onClick={() => setCurrentPage(p => p + 1)} 
                            className="px-4 py-2 bg-white border rounded disabled:opacity-50 border-gray-500"
                        >
                            Next
                        </button>
                        <span>Page {currentPage} of {totalPages || 1}</span>
                    </div>
                </>
            )}

            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold mb-6">Student Details</h2>
                        
                        {/* Flex container to hold text details and photos */}
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Left Column: Text Details */}
                            <div className="flex-1 space-y-3 text-sm">
                                <p><strong>Full Name:</strong> {selectedStudent.fullName}</p>
                                <p><strong>Student ID:</strong> {selectedStudent.studentID}</p>
                                <p><strong>Grade Level:</strong> {selectedStudent.gradeLevel}</p>
                                <p><strong>Gender:</strong> {selectedStudent.gender}</p>
                                <p><strong>Email:</strong> {selectedStudent.user?.email || "N/A"}</p>
                                
                                <hr className="my-4" />
                                
                                <h3 className="font-semibold text-base">Emergency Contact</h3>
                                <p><strong>Father's Name:</strong> {selectedStudent.familyProfile?.fullName || "N/A"}</p>
                                <p><strong>Phone:</strong> {selectedStudent.familyProfile?.phoneNumber || "N/A"}</p>
                                <p><strong>Address:</strong> {selectedStudent.familyProfile?.address || "N/A"}</p>
                            </div>

                            {/* Right Column: Photos */}
                            <div className="flex flex-col gap-4 items-center">
                                <div className="text-center">
                                    <p className="text-xs font-semibold mb-1">Student</p>
                                    <img 
                                        src={selectedStudent.studentPhoto || "/placeholder-student.jpg"} 
                                        alt="Student" 
                                        className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-semibold mb-1">Parent</p>
                                    <img 
                                        src={selectedStudent.parentPhoto || "/placeholder-parent.jpg"} 
                                        alt="Parent" 
                                        className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            className="mt-8 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
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