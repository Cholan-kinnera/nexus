import { useState, useEffect, useRef } from "react";
import axios from "axios";
import type { AxiosProgressEvent } from "axios";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Database, PlusCircle, CheckCircle2, Trash2, FileText, HardDrive, Loader2, Download, Image, FileSpreadsheet, FileArchive, File } from "lucide-react";
import { getFiles, uploadFile, deleteFile } from "../services/storageService";
import type { StorageFile } from "../services/storageService";
import { PremiumButton } from "../components/ui/PremiumButton";
import { PremiumCard } from "../components/ui/PremiumCard";
import { EmptyState } from "../components/ui/EmptyState";
 
export default function StoragePage() {
  const shouldReduceMotion = useReducedMotion();
  const [isSuccess, setIsSuccess] = useState(false);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 350, damping: 25 },
    },
  };
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const data = await getFiles();
      setFiles(data ?? []);
    } catch (err) {
      console.error("Failed to load files from storage vault:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch storage vault files synchronously on component mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFiles();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    const file = selectedFiles[0];

    // Front-end size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds the limit of 10 MB.");
      return;
    }

    // Front-end extension/type validation
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "pdf", "mp4", "zip", "docx", "xlsx"];
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.includes(fileExt)) {
      setUploadError(`File extension '.${fileExt}' is not supported. Allowed formats: ${allowedExtensions.join(", ")}`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    try {
      await uploadFile(file, (progressEvent: AxiosProgressEvent) => {
        const total = progressEvent.total || file.size;
        const current = progressEvent.loaded;
        const percentage = Math.round((current / total) * 100);
        setUploadProgress(percentage);
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      await loadFiles();
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { detail?: string } | undefined;
        setUploadError(responseData?.detail || "Upload failed. Check size constraints.");
      } else {
        setUploadError("Upload failed. Check size constraints.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileKey: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this file?")) return;
    try {
      await deleteFile(fileKey);
      await loadFiles();
    } catch (err: unknown) {
      console.error("Delete failed:", err);
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { detail?: string } | undefined;
        alert(responseData?.detail || "Failed to delete file.");
      } else {
        alert("Failed to delete file.");
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileType = (filename: string) => {
    const ext = filename.split(".").pop()?.toUpperCase() || "UNKNOWN";
    if (["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"].includes(ext)) {
      return `${ext} Image`;
    }
    if (ext === "PDF") return "PDF Document";
    if (ext === "ZIP") return "ZIP Archive";
    if (ext === "DOCX") return "DOCX Document";
    if (ext === "CSV") return "CSV Spreadsheet";
    if (ext === "XLSX") return "Excel Spreadsheet";
    return `${ext} File`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
      return <Image size={14} className="text-violet-400" />;
    }
    if (ext === "pdf" || ext === "txt" || ext === "docx") {
      return <FileText size={14} className="text-blue-400" />;
    }
    if (["xlsx", "csv", "xls"].includes(ext || "")) {
      return <FileSpreadsheet size={14} className="text-emerald-400" />;
    }
    if (ext === "zip") {
      return <FileArchive size={14} className="text-amber-400" />;
    }
    return <File size={14} className="text-zinc-500" />;
  };

  return (
    <DashboardLayout>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="relative flex justify-between items-center pb-2">
          {/* Ambient header glow */}
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="z-10 w-full max-w-5xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">
              Storage Vault
            </h1>
            <p className="text-zinc-300 mt-2 text-sm font-sans max-w-2xl leading-relaxed">
              Securely store and manage project deliverables, documents, and assets.
            </p>
          </div>

          {files.length > 0 && (
            <PremiumButton
              variant="primary"
              size="sm"
              onClick={handleUploadClick}
              isLoading={isUploading}
              leftIcon={<PlusCircle size={14} />}
            >
              Upload File
            </PremiumButton>
          )}
        </div>

        {/* Success / Error / Progress Banner */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400 text-xs font-mono flex items-center gap-2 shadow-md w-full max-w-md"
            >
              <CheckCircle2 size={14} />
              <span>Uploaded asset securely to Cloudflare R2.</span>
            </motion.div>
          )}
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-red-400 text-xs font-mono flex items-center gap-2 shadow-md w-full max-w-md"
            >
              <span>⚠️ {uploadError}</span>
            </motion.div>
          )}
          {isUploading && uploadProgress !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-md w-full max-w-md space-y-2"
            >
              <div className="flex items-center justify-between text-2xs font-mono text-zinc-455 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-violet-400" />
                  Uploading asset to Cloudflare R2...
                </span>
                <span className="font-bold text-zinc-200">{uploadProgress}%</span>
              </div>
              <div className="w-full h-1 bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 transition-all duration-155"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-3 animate-pulse-slow">
            <div className="h-10 bg-zinc-900/30 border border-zinc-800 rounded-xl shimmer-placeholder" />
            {[1, 2, 3, 4, 5].map((k) => (
              <div key={k} className="h-12 bg-zinc-900/20 border border-zinc-800/40 rounded-xl shimmer-placeholder" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            icon={Database}
            title="Storage vault is empty"
            description="Upload files here to securely host build artifacts, server database backups, and media assets in Cloudflare R2 storage."
            primaryActionLabel={isUploading ? "Uploading..." : "Upload New File"}
            onPrimaryAction={handleUploadClick}
            secondaryActionLabel="Refresh Vault"
            onSecondaryAction={loadFiles}
          />
        ) : (
          /* ── HIGH-FIDELITY ACTIVE STORAGE VAULT LIST ────────────────────── */
          <PremiumCard hoverable={false} padding="none">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-zinc-550" />
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Active Vault Directories</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {files.length} Secure Assets • Total Size: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/60 bg-zinc-950/10 text-[10px] font-mono uppercase tracking-wider text-zinc-500 select-none">
                    <th className="py-3 px-5">ID</th>
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-5">Type</th>
                    <th className="py-3 px-5">Size</th>
                    <th className="py-3 px-5">Last Transaction</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-zinc-800/40 text-xs"
                >
                  {files.map((file) => (
                    <motion.tr
                      variants={itemVariants}
                      key={file.file_key}
                      className="hover:bg-zinc-900/40 transition-colors duration-150"
                    >
                      <td className="py-3.5 px-5 font-mono text-zinc-500 text-[10px]">
                        FL-{file.file_key.substring(0, 6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-zinc-200">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.filename)}
                          <span className="truncate max-w-[320px] md:max-w-[480px]" title={file.filename}>{file.filename}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-455 font-mono text-[10px]">
                        {getFileType(file.filename)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-300 font-medium">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-455">
                        {file.updated_at.replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download file"
                            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 rounded-lg hover:bg-zinc-800/50 cursor-pointer inline-flex items-center justify-center"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            onClick={() => handleDelete(file.file_key)}
                            title="Delete file"
                            className="text-zinc-550 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer inline-flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </PremiumCard>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
