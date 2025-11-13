"use client";

import { motion } from "framer-motion";
import { FaChartLine, FaFilter, FaDownload } from "react-icons/fa";

export default function ActivityPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-inheritx-display text-slate-100">
            Platform Activity
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Monitor all platform transactions and events
          </p>
        </div>
        <motion.button
          className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaDownload />
          Export
        </motion.button>
      </div>

      <div className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-inheritx-display uppercase tracking-widest text-slate-100">
            Activity Log
          </h2>
          <motion.button
            className="rounded-lg border border-slate-800/70 bg-slate-900/50 p-2 text-slate-400 transition-colors hover:bg-slate-800/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaFilter />
          </motion.button>
        </div>

        <div className="flex h-64 items-center justify-center text-slate-500">
          <div className="text-center">
            <FaChartLine className="mx-auto mb-4 text-4xl text-slate-700" />
            <p>No activity data available</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

