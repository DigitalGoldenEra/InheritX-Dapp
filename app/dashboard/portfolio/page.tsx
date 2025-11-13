"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaCaretDown } from "react-icons/fa";

const portfolioStats = [
  { label: "Total Portfolio Value", value: "8", change: "+24%", period: "(24h/7d)" },
  { label: "Tokens Count", value: "12", subtitle: "12 Assets Across 4 Chains" },
  { label: "NFTs Count", value: "5", nfts: 5 },
  { label: "Recent Swaps", value: "+ $1,250", period: "This Month" },
];

const assets = [
  { name: "ETH", balance: "2.45", price: "$3,200", value: "$7,840" },
  { name: "ETH", balance: "2.45", price: "$3,200", value: "$7,840" },
  { name: "ETH", balance: "2.45", price: "$3,200", value: "$7,840" },
  { name: "ETH", balance: "2.45", price: "$3,200", value: "$7,840" },
];

export default function PortfolioPage() {
  const [hasAssets] = useState(true); // Toggle to show empty state

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
          Portfolio
        </h1>
        <p className="mt-2 text-lg text-slate-400">
          This is the stats of your assets so far
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {portfolioStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-4xl font-inheritx-display text-slate-100">
              {stat.value}
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-[0.05em] text-slate-400">
              {stat.label}
            </div>
            {stat.change && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                <span>{stat.change}</span>
                <span className="text-slate-500">{stat.period}</span>
              </div>
            )}
            {stat.subtitle && (
              <div className="mt-2 text-xs text-slate-500">
                {stat.subtitle.split(" ").map((word, i) =>
                  word === "4" || word === "Chains" ? (
                    <span key={i} className="text-[#33C5E0]">
                      {word}{" "}
                    </span>
                  ) : (
                    <span key={i}>{word} </span>
                  )
                )}
              </div>
            )}
            {stat.nfts && (
              <div className="mt-3 flex items-center gap-2">
                {Array.from({ length: Math.min(stat.nfts, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
                  />
                ))}
                {stat.nfts > 5 && <span className="text-slate-400">...</span>}
              </div>
            )}
            {stat.period && !stat.change && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-900/30 px-3 py-2 text-sm text-slate-400">
                <span>{stat.period}</span>
                <FaCaretDown className="text-xs" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {hasAssets ? (
        <>
          {/* Chart & Insights */}
          <motion.div
            className="grid gap-6 lg:grid-cols-[2fr_1fr]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6">
              <h3 className="mb-6 text-lg font-semibold uppercase tracking-widest text-slate-100">
                Chart & Insights
              </h3>
              <div className="flex h-64 items-center justify-center rounded-lg border border-slate-800/50 bg-slate-900/30">
                <div className="text-center">
                  <div className="mb-4 h-32 w-full rounded bg-gradient-to-t from-[#33C5E0]/20 to-transparent" />
                  <div className="flex justify-center gap-2">
                    {["1H", "1D", "1W", "1M", "1Y"].map((period, i) => (
                      <button
                        key={period}
                        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                          i === 0
                            ? "bg-[#33C5E0]/20 text-[#33C5E0]"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-100">
                Total asset pool value
              </h3>
              <p className="mb-6 text-xs text-slate-400">
                Sum Of All Asset Values
              </p>
              <div className="flex h-48 items-center justify-center">
                <div className="relative h-32 w-32">
                  <svg className="h-32 w-32 -rotate-90 transform">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="rgba(51, 197, 224, 0.2)"
                      strokeWidth="16"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#33C5E0"
                      strokeWidth="16"
                      strokeDasharray={`${2 * Math.PI * 56 * 0.1} ${2 * Math.PI * 56}`}
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#9333ea"
                      strokeWidth="16"
                      strokeDasharray={`${2 * Math.PI * 56 * 0.3} ${2 * Math.PI * 56}`}
                      strokeDashoffset={-2 * Math.PI * 56 * 0.1}
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="16"
                      strokeDasharray={`${2 * Math.PI * 56 * 0.6} ${2 * Math.PI * 56}`}
                      strokeDashoffset={-2 * Math.PI * 56 * 0.4}
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-pink-500" />
                  <span className="text-slate-300">ETH - 10%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-slate-300">NFTs - 30%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span className="text-slate-300">Real World Asset - 60%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Asset Table */}
          <motion.div
            className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="mb-6 text-lg font-semibold uppercase tracking-widest text-slate-100">
              Asset Table
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/70">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Assets
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Price ($ USD)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, index) => (
                    <motion.tr
                      key={index}
                      className="border-b border-slate-800/50 transition-colors hover:bg-slate-900/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#33C5E0] text-xs font-bold text-[#0D1A1E]">Ξ</div>
                          <span className="font-medium text-slate-100">
                            {asset.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-200">
                        {asset.balance}
                      </td>
                      <td className="px-4 py-4 text-slate-200">
                        {asset.price}
                      </td>
                      <td className="px-4 py-4 text-slate-200">{asset.value}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            className="rounded-lg border border-[#33C5E0]/50 bg-transparent px-3 py-1.5 text-xs font-semibold text-[#33C5E0] transition-colors hover:bg-[#33C5E0]/20"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            SWAP
                          </motion.button>
                          <motion.button
                            className="rounded-lg bg-[#33C5E0] px-3 py-1.5 text-xs font-semibold text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ADD TO PLAN
                          </motion.button>
                          <motion.button
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:text-slate-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FaArrowRight className="text-sm" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      ) : (
        <motion.div
          className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-800/70 bg-[#0F171B]/80 py-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-2 text-lg font-semibold text-slate-100">
            No assets found.
          </h3>
          <p className="mb-6 text-sm text-slate-400">
            Connect your wallet or add assets to get started.
          </p>
          <motion.button
            className="flex items-center gap-2 rounded-lg border border-[#33C5E0]/50 bg-[#33C5E0]/20 px-4 py-2 text-sm font-semibold text-[#33C5E0] transition-colors hover:bg-[#33C5E0]/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowRight />
            Swap Assets
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

