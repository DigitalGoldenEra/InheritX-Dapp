"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaHome,
  FaFileAlt,
  FaHandHoldingUsd,
  FaExchangeAlt,
  FaChartLine,
  FaBolt,
  FaLock,
  FaSignOutAlt,
} from "react-icons/fa";

const navItems = [
  { href: "/dashboard", label: "HOME", icon: FaHome },
  { href: "/dashboard/plans", label: "PLANS", icon: FaFileAlt },
  { href: "/dashboard/claim", label: "CLAIM", icon: FaHandHoldingUsd },
  { href: "/dashboard/swap", label: "SWAP", icon: FaExchangeAlt },
  { href: "/dashboard/portfolio", label: "PORTFOLIO", icon: FaChartLine },
  { href: "/dashboard/inactivity", label: "INACTIVITY", icon: FaBolt },
  { href: "/dashboard/security", label: "SECURITY", icon: FaLock },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800/70 bg-[#12191D]/95 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-slate-800/70 p-6">
          <Image
            src="/img/logo.svg"
            alt="InheritX logo"
            width={40}
            height={40}
          />
          <span className="text-lg font-inheritx-display tracking-[0.3em] text-slate-100">
            INHERITX
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-6 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium uppercase transition-colors ${
                    isActive
                      ? "bg-[#33C5E0]/20 text-[#33C5E0]"
                      : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-0 h-full w-1  bg-[#33C5E0]"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="text-lg" />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-800/70 p-4">
          <motion.button
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium uppercase tracking-widest text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-red-400"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaSignOutAlt className="text-lg" />
            <span>LOGOUT</span>
          </motion.button>
        </div>
      </div>
    </aside>
  );
}

