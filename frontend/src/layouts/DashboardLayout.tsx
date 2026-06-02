import type { ReactNode }  from "react";
import Sidebar from "../components/dashboard/Sidebar";
interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  return (
    
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex transition-colors duration-300">

      <Sidebar />

      <main className="flex-1 p-8">
        {children}
      </main>

    </div>
  
  );
} 