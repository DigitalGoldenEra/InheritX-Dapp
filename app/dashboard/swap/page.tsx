"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaExchangeAlt, FaArrowUp } from "react-icons/fa";

const slippageRates = [
  { asset: "ETH", change: "0.24%", trend: "up", rate: "1 Eth = 1000 USDC" },
  { asset: "ETH", change: "0.24%", trend: "up", rate: "1 Eth = 1000 USDC" },
  { asset: "ETH", change: "0.24%", trend: "down", rate: "1 Eth = 1000 USDC" },
];

export default function SwapPage() {
  const [fromAmount, setFromAmount] = useState("0");
  const [toAmount, setToAmount] = useState("0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-inheritx-display text-slate-100">Swap</h1>
        <p className="mt-2 text-lg text-slate-400">
          Seamlessly swap your assets at the best available rate
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Swap Interface */}
        <div className="space-y-6">
          {/* Swap From */}
          <motion.div
            className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="mb-2 block text-sm font-medium text-slate-400">
              Swap From:
            </label>
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#33C5E0] text-sm font-bold text-[#0D1A1E]">Ξ</div>
              <select className="flex-1 bg-transparent text-slate-100 focus:outline-none">
                <option>ETH</option>
              </select>
            </div>
            <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
              <span>Bal: 0</span>
              <button className="text-[#33C5E0] hover:text-[#33C5E0]/80">
                MAX
              </button>
            </div>
            <div className="text-3xl font-inheritx-display text-slate-100">
              $ {fromAmount}
            </div>
            <div className="mt-1 text-sm text-slate-500">≈ ${fromAmount}</div>
          </motion.div>

          {/* Swap Icon */}
          <div className="flex justify-center">
            <motion.button
              className="rounded-full border-2 border-slate-800/70 bg-[#0F171B]/80 p-4 text-slate-400 transition-colors hover:border-[#33C5E0]/50 hover:text-[#33C5E0]"
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaExchangeAlt className="text-xl" />
            </motion.button>
          </div>

          {/* Swap To */}
          <motion.div
            className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="mb-2 block text-sm font-medium text-slate-400">
              Swap To:
            </label>
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                USDC
              </div>
              <select className="flex-1 bg-transparent text-slate-100 focus:outline-none">
                <option>USDC</option>
              </select>
            </div>
            <div className="mb-4 text-sm text-slate-400">Bal: 0</div>
            <div className="text-3xl font-inheritx-display text-slate-100">
              $ {toAmount}
            </div>
            <div className="mt-1 text-sm text-slate-500">≈ ${toAmount}</div>
          </motion.div>

          {/* Gas Fee */}
          <div className="text-sm text-slate-400">Gas Fee: $0.00</div>

          {/* Swap Button */}
          <motion.button
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#33C5E0] px-6 py-4 text-sm font-semibold text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaExchangeAlt />
            SWAP ASSET
          </motion.button>
        </div>

        {/* Asset Rate Slippage */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[#33C5E0]">
            Asset Rate Slippage
          </h3>
          <div className="space-y-3">
            {slippageRates.map((rate, index) => (
              <motion.div
                key={index}
                className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#33C5E0] text-xs font-bold text-[#0D1A1E]">Ξ</div>
                    <span className="font-medium text-slate-100">
                      {rate.asset}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rate.trend === "up" ? (
                      <FaArrowUp className="text-green-400" />
                    ) : (
                      <FaArrowUp className="rotate-180 text-red-400" />
                    )}
                    <span
                      className={`font-semibold ${
                        rate.trend === "up" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {rate.change}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-slate-400">{rate.rate}</div>
              </motion.div>
            ))}
          </div>
          <div className="rounded-xl border border-[#33C5E0]/30 bg-[#33C5E0]/10 p-4 text-sm text-slate-300">
            You Will Receive At Least 1790 USDC (If The Price Doesn&apos;t Move
            More Than 0.5%).
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Recent transactions
        </h3>
        <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
          <p className="text-slate-400">You don&apos;t have an activity record yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            Swap assets and add to a plan to see your transaction history
          </p>
          <motion.button
            className="mt-4 flex items-center gap-2 rounded-lg border border-[#33C5E0]/50 bg-[#33C5E0]/20 px-4 py-2 text-sm font-semibold text-[#33C5E0] transition-colors hover:bg-[#33C5E0]/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowRight />
            Swap Assets
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

