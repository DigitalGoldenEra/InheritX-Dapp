"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  FiArrowRight,
  FiCheck,
  FiArrowUpRight,
  FiShield,
  FiZap,
  FiLock,
  FiUsers,
  FiClock,
  FiGlobe,
  FiMenu,
  FiX,
} from "react-icons/fi";

export default function HomePage() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: FiLock,
      title: "Non-Custodial",
      desc: "You maintain full control. Assets stay in your wallet until distribution.",
    },
    {
      icon: FiShield,
      title: "Privacy First",
      desc: "Beneficiary data is hashed on-chain. Only verified claims succeed.",
    },
    {
      icon: FiClock,
      title: "Flexible Timing",
      desc: "Lump sum or scheduled distributions — monthly, quarterly, yearly.",
    },
    {
      icon: FiUsers,
      title: "Multi-Beneficiary",
      desc: "Add up to 10 beneficiaries with custom allocation percentages.",
    },
    {
      icon: FiZap,
      title: "Instant Claims",
      desc: "Beneficiaries claim instantly when conditions are met.",
    },
    {
      icon: FiGlobe,
      title: "Global Access",
      desc: "Access from anywhere. All you need is a Web3 wallet.",
    },
  ];

  const steps = [
    { step: "01", title: "Connect", desc: "Link your Web3 wallet securely" },
    { step: "02", title: "Verify", desc: "Complete KYC verification" },
    { step: "03", title: "Create", desc: "Set up your inheritance plan" },
    { step: "04", title: "Relax", desc: "Assets distribute automatically" },
  ];

  const stats = [
    { value: "$2M+", label: "Assets Secured" },
    { value: "500+", label: "Active Plans" },
    { value: "24/7", label: "Availability" },
  ];

  const securityItems = [
    "Smart contracts audited by leading security firms",
    "Beneficiary data hashed using keccak256",
    "Encrypted claim codes — only beneficiaries can access",
    "Non-custodial architecture — you control everything",
  ];

  return (
    <div className="min-h-screen bg-dark">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(51,197,224,0.08),transparent_70%)]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(5,6,8,0.9)] backdrop-blur-[20px]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between border border-white/6 rounded-[15px] mt-5">
          <Link
            href="/"
            className="flex items-center gap-1 no-underline text-white font-['Syne',sans-serif] font-bold text-xl"
          >
            <img
              src="/img/logo.svg"
              alt="InheritX logo"
              width={36}
              height={36}
            />
            InheritX
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <a
              href="#features"
              className="text-[#94A3B8] no-underline text-sm font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-[#94A3B8] no-underline text-sm font-medium"
            >
              How It Works
            </a>
            <a
              href="#security"
              className="text-[#94A3B8] no-underline text-sm font-medium"
            >
              Security
            </a>
          </div>

          <div className="flex items-center gap-3">
            {mounted &&
              (isConnected ? (
                <Link href="/dashboard" className="btn btn-primary btn-sm">
                  Dashboard <FiArrowRight size={14} />
                </Link>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="btn btn-primary"
                    >
                      Connect
                    </button>
                  )}
                </ConnectButton.Custom>
              ))}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 bg-transparent border-none cursor-pointer text-[#94A3B8]"
            >
              {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-[100px] pb-20 px-6 relative">
        <div className="max-w-[900px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[rgba(51,197,224,0.1)] border border-[rgba(51,197,224,0.2)] rounded-full text-[13px] text-[#33C5E0] mb-10 font-medium">
              <span className="w-1.5 h-1.5 bg-[#33C5E0] rounded-full" />
              Powered by Lisk Blockchain
            </div>

            {/* Headline */}
            <h1 className="font-['Syne',sans-serif] text-[clamp(42px,4vw,80px)] font-extrabold leading-none mb-6 tracking-[-0.03em]">
              <span className="text-white">SECURE YOUR</span>
              <br />
              <span className="text-[#33C5E0]">DIGITAL LEGACY</span>
            </h1>

            <p className="text-lg text-[#94A3B8] mb-12 max-w-[540px] mx-auto leading-[1.7]">
              Create automated inheritance plans for your crypto assets.
              Trustless, private, and fully on-chain.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center flex-wrap mb-16">
              {mounted &&
                (isConnected ? (
                  <Link href="/dashboard" className="btn btn-primary btn-lg">
                    Open Dashboard <FiArrowUpRight size={18} />
                  </Link>
                ) : (
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button
                        onClick={openConnectModal}
                        className="btn btn-primary btn-lg min-w-[180px]"
                      >
                        Get Started <FiArrowRight size={18} />
                      </button>
                    )}
                  </ConnectButton.Custom>
                ))}
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 flex-wrap">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="font-['Syne',sans-serif] text-[32px] font-extrabold text-white">
                    {stat.value}
                  </div>
                  <div className="text-[13px] text-[#64748B] mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-[100px] px-6 bg-[#0A0D10]">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-semibold tracking-[2px] text-[#33C5E0] mb-3 uppercase">
              Features
            </p>
            <h2 className="font-['Syne',sans-serif] text-[clamp(32px,5vw,48px)] font-bold max-w-[600px] leading-[1.1] text-white">
              Everything you need for digital estate planning
            </h2>
          </motion.div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-[#0C0F12] border border-white/6 rounded-2xl p-7 transition-all duration-300 hover:border-[rgba(51,197,224,0.3)]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(51,197,224,0.1)] text-[#33C5E0] mb-5">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-['Syne',sans-serif] text-lg font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#94A3B8] leading-[1.6]">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-[100px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-semibold tracking-[2px] text-[#33C5E0] mb-3 uppercase">
              Process
            </p>
            <h2 className="font-['Syne',sans-serif] text-[clamp(32px,5vw,48px)] font-bold text-white">
              How it works
            </h2>
          </motion.div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                className="text-center p-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-18 h-18 mx-auto mb-5 rounded-full flex items-center justify-center bg-[rgba(51,197,224,0.1)] border border-[rgba(51,197,224,0.2)] font-['Syne',sans-serif] text-[22px] font-extrabold text-[#33C5E0]">
                  {item.step}
                </div>
                <h3 className="font-['Syne',sans-serif] text-xl font-bold mb-2 text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-[#94A3B8]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-[100px] px-6 bg-[#0A0D10]">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="bg-gradient-to-br from-[rgba(51,197,224,0.05)] to-transparent border border-[rgba(51,197,224,0.1)] rounded-3xl p-[clamp(32px,6vw,64px)] relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-12 items-center">
              <div>
                <p className="text-xs font-semibold tracking-[2px] text-[#33C5E0] mb-3 uppercase">
                  Security
                </p>
                <h2 className="font-['Syne',sans-serif] text-[clamp(28px,4vw,40px)] font-bold mb-5 text-white">
                  Built for trust
                </h2>
                <p className="text-[15px] text-[#94A3B8] mb-7 leading-[1.7]">
                  Your inheritance plans are protected by multiple layers of
                  security. We never have access to your assets.
                </p>

                <div className="flex flex-col gap-3.5">
                  {securityItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center bg-[#33C5E0] shrink-0 mt-0.5">
                        <FiCheck size={12} color="#000" />
                      </div>
                      <span className="text-sm text-[#94A3B8] leading-[1.5]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <img
                  src="/img/hero-img.png"
                  alt="Security"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[100px] px-6">
        <motion.div
          className="max-w-[1200px] mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-['Syne',sans-serif] text-[clamp(28px,4vw,44px)] font-bold mb-4 text-white">
            Ready to secure your legacy?
          </h2>
          <p className="text-base text-[#94A3B8] mb-9 max-w-[450px] mx-auto">
            Join thousands who trust InheritX for their digital inheritance
            planning.
          </p>
          {mounted &&
            (isConnected ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard <FiArrowUpRight size={18} />
              </Link>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="btn btn-primary btn-lg min-w-[180px]"
                  >
                    Start Now <FiArrowRight size={18} />
                  </button>
                )}
              </ConnectButton.Custom>
            ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-7 px-6 border-t border-white/6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between flex-wrap gap-5">
          <div className="flex items-center gap-2.5 font-['Syne',sans-serif]">
            <div className="w-6 h-6 bg-[#33C5E0] rounded-md flex items-center justify-center font-bold text-[10px] text-[#050608]">
              IX
            </div>
            <span className="font-semibold text-sm text-white">InheritX</span>
          </div>
          <div className="text-[13px] text-[#64748B]">
            © 2024 InheritX. Built on Lisk.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[13px] text-[#64748B] no-underline">
              Terms
            </a>
            <a href="#" className="text-[13px] text-[#64748B] no-underline">
              Privacy
            </a>
            <a href="#" className="text-[13px] text-[#64748B] no-underline">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
