import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../../app/globals.css";
import { UserProvider } from "../../../context/userContext";
import AdminSidebar from "@/components/AdminSidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Portal",
  description: "School Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`flex min-h-screen bg-slate-50 overflow-hidden ${inter.className}`}>
      {/* Fixed Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 p-8 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <UserProvider>{children}</UserProvider>
        </div>
      </main>
    </div>
  );
}