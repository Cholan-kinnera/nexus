import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Database, PlusCircle, ArrowUpRight, CheckCircle2, Trash2, FileText, HardDrive } from "lucide-react";

export default function StoragePage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [files, setFiles] = useState<any[]>([
    { id: "FL-802", name: "workspace_mesh.glb", size: "12.4 MB", type: "3D Model", updated: "2026-06-03 14:23:10" },
    { id: "FL-904", name: "database_snapshot_prod.sql", size: "45.8 MB", type: "SQL Database", updated: "2026-06-03 12:00:00" },
    { id: "FL-301", name: "nexus_pm_architecture.pdf", size: "2.1 MB", type: "PDF Document", updated: "2026-06-02 09:15:33" }
  ]);

  const handleUpload = () => {
    const newFile = {
      id: `FL-${Math.floor(100 + Math.random() * 900)}`,
      name: `upload_artifact_${Math.floor(10 + Math.random() * 90)}.zip`,
      size: "8.5 MB",
      type: "ZIP Archive",
      updated: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setFiles((prev) => [newFile, ...prev]);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter(f => f.id !== id));
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2">
          <div>
            <h1 className="text-4xl font-bold text-zinc-100">
              Storage Vault
            </h1>
            <p className="text-zinc-400 mt-2 text-sm font-sans">
              Securely store and manage project deliverables, documents, and assets.
            </p>
          </div>
          
          {files.length > 0 && (
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <PlusCircle size={14} />
              <span>Upload File</span>
            </button>
          )}
        </div>

        {/* Success Banner */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400 text-xs font-mono flex items-center gap-2 shadow-md w-full max-w-md"
            >
              <CheckCircle2 size={14} />
              <span>Uploaded asset securely (AES-256 encrypted).</span>
            </motion.div>
          )}
        </AnimatePresence>

        {files.length === 0 ? (
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
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-8">
              Connect an AWS S3 bucket or upload files here to securely host build artifacts, server database backups, and media assets.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <PlusCircle size={14} />
                <span>Upload New File</span>
              </button>
              <button
                className="px-4 py-2 border border-zinc-850 hover:border-zinc-700 text-zinc-450 hover:text-white rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Connect S3 Bucket</span>
                <ArrowUpRight size={12} />
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── HIGH-FIDELITY ACTIVE STORAGE VAULT LIST ────────────────────── */
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden shadow-md">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-zinc-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Active Vault Directories</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {files.length} Secure Assets • Total Size: 60.3 MB
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
                  {files.map((file) => (
                    <tr 
                      key={file.id} 
                      className="hover:bg-zinc-900/40 transition-colors duration-150"
                    >
                      <td className="py-3.5 px-5 font-mono text-zinc-500 text-[10px]">
                        {file.id}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-zinc-200">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-zinc-500" />
                          <span>{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-450 font-mono text-[10px]">
                        {file.type}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-300 font-medium">
                        {file.size}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-450">
                        {file.updated}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-950 border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
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
