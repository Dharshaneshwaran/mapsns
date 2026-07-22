"use client";

import { motion } from "framer-motion";
import { DetailedPrintedMap } from "./DetailedPrintedMap";

/**
 * Displays the full SNS printed campus map covering the entire background
 * behind the 3D interactive map view.
 */
export function BackgroundPrintedMap() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="absolute inset-0 z-0 w-full h-full overflow-hidden"
    >
      {/* Full-Screen Printed Campus Map - Primary Layer */}
      <div className="absolute inset-0 w-full h-full">
        <DetailedPrintedMap />
      </div>

      {/* Overlay for map contrast and clarity */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

      {/* Subtle glow animation */}
      <motion.div
        animate={{
          opacity: [0.01, 0.05, 0.01],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-b from-blue-500/3 via-transparent to-purple-500/3 pointer-events-none"
      />

      {/* Top fade for HUD readability */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

      {/* Bottom fade for HUD readability */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {/* Left side fade */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

      {/* Right side fade */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
    </motion.div>
  );
}
