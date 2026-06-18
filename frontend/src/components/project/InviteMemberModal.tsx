import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ShieldAlert, ChevronDown, Check } from "lucide-react";
import { lookupUserByEmail, addProjectMember } from "../../services/projectMemberService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  currentUserRole: string;
  onSuccess: () => void;
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  projectId,
  currentUserRole,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("developer");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isOpen) return null;

  // Filter allowed roles based on current user's role in the project
  const isOwner = currentUserRole === "owner";
  const isManager = currentUserRole === "manager";
  const allowedRoles = isOwner
    ? [
      { value: "owner", label: "Owner" },
      { value: "manager", label: "Manager" },
      { value: "developer", label: "Developer" },
      { value: "viewer", label: "Viewer" },
    ]
    : isManager
      ? [
        { value: "developer", label: "Developer" },
        { value: "viewer", label: "Viewer" },
      ]
      : [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address (e.g. user@domain.com).");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. Resolve user ID by email
      const user = await lookupUserByEmail(email.trim());

      // 2. Add user to project
      await addProjectMember(projectId, user.id, role);

      // 3. Reset and call success handler
      setEmail("");
      setRole("developer");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setError(`No user found with email: ${email}`);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to invite member. Please verify email and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/15 dark:bg-black/70 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-zinc-900/90 backdrop-blur-lg border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl relative z-10 p-6 text-zinc-200"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            <X size={16} />
          </button>

          <h2 className="text-lg font-bold text-zinc-100 mb-2 flex items-center gap-2">
            <Mail size={18} className="text-zinc-400" />
            Invite Team Member
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            Enter the email address of the user you want to add to this project.
          </p>

          <form onSubmit={handleInvite} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg flex items-start gap-2.5 text-xs text-red-400 font-mono">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 focus:border-zinc-700 text-zinc-100 placeholder-zinc-650 outline-none transition duration-200 text-sm font-sans"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                Project Role
              </label>

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoading}
                className="w-full flex items-center justify-between bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 focus:border-zinc-700 text-zinc-300 outline-none transition duration-200 cursor-pointer text-xs font-mono text-left"
              >
                <span>{allowedRoles.find((r) => r.value === role)?.label || role}</span>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 left-0 right-0 mt-1 bg-zinc-900/90 border border-zinc-800 rounded-lg shadow-xl overflow-hidden backdrop-blur-lg"
                    >
                      <div className="py-1 max-h-60 overflow-y-auto">
                        {allowedRoles.map((r) => {
                          const isSelected = r.value === role;
                          return (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => {
                                setRole(r.value);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left transition-colors cursor-pointer ${isSelected
                                  ? "bg-zinc-800/10 dark:bg-zinc-850 text-zinc-100 font-semibold"
                                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-800/5 dark:hover:bg-zinc-800 hover:text-zinc-100 dark:hover:text-zinc-200"
                                }`}
                            >
                              <span>{r.label}</span>
                              {isSelected && <Check size={12} className="text-zinc-300" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-4 flex justify-end gap-3 font-mono">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-450 hover:text-zinc-100 rounded-lg text-2xs transition-colors cursor-pointer"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-zinc-100 hover:bg-zinc-100/90 dark:hover:bg-zinc-200 text-zinc-950 px-5 py-2 rounded-lg font-bold transition duration-200 text-2xs cursor-pointer disabled:opacity-50"
                disabled={isLoading || allowedRoles.length === 0}
              >
                {isLoading ? "Inviting..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
