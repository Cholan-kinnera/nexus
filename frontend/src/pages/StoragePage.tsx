import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Database, PlusCircle, CheckCircle2, Trash2, FileText, HardDrive, Loader2, Download } from "lucide-react";
import { getFiles, uploadFile, deleteFile } from "../services/storageService";
import type { StorageFile } from "../services/storageService";

export default function StoragePage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
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
    loadFiles();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    const file = selectedFiles[0];

    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadFile(file);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      await loadFiles();
    } catch (err: any) {
      console.error("Upload failed:", err);
      setUploadError(err.response?.data?.detail || "Upload failed. Check size constraints.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileKey: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this file?")) return;
    try {
      await deleteFile(fileKey);
      await loadFiles();
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.detail || "Failed to delete file.");
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
            <h1 className="text-4xl font-bold text-zinc-100">
              Storage Vault
            </h1>
            <p className="text-zinc-300 mt-2 text-sm font-sans max-w-2xl leading-relaxed">
              Securely store and manage project deliverables, documents, and assets.
            </p>
          </div>

          {files.length > 0 && (
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              {isUploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <PlusCircle size={14} />
              )}
              <span>{isUploading ? "Uploading..." : "Upload File"}</span>
            </button>
          )}
        </div>

        {/* Success / Error Banner */}
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
        </AnimatePresence>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-violet-400 mb-4" />
            <p className="text-xs text-zinc-550 font-mono">Querying vault directories...</p>
          </div>
        ) : files.length === 0 ? (
          /* ── BEAUTIFUL EMPTY STATE ────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-12 py-20 bg-zinc-900/20 border border-dashed border-zinc-850 rounded-xl max-w-2xl mx-auto shadow-md"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800/80 flex items-center justify-center text-zinc-400 mb-6 shadow-inner">
              <Database size={22} className="text-zinc-550" />
            </div>

            <h3 className="text-lg font-bold text-zinc-200 mb-2">Storage vault is empty</h3>
            <p className="text-xs text-zinc-300 max-w-lg leading-relaxed mb-8">
              Upload files here to securely host build artifacts, server database backups, and media assets in Cloudflare R2 storage.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {isUploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <PlusCircle size={14} />
                )}
                <span>Upload New File</span>
              </button>
              <button
                onClick={loadFiles}
                className="px-4 py-2 border border-zinc-850 hover:border-zinc-700 text-zinc-450 hover:text-white rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Refresh Vault</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── HIGH-FIDELITY ACTIVE STORAGE VAULT LIST ────────────────────── */
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden shadow-md">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-zinc-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Active Vault Directories</h3>
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
                <tbody className="divide-y divide-zinc-800/40 text-xs">
                  {files.map((file, _idx) => (
                    <tr
                      key={file.file_key}
                      className="hover:bg-zinc-900/40 transition-colors duration-150"
                    >
                      <td className="py-3.5 px-5 font-mono text-zinc-500 text-[10px]">
                        FL-{file.file_key.substring(0, 6).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-zinc-200">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-zinc-500" />
                          <span className="truncate max-w-[200px]" title={file.filename}>{file.filename}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-450 font-mono text-[10px]">
                        {getFileType(file.filename)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-300 font-medium">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-450">
                        {file.updated_at.replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-3.5 px-5 text-right flex items-center justify-end gap-1.5 mt-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download file"
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-950 border border-transparent hover:border-zinc-800 transition-all inline-block"
                        >
                          <Download size={12} />
                        </a>
                        <button
                          onClick={() => handleDelete(file.file_key)}
                          className="p-1.5 text-zinc-550 hover:text-red-400 rounded-lg hover:bg-zinc-950 border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
