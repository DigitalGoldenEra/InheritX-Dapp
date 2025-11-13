"use client";

import { motion } from "framer-motion";
import { FaSearch, FaBell, FaEllipsisV } from "react-icons/fa";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-[#12191D]/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="relative flex-1 max-w-2xl">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search User, Ticket ID, Plans, & Admins..."
            className="w-full rounded-lg border border-slate-800/70 bg-transparent py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#33C5E0]/50 focus:outline-none focus:ring-2 focus:ring-[#33C5E0]/20"
          />
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            className="flex items-center gap-2 rounded-lg bg-[#33C5E0]/20 px-4 py-2 text-sm font-medium text-[#33C5E0] transition-colors hover:bg-[#33C5E0]/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaBell className="text-xs" />
            <span>KYC Verification Action Required</span>
          </motion.button>

          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === "authenticated");

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <motion.button
                          onClick={openConnectModal}
                          className="rounded-lg bg-[#33C5E0] px-4 py-2 text-sm font-semibold text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Connect Wallet
                        </motion.button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <motion.button
                          onClick={openChainModal}
                          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Wrong network
                        </motion.button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-3">
                        <motion.button
                          onClick={openChainModal}
                          className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-transparent px-3 py-2 text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {chain.hasIcon && (
                            <div
                              style={{
                                background: chain.iconBackground,
                                width: 16,
                                height: 16,
                                borderRadius: 999,
                                overflow: "hidden",
                              }}
                            >
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? "Chain icon"}
                                  src={chain.iconUrl}
                                  style={{ width: 16, height: 16 }}
                                />
                              )}
                            </div>
                          )}
                          <span className="text-slate-300">{chain.name}</span>
                        </motion.button>

                        <motion.button
                          onClick={openAccountModal}
                          className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-transparent px-3 py-2 text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="h-4 w-4 rounded-full bg-[#33C5E0]/20 flex items-center justify-center">
                            <span className="text-xs font-semibold text-[#33C5E0]">
                              {account.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-slate-300">
                            {account.displayName.slice(0, 6)}...
                            {account.displayName.slice(-4)}
                          </span>
                        </motion.button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}

