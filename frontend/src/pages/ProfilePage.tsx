import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { getMe, updateProfile, updateAvatar } from "../services/profileService";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, Camera, UploadCloud, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  
  // Form and validation states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Status and loading states
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Avatar file selection preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync state from context user
    if (user) {
      setDisplayName(user.full_name || "");
      setEmail(user.email || "");
      setRole(user.role || "Team Member");
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

  // Sync state from active endpoint load on mount to be robust
  useEffect(() => {
    const loadFreshProfile = async () => {
      try {
        const freshUser = await getMe();
        setDisplayName(freshUser.full_name || "");
        setAvatarUrl(freshUser.avatar_url || null);
        setRole(freshUser.role || "Team Member");
        // Sync context
        updateUser({
          full_name: freshUser.full_name,
          avatar_url: freshUser.avatar_url,
          role: freshUser.role
        });
      } catch (err) {
        console.error("Failed to load fresh user profile", err);
      }
    };
    loadFreshProfile();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayName(val);
    if (nameError) setNameError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setNameError(null);

    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameError("Display name cannot be empty.");
      return;
    }

    setIsProfileSaving(true);
    try {
      const updated = await updateProfile({ name: trimmed });
      // Update global context user state
      updateUser({
        full_name: updated.full_name,
      });
      setProfileMessage({ type: "success", text: "Profile details updated successfully!" });
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Failed to update profile details. Please try again.";
      setProfileMessage({ type: "error", text: errMsg });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    // 1. Validate extension / format (png, jpg, jpeg, webp)
    const allowedExtensions = ["png", "jpg", "jpeg", "webp"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.includes(ext)) {
      setAvatarMessage({
        type: "error",
        text: `Invalid file extension .${ext}. Only png, jpg, jpeg, and webp are allowed.`,
      });
      return;
    }

    // 2. Validate MIME type
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      setAvatarMessage({
        type: "error",
        text: "Unsupported file type. Please upload a valid image (PNG, JPG, or WEBP).",
      });
      return;
    }

    // 3. Validate size boundary (max 5 MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setAvatarMessage({
        type: "error",
        text: "File is too large. Maximum size allowed is 5.0 MB.",
      });
      return;
    }

    setSelectedFile(file);
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setAvatarMessage(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;
    setIsAvatarUploading(true);
    setAvatarMessage(null);

    try {
      const result = await updateAvatar(selectedFile);
      setAvatarUrl(result.avatar_url);
      updateUser({
        avatar_url: result.avatar_url,
      });
      setAvatarMessage({ type: "success", text: "Avatar uploaded successfully!" });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Avatar upload failed. Please try again.";
      setAvatarMessage({ type: "error", text: errMsg });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    return nameStr
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-zinc-950 text-zinc-150 p-6 md:p-10 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Top header introduction */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">USER PROFILE</h1>
            <p className="text-xs text-zinc-400 mt-1">Manage your public credentials, display details, and profile avatar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Display Card & Photo Upload preview */}
            <div className="md:col-span-1 space-y-6">
              {/* Profile Overview Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden backdrop-blur-lg">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-600 to-indigo-600" />
                
                {/* Big Avatar view */}
                <div className="relative group cursor-pointer w-24 h-24 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-2xl text-zinc-400 select-none shadow-md overflow-hidden mb-4 mt-2">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(displayName)
                  )}
                  <div 
                    onClick={triggerFileInput}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera size={20} className="text-zinc-200" />
                  </div>
                </div>

                <h3 className="font-bold text-base text-zinc-100 font-mono truncate max-w-full">
                  {displayName || "Unnamed User"}
                </h3>
                <p className="text-2xs font-semibold text-violet-500 uppercase tracking-widest mt-1 flex items-center gap-1 font-mono">
                  <Shield size={12} />
                  {role}
                </p>
                <p className="text-xs text-zinc-500 mt-2 truncate max-w-full">
                  {email}
                </p>
              </div>

              {/* Quick instructions or guidelines card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-md">
                <h4 className="font-bold text-xs text-zinc-300 font-mono uppercase tracking-wider">Avatar Specifications</h4>
                <ul className="text-2xs text-zinc-400 space-y-1.5 list-disc list-inside">
                  <li>Supported Formats: PNG, JPG, WEBP</li>
                  <li>Maximum File Size: 5.0 MB</li>
                  <li>Old avatars are deleted automatically upon uploading a new one</li>
                </ul>
              </div>
            </div>

            {/* Column 2: Edit Forms and Upload Dropzone */}
            <div className="md:col-span-2 space-y-6">
              {/* Profile Details Form */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-lg">
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono border-b border-zinc-800 pb-3 mb-6">
                  Account Details
                </h3>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <AnimatePresence mode="wait">
                    {profileMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs ${
                          profileMessage.type === "success"
                            ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                            : "bg-red-950/20 border-red-800/40 text-red-400"
                        }`}
                      >
                        {profileMessage.type === "success" ? (
                          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        )}
                        <span>{profileMessage.text}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input
                        type="text"
                        value={displayName}
                        onChange={handleNameChange}
                        className={`w-full bg-zinc-950 border ${
                          nameError ? "border-red-800/80 focus:border-red-700" : "border-zinc-800 focus:border-zinc-700"
                        } rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-200 outline-none transition-colors placeholder-zinc-650`}
                        placeholder="Enter display name"
                      />
                    </div>
                    {nameError && (
                      <p className="text-[10px] text-red-500 font-sans">{nameError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Email Address (Read Only)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-650" size={16} />
                      <input
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className="w-full bg-zinc-950/40 border border-zinc-850 rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-500 outline-none cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isProfileSaving}
                      className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 text-white text-xs font-semibold font-mono tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isProfileSaving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Profile"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Avatar Upload Container */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-lg">
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono border-b border-zinc-800 pb-3 mb-6">
                  Change Profile Photo
                </h3>

                <div className="space-y-5">
                  <AnimatePresence mode="wait">
                    {avatarMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs ${
                          avatarMessage.type === "success"
                            ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                            : "bg-red-950/20 border-red-800/40 text-red-400"
                        }`}
                      >
                        {avatarMessage.type === "success" ? (
                          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        )}
                        <span>{avatarMessage.text}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/80 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 relative"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".png,.jpg,.jpeg,.webp"
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="relative w-20 h-20 rounded-full border border-zinc-800 overflow-hidden shadow-inner select-none">
                        <img src={previewUrl} alt="Selected preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-400">
                        <UploadCloud size={22} />
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-zinc-350">
                        {selectedFile ? selectedFile.name : "Drag & Drop avatar photo here"}
                      </p>
                      <p className="text-3xs text-zinc-500 mt-1 uppercase tracking-wider font-mono">
                        {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "or click to browse local files"}
                      </p>
                    </div>
                  </div>

                  {/* Upload Actions */}
                  {selectedFile && (
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          setAvatarMessage(null);
                        }}
                        className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold font-mono tracking-wide transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadAvatar}
                        disabled={isAvatarUploading}
                        className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 text-white text-xs font-semibold font-mono tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isAvatarUploading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Upload Avatar"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
