import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#0B1220] border-r border-gray-800">

      <div className="p-6">
        <h1 className="text-xl font-bold">
          Nexus PM
        </h1>
      </div>

      <nav className="px-4 space-y-2">

        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/projects"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800"
        >
          <FolderKanban size={18} />
          Projects
        </NavLink>

        <NavLink
          to="/tasks"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800"
        >
          <CheckSquare size={18} />
          Tasks
        </NavLink>

      </nav>

    </aside>
  );
}