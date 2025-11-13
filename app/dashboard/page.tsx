"use client";

import { motion } from "framer-motion";
import { FaArrowAltCircleUp, FaFilter, FaPlus } from "react-icons/fa";

const overviewMetrics = [
  {
    value: 0,
    label: "Active Plans",
    buttonLabel: "Create Plan",
    primary: true,
  },
  {
    value: 0,
    label: "To Withdraw",
    buttonLabel: "Withdraw Asset",
    primary: false,
  },
  {
    value: 0,
    label: "Created Plans",
    buttonLabel: "Add Beneficiary",
    primary: false,
  },
  {
    value: 0,
    label: "Pending Claims",
    buttonLabel: "View Claims",
    primary: false,
  },
];

const activityFilters = [
  "All",
  "Created Plans",
  "Swaps",
  "Inactivity Alert",
  "Guardians",
];

export default function DashboardPage() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Greeting Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-inheritx-display text-slate-100">
          {getGreeting()}, EBUBE
        </h1>
        <p className="mt-2 text-lg text-slate-400">
          Monitor, protect, and manage the platform.
        </p>
      </motion.div>

      {/* Overview Metrics */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {overviewMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="text-4xl font-inheritx-display text-slate-100">
              {metric.value}
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-[0.05em] text-slate-400">
              {metric.label}
            </div>
            <motion.button
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                metric.primary
                  ? "bg-[#33C5E0] text-[#0D1A1E] hover:bg-[#33C5E0]/90"
                  : "border border-slate-800/70 bg-slate-900/50 text-slate-300 hover:bg-slate-800/50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {metric.buttonLabel}
              <FaArrowAltCircleUp className="text-xs" />
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-inheritx-display uppercase tracking-widest text-slate-100">
            Recent Activities
          </h2>
          <motion.button
            className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-transparent px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaFilter className="text-sm" />
            Filter
          </motion.button>
        </div>

        {/* Activity Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {activityFilters.map((filter, index) => {
            const isActive = filter === "All";
            return (
              <motion.button
                key={filter}
                className={`rounded-lg px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] transition-colors ${
                  isActive
                    ? "bg-[#33C5E0]/20 text-[#33C5E0] font-semibold"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                {filter}
              </motion.button>
            );
          })}
        </div>

        {/* Empty State */}
        <div className="flex min-h-[300px] flex-col items-center justify-center py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-lg font-medium text-slate-300">No activity yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add Beneficiaries, Add Guardians or Create Plans to get started
            </p>
          </motion.div>
        </div>

        {/* Create New Plan Button */}
        <div className="mt-6 flex justify-center">
          <motion.button
            className="flex items-center gap-2 rounded-lg bg-[#33C5E0] px-6 py-3 text-sm font-semibold text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <FaPlus />
            Create New Plan
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

