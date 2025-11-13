"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaFilter, FaCoins } from "react-icons/fa";

const claims = [
  {
    id: "001",
    name: "Plan Name",
    assets: { type: "ETH", amount: "2" },
    beneficiary: 3,
    trigger: "INACTIVITY (6 MONTHS)",
    status: "ACTIVE",
  },
];

const activities = [
  {
    date: "12th August, 2025",
    items: [
      "Plan #001 Created (3 Beneficiaries, Inactivity Trigger Set)",
      "Guardian Added To Plan #002",
      "Plan #001 Status Changed To Active",
      "1 NFC Converted",
    ],
  },
];

export default function ClaimPage() {
  const [activeTab, setActiveTab] = useState<"Claims" | "Activities">("Claims");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-inheritx-display text-slate-100">
          Claim Plan
        </h1>
        <p className="mt-2 text-lg text-slate-400">
          Claim your inheritance plan
        </p>
      </div>

      {/* Tabs and Filter */}
      <div className="flex items-center justify-between border-b border-slate-800/70">
        <div className="flex gap-6">
          {(["Claims", "Activities"] as const).map((tab) => (
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
      {activeTab === "Claims" ? (
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
              {claims.map((claim, index) => (
                <motion.tr
                  key={claim.id}
                  className="border-b border-slate-800/50 transition-colors hover:bg-slate-900/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-100">
                      {claim.name}
                    </div>
                    <div className="text-xs text-slate-500">Unique ID</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#33C5E0] text-xs font-bold text-[#0D1A1E]">Ξ</div>
                      <span className="text-slate-200">
                        {claim.assets.amount} {claim.assets.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-200">
                    {claim.beneficiary}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-400">
                      {claim.trigger}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-[#33C5E0]/20 px-3 py-1 text-xs font-semibold text-[#33C5E0]">
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <motion.button
                      className="rounded-lg bg-[#33C5E0] px-6 py-2 text-sm font-semibold text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      CLAIM PLAN
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((activity, index) => (
            <motion.div
              key={index}
              className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                  This Month
                </h3>
                <span className="text-sm text-slate-500">Timestamp</span>
              </div>
              <div className="space-y-3">
                {activity.items.map((item, itemIndex) => (
                  <motion.div
                    key={itemIndex}
                    className="flex items-center justify-between border-b border-slate-800/50 pb-3 last:border-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + itemIndex * 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-300">
                        {itemIndex + 1}.
                      </span>
                      <span className="text-sm text-slate-200">{item}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {activity.date}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

