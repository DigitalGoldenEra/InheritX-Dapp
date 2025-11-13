"use client";

import { motion } from "framer-motion";
import { FaUserCheck, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

const kycApplications = [
  {
    id: "KYC-001",
    name: "John Doe",
    email: "john.doe@example.com",
    status: "Pending",
    submitted: "2 hours ago",
    priority: "High",
  },
  {
    id: "KYC-002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    status: "Approved",
    submitted: "1 day ago",
    priority: "Medium",
  },
  {
    id: "KYC-003",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    status: "Rejected",
    submitted: "3 days ago",
    priority: "Low",
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Approved":
      return <FaCheckCircle className="text-green-400" />;
    case "Rejected":
      return <FaTimesCircle className="text-red-400" />;
    default:
      return <FaClock className="text-yellow-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-green-500/20 text-green-400";
    case "Rejected":
      return "bg-red-500/20 text-red-400";
    default:
      return "bg-yellow-500/20 text-yellow-400";
  }
};

export default function KYCPage() {
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
            KYC Oversight
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Review and manage Know Your Customer verifications
          </p>
        </div>
        <motion.button
          className="rounded-lg bg-[#33C5E0] px-6 py-3 text-sm font-semibold text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Bulk Actions
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", count: 5, color: "yellow" },
          { label: "Approved", count: 120, color: "green" },
          { label: "Rejected", count: 8, color: "red" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl font-inheritx-display text-[#33C5E0]">
              {stat.count}
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* KYC Applications List */}
      <div className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6">
        <h2 className="mb-6 text-xl font-inheritx-display uppercase tracking-widest text-slate-100">
          Applications
        </h2>

        <div className="space-y-4">
          {kycApplications.map((application, index) => (
            <motion.div
              key={application.id}
              className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-900/30 p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01, borderColor: "rgba(51, 197, 224, 0.3)" }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#33C5E0]/20 text-[#33C5E0]">
                  {getStatusIcon(application.status)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-100">
                      {application.name}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{application.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    ID: {application.id} • Submitted {application.submitted}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {application.status === "Pending" && (
                  <>
                    <motion.button
                      className="rounded-lg border border-green-500/50 bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-400 transition-colors hover:bg-green-500/30"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Approve
                    </motion.button>
                    <motion.button
                      className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/30"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Reject
                    </motion.button>
                  </>
                )}
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
      </div>
    </motion.div>
  );
}

