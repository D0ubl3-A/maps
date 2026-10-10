import React, { useState } from 'react';
import {
  Download,
  Box,
  FileCode,
  FileJson,
  CheckCircle2,
  X,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Layers,
  Camera,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  exportSceneToGltf,
  exportSceneToObj,
  exportVegasSceneJson
} from './mapExporter';

interface MapExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene?: any; // THREE.Scene
  onDeleteApiKey?: () => void;
  hasCustomKey?: boolean;
  onSwitchToOfflineEngine?: () => void;
  isOfflineActive?: boolean;
}

export const MapExportModal: React.FC<MapExportModalProps> = ({
  isOpen,
  onClose,
  scene,
  onDeleteApiKey,
  hasCustomKey = false,
  onSwitchToOfflineEngine,
  isOfflineActive = false
}) => {
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [keyDeleted, setKeyDeleted] = useState<boolean>(false);

  const showToast = (filename: string) => {
    setDownloadSuccessToast(`Exported "${filename}" successfully!`);
    setTimeout(() => {
      setDownloadSuccessToast(null);
    }, 4500);
  };

  const handleExportGltf = async () => {
    setIsExporting(true);
    try {
      const res = await exportSceneToGltf(scene, false);
      showToast(res.filename);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportObj = () => {
    setIsExporting(true);
    try {
      const res = exportSceneToObj(scene);
      showToast(res.filename);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    setIsExporting(true);
    try {
      const res = exportVegasSceneJson(scene);
      showToast(res.filename);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteKey = () => {
    if (onDeleteApiKey) {
      onDeleteApiKey();
      setKeyDeleted(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md pointer-events-auto select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0f1117] text-white border border-amber-400/40 shadow-[0_10px_50px_rgba(0,0,0,0.9)] p-5 sm:p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.4)]">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Export 3D Las Vegas Map File
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                  GTA READY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Download the 3D map to keep forever and safely delete your API key
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Guidance Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-slate-200 text-xs space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-cyan-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>How Map Capture & API Key Deletion Works</span>
          </div>
          <p className="text-[11.5px] text-slate-300">
            Google Maps Photorealistic 3D Tiles are streamed live over the web and Google's Terms of Service do not allow scraping or downloading raw Google mesh tiles.
            <strong> But you don't need the Google API key to keep your map!</strong>
          </p>
          <p className="text-[11.5px] text-slate-300">
            We have captured and generated a complete <strong>3D Las Vegas Strip environment</strong> (Las Vegas Blvd, sidewalks, Luxor pyramid & sky beam, The Sphere, Bellagio Resort & fountains, Caesars Palace, The STRAT Tower, traffic, and the 3D Jesus character model). You can export it below as a standard 3D file for <strong>Blender, Godot, Unity, or Unreal Engine</strong>, and switch to our <strong>100% Offline 3D Engine</strong> with zero API keys required!
          </p>
        </div>

        {/* Export Formats Grid */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
            Select 3D Export Format
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Format 1: glTF 2.0 */}
            <button
              onClick={handleExportGltf}
              disabled={isExporting}
              className="p-3 rounded-2xl bg-white/5 hover:bg-amber-500/15 border border-white/15 hover:border-amber-400 text-left transition-all cursor-pointer group flex flex-col justify-between h-32 active:scale-95"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Box className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Recommended
                  </span>
                </div>
                <div className="font-bold text-xs text-white group-hover:text-amber-300 mt-2">
                  glTF 2.0 (.gltf)
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                  Full 3D meshes, materials & landmarks for Godot, Blender, Unity, Three.js
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <Download className="w-3 h-3" />
                <span>Export .GLTF</span>
              </div>
            </button>

            {/* Format 2: OBJ */}
            <button
              onClick={handleExportObj}
              disabled={isExporting}
              className="p-3 rounded-2xl bg-white/5 hover:bg-cyan-500/15 border border-white/15 hover:border-cyan-400 text-left transition-all cursor-pointer group flex flex-col justify-between h-32 active:scale-95"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Standard 3D
                  </span>
                </div>
                <div className="font-bold text-xs text-white group-hover:text-cyan-300 mt-2">
                  Wavefront (.obj)
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                  Universal 3D geometry file supported by every 3D modeling software
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                <Download className="w-3 h-3" />
                <span>Export .OBJ</span>
              </div>
            </button>

            {/* Format 3: JSON Scene Data */}
            <button
              onClick={handleExportJson}
              disabled={isExporting}
              className="p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/15 border border-white/15 hover:border-emerald-400 text-left transition-all cursor-pointer group flex flex-col justify-between h-32 active:scale-95"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Game Data
                  </span>
                </div>
                <div className="font-bold text-xs text-white group-hover:text-emerald-300 mt-2">
                  Vegas Data (.json)
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                  Scene graph + GPS bounds (lat/lng), landmark locations & road nodes
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <Download className="w-3 h-3" />
                <span>Export .JSON</span>
              </div>
            </button>
          </div>
        </div>

        {/* API Key Management & Offline Mode Section */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="font-bold text-xs text-white">
                Offline Independence Status
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {isOfflineActive ? 'OFFLINE ENGINE ACTIVE' : 'HYBRID READY'}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Ready to delete your Google Maps API key? You can run the built-in 3D Vegas Strip game completely offline, or clear any custom key you stored.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {onSwitchToOfflineEngine && (
              <button
                onClick={() => {
                  onSwitchToOfflineEngine();
                  onClose();
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs cursor-pointer hover:from-amber-400 hover:to-yellow-400 transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-950/50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Switch to 100% Offline 3D Vegas Engine</span>
              </button>
            )}

            {onDeleteApiKey && (
              <button
                onClick={handleDeleteKey}
                className="py-2 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 border border-rose-400/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete & Revoke Custom API Key</span>
              </button>
            )}
          </div>

          {keyDeleted && (
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Your custom API key has been cleared from local storage! The app is now using the offline 3D engine / demo key safely.</span>
            </div>
          )}
        </div>

        {/* Success Toast Banner */}
        <AnimatePresence>
          {downloadSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">{downloadSuccessToast} Check your browser downloads folder!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
