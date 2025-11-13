"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaFilter, FaPlus, FaEdit, FaEye, FaTrash, FaCoins } from "react-icons/fa";

const plans = [
  {
    id: "001",
    name: "Plan Name",
    assets: { type: "ETH", amount: "2" },
    beneficiary: 3,
    trigger: "INACTIVITY (6 MONTHS)",
    status: "ACTIVE",
  },
  {
    id: "002",
    name: "Plan Name",
    assets: { type: "NFT", amount: "7" },
    beneficiary: 1,
    trigger: "TIME-LOCKED",
    status: "COMPLETED",
  },
  {
    id: "003",
    name: "Plan Name",
    assets: { type: "NFT", amount: "1" },
    beneficiary: 2,
    trigger: "INACTIVITY (6 MONTHS)",
    status: "PENDING",
  },
  {
    id: "004",
    name: "Plan Name",
    assets: { type: "BTC", amount: "1" },
    beneficiary: 1,
    trigger: "INACTIVITY (6 MONTHS)",
    status: "EXPIRED",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-[#33C5E0]/20 text-[#33C5E0]";
    case "COMPLETED":
      return "bg-green-500/20 text-green-400";
    case "PENDING":
      return "bg-yellow-500/20 text-yellow-400";
    case "EXPIRED":
      return "bg-slate-500/20 text-slate-400";
    default:
      return "bg-slate-500/20 text-slate-400";
  }
};

const getAssetIcon = (type: string) => {
  switch (type) {
    case "ETH":
      return <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#33C5E0] text-xs font-bold text-[#0D1A1E]">Ξ</div>;
    case "BTC":
      return <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">₿</div>;
    case "NFT":
      return <div className="h-5 w-5 rounded bg-purple-500" />;
    default:
      return <FaCoins className="text-lg" />;
  }
};

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState<"Plans" | "Activities">("Plans");
  const [hasPlans] = useState(false); // Set to true to show table view

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-inheritx-display text-slate-100">Plans</h1>
        <p className="mt-2 text-lg text-slate-400">
          Create and manage your inheritance plans
        </p>
      </div>

      {/* Tabs and Filter */}
      <div className="flex items-center justify-between border-b border-slate-800/70">
        <div className="flex gap-6">
          {(["Plans", "Activities"] as const).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-4 text-sm font-semibold uppercase tracking-widest transition-colors ${
                activeTab === tab
                  ? "text-[#33C5E0]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              whileHover={{ y: -2 }}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#33C5E0]"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
        <motion.button
          className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-transparent px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaFilter className="text-sm" />
          Filter
        </motion.button>
      </div>

      {/* Content */}
      {activeTab === "Plans" ? (
        hasPlans ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800/70 bg-[#0F171B]/80">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/70">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Plan Name/ ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Assets
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Beneficiary
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Trigger
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, index) => (
                  <motion.tr
                    key={plan.id}
                    className="border-b border-slate-800/50 transition-colors hover:bg-slate-900/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-100">
                        {plan.name}
                      </div>
                      <div className="text-xs text-slate-500">Unique ID</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getAssetIcon(plan.assets.type)}
                        <span className="text-slate-200">
                          {plan.assets.amount} {plan.assets.type}
                        </span>
                        {plan.assets.type === "NFT" && plan.assets.amount === "7" && (
                          <span className="rounded-full bg-[#33C5E0]/20 px-2 py-0.5 text-xs text-[#33C5E0]">
                            3+
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-200">{plan.beneficiary}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-400">
                        {plan.trigger}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                          plan.status
                        )}`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {plan.status === "EXPIRED" ? (
                          <>
                            <motion.button
                              className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800/50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              VIEW DETAILS
                            </motion.button>
                            <motion.button
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:text-red-400"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FaTrash className="text-sm" />
                            </motion.button>
                          </>
                        ) : (
                          <>
                            <motion.button
                              className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800/50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaEdit className="inline mr-1" />
                              EDIT
                            </motion.button>
                            <motion.button
                              className="rounded-lg bg-[#33C5E0]/20 px-3 py-1.5 text-xs font-semibold text-[#33C5E0] transition-colors hover:bg-[#33C5E0]/30"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaEye className="inline mr-1" />
                              VIEW
                            </motion.button>
                            <motion.button
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:text-red-400"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FaTrash className="text-sm" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <motion.div
            className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-800/70 bg-[#0F171B]/80 py-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xl font-semibold text-slate-100">
              You haven&apos;t created any inheritance plans yet.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Secure your digital legacy by creating your first plan.
            </p>
            <motion.button
              className="mt-6 flex items-center gap-2 rounded-lg bg-[#33C5E0] px-6 py-3 text-sm font-semibold text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus />
              Create New Plan
            </motion.button>
          </motion.div>
        )
      ) : (
        <div className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6">
          <p className="text-center text-slate-400">Activities coming soon...</p>
        </div>
      )}
    </motion.div>
  );
}

