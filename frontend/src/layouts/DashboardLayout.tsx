import type { ReactNode }  from "react";
import Sidebar from "../components/dashboard/Sidebar";
interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  return (
    
    <div className="min-h-screen bg-[#070B1A] text-white flex">

      <Sidebar />

      <main className="flex-1 p-8">
        {children}
      </main>

    </div>
  
  );
} 