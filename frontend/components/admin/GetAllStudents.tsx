'use client';

import React, { useState } from "react";
import { Search, Trash2, Edit3 } from "lucide-react";

interface StudentRecord {
    id: string;
    name: string;
    address: string;
    classCode: string;
    dob: string;
    phone: string;
    initialsBg: string;
}

export default function StudentRegistry(): React.JSX.Element {
    const [students] = useState<StudentRecord[]>([
        { id: "01", name: "Eleanor Pena", address: "TA-107 Newyork", classCode: "01", dob: "02/05/2001", phone: "+123 6988567", initialsBg: "bg-amber-100 text-amber-700" },
        { id: "10", name: "Jessia Rose", address: "TA-107 Newyork", classCode: "02", dob: "03/04/2000", phone: "+123 8988569", initialsBg: "bg-teal-100 text-teal-700" },
        { id: "04", name: "Jenny Wilson", address: "Australia, Sydney", classCode: "01", dob: "12/05/2001", phone: "+123 7988566", initialsBg: "bg-rose-100 text-rose-700" },
        { id: "03", name: "Guy Hawkins", address: "Australia, Sydney", classCode: "02", dob: "03/05/2001", phone: "+123 5988565", initialsBg: "bg-orange-100 text-orange-700" },
        { id: "15", name: "Jacob Jones", address: "Australia, Sydney", classCode: "04", dob: "12/05/2001", phone: "+123 9988568", initialsBg: "bg-sky-100 text-sky-700" }
    ]);

    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(["10"]); 
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.includes(searchQuery)
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleSelectRow = (id: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex-1 bg-[#f8fafc] overflow-y-auto w-full">
            <main className="p-8 max-w-[1400px] mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 gap-4">
                        <h2 className="text-sm font-bold text-slate-900">Students Information</h2>
                        <div className="relative w-full sm:w-64">
                            <input 
                                type="text" 
                                placeholder="Search by ID or name"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-300 transition"
                            />
                            <Search size={14} className="absolute right-3 top-2.5 text-purple-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-700">
                                    <th className="py-4 px-5 w-12 text-center"></th>
                                    <th className="py-4 px-4 font-bold">Students Name</th>
                                    <th className="py-4 px-4 font-bold">Address</th>
                                    <th className="py-4 px-4 font-bold">Class</th>
                                    <th className="py-4 px-4 font-bold">Date of Birth</th>
                                    <th className="py-4 px-4 font-bold">Phone</th>
                                    <th className="py-4 px-5 text-right font-bold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                                {paginatedStudents.map((student) => (
                                    <tr key={student.id} className={`transition-colors ${selectedStudentIds.includes(student.id) ? "bg-purple-50/40" : ""}`}>
                                        <td className="py-3.5 px-5 text-center">
                                            <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleSelectRow(student.id)} className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer" />
                                        </td>
                                        <td className="py-3.5 px-4 flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${student.initialsBg}`}>{student.name.charAt(0)}</div>
                                            {student.name}
                                        </td>
                                        <td className="py-3.5 px-4">{student.address}</td>
                                        <td className="py-3.5 px-4">{student.classCode}</td>
                                        <td className="py-3.5 px-4 text-slate-400">{student.dob}</td>
                                        <td className="py-3.5 px-4">{student.phone}</td>
                                        <td className="py-3.5 px-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-1.5 text-slate-400 hover:text-slate-600"><Trash2 size={14} /></button>
                                                <button className="p-1.5 text-slate-400 hover:text-purple-600"><Edit3 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION CONTROLS */}
                    <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between text-4xs font-semibold text-slate-400 uppercase">
                        <span>Showing {paginatedStudents.length} of {filteredStudents.length} entries</span>
                        <div className="flex items-center gap-1">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-2xs disabled:opacity-50"
                            >Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-2.5 py-1 rounded-md shadow-2xs ${currentPage === i + 1 ? "bg-purple-600 text-white" : "bg-white border border-slate-200"}`}
                                >{i + 1}</button>
                            ))}
                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-2xs disabled:opacity-50"
                            >Next</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}