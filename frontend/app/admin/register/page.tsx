'use client';

import React from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import RegisterStudent from "@/components/admin/RegisterStudents";

export default function StandaloneRegisterPage(): React.JSX.Element {
    const router = useRouter();

    return (
        <AdminNav>
            <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center shrink-0">
                <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Student Profile Registration Gateway
                </h2>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <RegisterStudent 
                    onSuccess={() => {
                        // Redirects right to the unified dashboard upon form completion
                        router.push("/admin/dashboard");
                    }} 
                />
            </div>
        </AdminNav>
    );
}