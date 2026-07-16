import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../../app/globals.css";
import Sidebar from "@/components/Sidebar";
//import { UserProvider } from '@/context/UserContext';
import { UserProvider } from "../../../context/userContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduManager Dashboard",
  description: "School Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
        <div className="flex min-h-screen bg-slate-50">
          {/* Fixed Sidebar */}
          <Sidebar />
          
          {/* Main Content Area */}
          {/* ml-64 corresponds to the width of the Sidebar (w-64) */}
          <main className="flex-1 p-8 h-screen overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <UserProvider>{children}</UserProvider>
            </div>
          </main>
        </div>
      
  );
}