import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getProjectMembers,
  updateProjectMemberRole,
  removeProjectMember,
} from "../../services/projectMemberService";
import type { ProjectMemberResponse } from "../../services/projectMemberService";
import { UserMinus, UserPlus, ShieldAlert, Check, ChevronDown } from "lucide-react";
import InviteMemberModal from "./InviteMemberModal";

interface Props {
  projectId: number;
}

export default function MembersTab({ projectId }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<ProjectMemberResponse[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("viewer");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [activeDropdownUserId, setActiveDropdownUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getProjectMembers(projectId);
      setMembers(data);

      // Determine current user's role in this project
      const me = data.find((m) => m.email === user?.email);
      if (me) {
        setCurrentUserRole(me.role);
      } else {
        // Fallback or legacy owner check
        setCurrentUserRole("viewer");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load project members.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleRoleChange = async (targetUserId: number, newRole: string) => {
    try {
      setError("");
      await updateProjectMemberRole(projectId, targetUserId, newRole);
      showSuccess("Member role updated successfully");
      loadMembers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to update role");
    }
  };

  const handleRemove = async (targetUserId: number) => {
    if (!window.confirm("Are you sure you want to remove this member from the project?")) {
      return;
    }
    try {
      setError("");
      await removeProjectMember(projectId, targetUserId);
      showSuccess("Member removed successfully");
      loadMembers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to remove member");
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "?";
  };

  // RBAC Permission checks
  const canManage = currentUserRole === "owner" || currentUserRole === "manager";

  // Helper to determine if a member's role can be updated by the current user
  const canUpdateRoleOf = (member: ProjectMemberResponse) => {
    if (!canManage) return false;
    if (member.role === "owner") return false; // Nobody can demote/edit an owner (except owners can transfer, handled differently)
    if (currentUserRole === "manager" && member.role === "manager") return false; // Managers cannot modify other managers
    return true;
  };

  // Helper to determine if a member can be removed by the current user
  const canRemoveMember = (member: ProjectMemberResponse) => {
    if (!canManage) return false;
    if (member.role === "owner") return false;
    if (currentUserRole === "manager" && member.role === "manager") return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg flex items-start gap-2.5 text-xs text-red-400 font-mono">
          <ShieldAlert size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-lg flex items-start gap-2.5 text-xs text-emerald-400 font-mono">
          <Check size={14} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-zinc-200">Project Members</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Manage roles and project workspace permissions.
          </p>
        </div>

        {/* Invite Button - Disabled for Dev/Viewer */}
        <div
          title={!canManage ? "Requires Manager or Owner permissions" : ""}
          className="relative inline-block"
        >
          <button
            onClick={() => setIsInviteOpen(true)}
            disabled={!canManage}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 px-4 py-2 rounded-lg font-semibold transition duration-200 cursor-pointer disabled:cursor-not-allowed text-xs font-mono"
          >
            <UserPlus size={14} />
            Invite Member
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-card">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs">
            <span className="inline-block animate-pulse">Fetching members list...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-mono text-zinc-500 uppercase tracking-wider bg-zinc-850">
                <th className="py-3 px-6 font-semibold">User</th>
                <th className="py-3 px-6 font-semibold">Project Role</th>
                <th className="py-3 px-6 font-semibold">Joined At</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {members.map((member) => {
                const isMe = member.email === user?.email;
                const displayName = isMe
                  ? `${member.full_name || "Unknown User"} (You)`
                  : member.full_name || "Unknown User";

                const allowedRoleOptions = currentUserRole === "owner"
                  ? ["owner", "manager", "developer", "viewer"]
                  : currentUserRole === "manager"
                    ? ["developer", "viewer"]
                    : [];

                const editable = canUpdateRoleOf(member);
                const removable = canRemoveMember(member);

                return (
                  <tr key={member.id} className="hover:bg-zinc-850 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs select-none shadow-inner">
                        {getInitials(member.full_name, member.email)}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-200 font-sans">{displayName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{member.email}</div>
                      </div>
                    </td>

                    {/* Role badge or dropdown */}
                    <td className="py-3 px-6">
                      <div
                        title={!editable ? (member.role === "owner" ? "The project owner role cannot be demoted" : "Requires Manager or Owner permissions") : ""}
                        className="relative inline-block"
                      >
                        {editable ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setActiveDropdownUserId(activeDropdownUserId === member.user_id ? null : member.user_id)}
                              className="flex items-center gap-1.5 bg-zinc-850 border border-zinc-800 hover:bg-zinc-800 text-zinc-100 rounded px-2.5 py-1 text-2xs outline-none font-mono cursor-pointer transition-colors text-left"
                            >
                              <span>{member.role.toUpperCase()}</span>
                              <ChevronDown size={10} className={`text-zinc-500 transition-transform duration-200 ${activeDropdownUserId === member.user_id ? "rotate-180" : ""}`} />
                            </button>

                            {activeDropdownUserId === member.user_id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setActiveDropdownUserId(null)}
                                />
                                <div className="absolute z-50 left-0 mt-1 min-w-[120px] bg-zinc-900/95 border border-zinc-800 rounded-lg shadow-xl overflow-hidden backdrop-blur-lg">
                                  <div className="py-1">
                                    {allowedRoleOptions.map((roleOpt) => {
                                      const isSelected = roleOpt === member.role;
                                      return (
                                        <button
                                          key={roleOpt}
                                          type="button"
                                          onClick={() => {
                                            handleRoleChange(member.user_id, roleOpt);
                                            setActiveDropdownUserId(null);
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-mono text-left transition-colors cursor-pointer ${isSelected
                                              ? "bg-zinc-850 text-zinc-100 font-semibold"
                                              : "text-zinc-550 hover:bg-zinc-850 hover:text-zinc-100"
                                            }`}
                                        >
                                          <span>{roleOpt.toUpperCase()}</span>
                                          {isSelected && <Check size={10} className="text-zinc-300" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="inline-block bg-zinc-850 border border-zinc-800 text-zinc-500 rounded px-2.5 py-1 text-2xs font-mono select-none">
                            {member.role.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Accent colored dot for quick visual reference next to role */}
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ml-2 border border-current ${member.role === "owner" ? "text-violet-400" :
                          member.role === "manager" ? "text-blue-400" :
                            member.role === "developer" ? "text-emerald-400" : "text-zinc-500"
                        }`} />
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-6 font-mono text-[10px] text-zinc-500">
                      {new Date(member.joined_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-6 text-right">
                      <div
                        title={!removable ? (member.role === "owner" ? "The project owner cannot be removed" : "Requires Manager or Owner permissions") : ""}
                        className="inline-block"
                      >
                        <button
                          onClick={() => handleRemove(member.user_id)}
                          disabled={!removable}
                          className="text-red-400 hover:text-red-500/80 disabled:text-zinc-650 font-semibold font-mono text-[10px] transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <UserMinus size={12} />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        projectId={projectId}
        currentUserRole={currentUserRole}
        onSuccess={loadMembers}
      />
    </div>
  );
}
