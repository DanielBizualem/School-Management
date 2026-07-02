'use client';

import React, { useState, useEffect } from "react";
import { Search, Trash2, Edit3, Loader2 } from "lucide-react";
import { getAllStudentsAPI } from "@/services/adminApi"; 

export default function StudentRegistry() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const response = await getAllStudentsAPI();
                // Assumes your API returns { success: true, data: [...] }
                setStudents(response.data.data); 
            } catch (error) {
                console.error("Failed to fetch students:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = Array.isArray(students) 
    ? students.filter((s: any) => 
        s.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      ) 
    : [];

    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="flex-1 bg-[#f8fafc] p-8">
            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>
            ) : (
                <table className="w-full">
                    {/* Map through paginatedStudents here */}
                    {paginatedStudents.map((student: any) => (
                        <tr key={student._id}>
                            <td>{student.fullName}</td>
                            <td>{student.email}</td>
                            <td>{student.classCode}</td>
                        </tr>
                    ))}
                </table>
            )}
        </div>
    );
}