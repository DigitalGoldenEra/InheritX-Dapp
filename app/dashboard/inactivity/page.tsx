"use client";

import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

const durationOptions = ["3 Months", "6 Months", "1 Year", "1 Month"];

export default function InactivityPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-inheritx-display text-slate-100">
          Inactivity Set-up
        </h1>
        <p className="mt-2 text-lg text-slate-400">
          Define the condition under which your inheritance plans kicks in.
        </p>
      </div>

      {/* Inactivity Duration */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-100">
          Inactivity Duration
        </h3>
        <div className="space-y-3">
          {durationOptions.map((option, index) => (
            <motion.label
              key={option}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800/70 bg-slate-900/30 p-4 transition-colors hover:bg-slate-800/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ x: 4 }}
            >
              <input
                type="radio"
                name="duration"
                value={option}
                className="h-4 w-4 border-slate-700 bg-slate-900 text-[#33C5E0] focus:ring-[#33C5E0]"
              />
              <span className="text-slate-200">{option}</span>
            </motion.label>
          ))}
        </div>
      </motion.div>

      {/* Beneficiary Name */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="mb-3 block text-sm font-semibold uppercase tracking-widest text-slate-100">
          Beneficiary Name
        </label>
        <input
          type="text"
          placeholder="Juliet Johnson"
          className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
        />
      </motion.div>

      {/* Beneficiary Email */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <label className="mb-3 block text-sm font-semibold uppercase tracking-widest text-slate-100">
          Beneficiary Email
        </label>
        <input
          type="email"
          placeholder="e.g. thejulietjohnson@gmail.com"
          className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
        />
      </motion.div>

      {/* Claim Code */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <label className="mb-3 block text-sm font-semibold uppercase tracking-widest text-slate-100">
          Claim Code
        </label>
        <input
          type="text"
          placeholder="123456"
          className="w-full rounded-lg border border-slate-800/70 bg-slate-900/30 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
        />
      </motion.div>

      {/* Claim Code Mechanism */}
      <motion.div
        className="rounded-xl border border-[#33C5E0]/30 bg-[#33C5E0]/10 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-100">
          Claim Code Mechanism
        </h3>
        <p className="text-sm leading-relaxed text-[#33C5E0]">
          The code would be sent to the email of your beneficiary if you are
          inactive for a set period of time. With the claim code, your
          beneficiary would be able to claim the assets from the inheritance
          plans you have set.
        </p>
      </motion.div>

      {/* Save Button */}
      <motion.button
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800/70 bg-slate-900/50 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-slate-100 transition-colors hover:bg-slate-800/50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        SAVE SETTINGS
        <FaArrowRight />
      </motion.button>
    </motion.div>
  );
}

