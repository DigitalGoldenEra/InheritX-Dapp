"use client";

import { motion } from "framer-motion";
import { FaGavel, FaSearch, FaClock, FaCheckCircle } from "react-icons/fa";

const disputes = [
  {
    id: "DISP-001",
    title: "Inheritance plan dispute",
    status: "Open",
    priority: "High",
    created: "2 days ago",
    parties: ["User A", "User B"],
  },
  {
    id: "DISP-002",
    title: "Asset distribution conflict",
    status: "In Review",
    priority: "Medium",
    created: "5 days ago",
    parties: ["User C", "User D"],
  },
];

export default function DisputesPage() {
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
            Dispute Resolution
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Manage and resolve platform disputes
          </p>
        </div>
        <motion.button
          className="rounded-lg bg-[#33C5E0] px-6 py-3 text-sm font-semibold text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Create Dispute
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search disputes by ID, title, or parties..."
            className="w-full rounded-lg border border-slate-800/70 bg-slate-900/50 py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
          />
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.map((dispute, index) => (
          <motion.div
            key={dispute.id}
            className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01, borderColor: "rgba(51, 197, 224, 0.3)" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-100">
                    {dispute.title}
                  </h3>
                  <span className="rounded-full bg-[#33C5E0]/20 px-3 py-1 text-xs font-semibold text-[#33C5E0]">
                    {dispute.status}
                  </span>
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
                    {dispute.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  ID: {dispute.id} • Created {dispute.created}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Parties: {dispute.parties.join(", ")}
                </p>
              </div>
              <motion.button
                className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-[#33C5E0]/50 hover:bg-[#33C5E0]/20 hover:text-[#33C5E0]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Details
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {disputes.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800/70 bg-[#0F171B]/80 text-slate-500">
          <div className="text-center">
            <FaGavel className="mx-auto mb-4 text-4xl text-slate-700" />
            <p>No disputes found</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

