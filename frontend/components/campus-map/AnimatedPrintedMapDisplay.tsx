"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, RotateCw, ZoomIn, ZoomOut, X } from "lucide-react";
import { DetailedPrintedMap } from "./DetailedPrintedMap";

interface AnimatedPrintedMapDisplayProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export function AnimatedPrintedMapDisplay({
  isVisible = true,
  onClose,
}: AnimatedPrintedMapDisplayProps) {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isRotating, setIsRotating] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Auto-rotate animation
  useEffect(() => {
    if (!isRotating) return;
    let angle = 0;
    const interval = setInterval(() => {
      angle = (angle + 0.5) % 360;
      setRotation(angle);
    }, 30);
    return () => clearInterval(interval);
  }, [isRotating]);

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setIsRotating(false);
  };

  const handlePan = (dx: number, dy: number) => {
    setPanX((prev) => prev + dx);
    setPanY((prev) => prev + dy);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-30"
          onClick={() => onClose?.()}
        >
          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-[95vw] h-[95vh] max-w-6xl max-h-5xl rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Map Container */}
            <div className="relative w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
              <motion.div
                animate={{ rotate: rotation, x: panX, y: panY }}
                transition={{ duration: 0.05, ease: "linear" }}
                className="w-full h-full flex items-center justify-center"
                style={{ transformOrigin: "center" }}
              >
                <motion.div
                  animate={{ scale: zoom }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <DetailedPrintedMap />
                </motion.div>
              </motion.div>

              {/* Grid Overlay Pattern */}
              <div className="absolute inset-0 pointer-events-none opacity-5">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            </div>

            {/* Title Bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent backdrop-blur-md border-b border-white/10 px-6 py-4 z-10"
            >
              <div>
                <h2 className="text-2xl font-bold text-white">SNS College Campus Map</h2>
                <p className="text-sm text-white/70">Interactive printed campus layout</p>
              </div>
            </motion.div>

            {/* Controls Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent backdrop-blur-md border-t border-white/10 px-6 py-4 z-10"
            >
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur">
                  <button
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                    className="p-1.5 hover:bg-white/20 rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-white" />
                  </button>

                  <div className="w-14 bg-white/20 rounded flex items-center justify-center text-white text-xs font-mono font-bold">
                    {zoom.toFixed(1)}x
                  </div>

                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                    className="p-1.5 hover:bg-white/20 rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Pan Controls */}
                <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur">
                  <button
                    onClick={() => handlePan(-30, 0)}
                    className="p-1.5 hover:bg-white/20 rounded transition-colors"
                    title="Pan Left"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => handlePan(0, -30)}
                    className="p-1.5 hover:bg-white/20 rounded transition-colors"
                    title="Pan Up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handlePan(0, 30)}
                    className="p-1.5 hover:bg-white/20 rounded transition-colors"
                    title="Pan Down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handlePan(30, 0)}
                    className="p-1.5 hover:bg-white/20 rounded transition-colors"
                    title="Pan Right"
                  >
                    →
                  </button>
                </div>

                {/* Rotation Control */}
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className={`p-2 rounded-lg transition-all backdrop-blur ${
                    isRotating
                      ? "bg-blue-500/60 hover:bg-blue-600/60"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  title={isRotating ? "Stop Rotating" : "Auto Rotate"}
                >
                  <RotateCw className={`w-4 h-4 text-white ${isRotating ? "animate-spin" : ""}`} />
                </button>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur"
                  title="Reset View"
                >
                  <MapPin className="w-4 h-4 text-white" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => onClose?.()}
                  className="ml-auto p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition-colors backdrop-blur"
                  title="Close Map"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>

            {/* Zoom Indicator */}
            {zoom > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-24 right-6 text-white text-sm bg-black/50 px-3 py-2 rounded-lg backdrop-blur-md"
              >
                Zoom: {(zoom * 100).toFixed(0)}%
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
