"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaArrowRight } from "react-icons/fa";

const devices = [
  { type: "DESKTOP", name: "Mac M1" },
  { type: "MOBILE", name: "Samsung S21 FE" },
];

export default function SecurityPage() {
  const [twoFA, setTwoFA] = useState(false);
  const [fingerprint, setFingerprint] = useState(false);
  const [faceID, setFaceID] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-inheritx-display text-slate-100">
            Security
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Manage how you protect your account
          </p>
        </div>
        <motion.div
          className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/20 px-4 py-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FaCheckCircle className="text-green-400" />
          <span className="text-sm font-semibold uppercase tracking-widest text-green-400">
            ACCOUNT IS SECURED
          </span>
        </motion.div>
      </div>
      <p className="text-sm text-slate-400">Your account is secured. Add 2FA?</p>

      {/* Two-Factor Authentication */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-100">
          Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-slate-200">Enable Two-Factor Authentication</span>
          <motion.button
            onClick={() => setTwoFA(!twoFA)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              twoFA ? "bg-[#33C5E0]" : "bg-slate-700"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white"
              animate={{ x: twoFA ? 24 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Device Management */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-100">
          Device Management
        </h3>
        <p className="mb-4 text-sm text-slate-400">
          You are logged in on {devices.length} devices
        </p>
        <div className="space-y-3">
          {devices.map((device, index) => (
            <motion.div
              key={index}
              className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-900/30 p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div>
                <div className="font-medium text-slate-100">{device.type}</div>
                <div className="text-sm text-slate-400">{device.name}</div>
              </div>
              <motion.button
                className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition-colors hover:bg-red-500/20 hover:text-red-400"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                LOG OUT
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Biometric Authentication */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-100">
          Biometric Authentication
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Enable Fingerprint</span>
            <motion.button
              onClick={() => setFingerprint(!fingerprint)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                fingerprint ? "bg-[#33C5E0]" : "bg-slate-700"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white"
                animate={{ x: fingerprint ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-200">Enable Face ID</span>
            <motion.button
              onClick={() => setFaceID(!faceID)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                faceID ? "bg-[#33C5E0]" : "bg-slate-700"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white"
                animate={{ x: faceID ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Security Alerts */}
      <motion.div
        className="rounded-xl border border-slate-800/70 bg-[#0F171B]/80 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-100">
          Security Alerts
        </h3>
        <p className="mb-4 text-sm text-slate-400">
          Get notified of suspicious activity
        </p>
        <div className="flex items-center justify-between">
          <span className="text-slate-200">Notify by email</span>
          <motion.button
            onClick={() => setEmailAlerts(!emailAlerts)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              emailAlerts ? "bg-[#33C5E0]" : "bg-slate-700"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white"
              animate={{ x: emailAlerts ? 24 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#33C5E0] px-6 py-3 text-sm font-semibold uppercase tracking-widest text-[#0D1A1E] transition-colors hover:bg-[#33C5E0]/90"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        SAVE SETTINGS
        <FaArrowRight />
      </motion.button>
    </motion.div>
  );
}

