'use client';

import { motion } from 'framer-motion';

const stats = [
  { label: 'Total Verified Users', value: 0 },
  { label: 'Total Inheritance Plans', value: 0 },
  { label: 'Open Disputes', value: 0 },
];

export default function StatsPanel() {
  return (
    <div className="space-y-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, borderColor: 'rgba(51, 197, 224, 0.3)' }}
        >
          <div className="text-4xl font-inheritx-display text-[#33C5E0]">{stat.value}</div>
          <div className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-400">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
