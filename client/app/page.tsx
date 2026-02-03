'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight,
  FiCheck,
  FiShield,
  FiZap,
  FiLock,
  FiUsers,
  FiClock,
  FiGlobe,
  FiMail,
  FiUser,
  FiLoader,
} from 'react-icons/fi';
import { FaTelegram, FaXTwitter } from 'react-icons/fa6';
import Image from 'next/image';
import confetti from 'canvas-confetti';

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function WaitlistPage() {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Fetch waitlist count
    fetchWaitlistCount();
  }, []);

  const fetchWaitlistCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/waitlist/count`);
      if (res.ok) {
        const data = await res.json();
        setWaitlistCount(data.count || 0);
      }
    } catch (err) {
      console.log('Could not fetch waitlist count');
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#33C5E0', '#0EA5E9', '#06B6D4', '#22D3EE', '#67E8F9'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setIsSuccess(true);
      triggerConfetti();
      setWaitlistCount((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: FiLock,
      title: 'Non-Custodial',
      desc: 'Full control of your assets until distribution.',
    },
    {
      icon: FiShield,
      title: 'Privacy First',
      desc: 'Beneficiary data hashed on-chain.',
    },
    {
      icon: FiClock,
      title: 'Flexible Timing',
      desc: 'Scheduled or lump sum distributions.',
    },
    {
      icon: FiUsers,
      title: 'Multi-Beneficiary',
      desc: 'Add up to 10 beneficiaries.',
    },
    {
      icon: FiZap,
      title: 'Instant Claims',
      desc: 'Beneficiaries claim instantly.',
    },
    {
      icon: FiGlobe,
      title: 'Global Access',
      desc: 'Accessible from anywhere.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050608] overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, rgba(51,197,224,0.15) 0%, rgba(51,197,224,0.05) 40%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Secondary orb */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, rgba(14,165,233,0.1) 0%, transparent 60%)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Tertiary orb */}
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, rgba(6,182,212,0.08) 0%, transparent 60%)',
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto lg:px-0 px-6">
          <div className="h-20 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 no-underline text-white font-bold text-xl"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <Image src="/img/logo.svg" alt="InheritX" width={40} height={40} priority />
              <span>InheritX</span>
            </Link>

            <div className="flex items-center gap-4">
              <a
                href="https://t.me/+sUOXda22kXsyMzI0"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-[#64748B] hover:text-[#33C5E0] transition-colors"
              >
                <FaTelegram size={20} />
              </a>
              <a
                href="https://x.com/projectInheritX"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-[#64748B] hover:text-[#33C5E0] transition-colors"
              >
                <FaXTwitter size={18} />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20 pb-32 px-6 relative">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{
                background: 'rgba(51,197,224,0.1)',
                border: '1px solid rgba(51,197,224,0.2)',
                backdropFilter: 'blur(10px)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="w-2 h-2 bg-[#33C5E0] rounded-full animate-pulse" />
              <span className="text-[#33C5E0] text-sm font-medium">Coming Soon on Lisk</span>
            </motion.div>

            {/* Headline */}
            <h1
              className="text-white mb-6"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '40px',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Secure Your
              <br />
              <span className="text-[#33C5E0]">Digital Legacy</span>
            </h1>

            <p className="text-[#94A3B8] text-lg mb-10 max-w-[480px] leading-relaxed">
              Create automated crypto plans for tuition, weddings, travel, or inheritance.
              Trustless, private, and fully on-chain.
            </p>


          </motion.div>

          {/* Right Content - Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Glow effect behind the card */}
            {/* <div
              className="absolute inset-0 blur-3xl opacity-30"
              style={{
                background: 'linear-gradient(135deg, rgba(51,197,224,0.3), rgba(14,165,233,0.2))',
                transform: 'translate(20px, 20px)',
              }}
            /> */}

            {/* Glassmorphism Card */}
            <div
              className="relative rounded-3xl p-8 md:p-10"
              style={{
                // background: 'rgba(15,23,42,0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              }}
            >
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #33C5E0, #0EA5E9)',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                    >
                      <FiCheck size={40} color="#000" strokeWidth={3} />
                    </motion.div>
                    <h3
                      className="text-2xl text-white font-bold mb-3"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      You're on the list!
                    </h3>
                    <p className="text-[#94A3B8] mb-6">
                      We'll notify you when InheritX launches.
                    </p>
                    <div className="flex justify-center gap-4">
                      <a
                        href="https://t.me/+sUOXda22kXsyMzI0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:scale-105"
                        style={{
                          background: 'rgba(51,197,224,0.15)',
                          border: '1px solid rgba(51,197,224,0.3)',
                        }}
                      >
                        <FaTelegram size={18} />
                        Join Telegram
                      </a>
                      <a
                        href="https://x.com/projectInheritX"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:scale-105"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <FaXTwitter size={16} />
                        Follow on X
                      </a>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2
                      className="text-2xl md:text-3xl text-white font-bold mb-2"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      Join the Waitlist
                    </h2>
                    <p className="text-[#94A3B8] mb-8">
                      Be the first to secure your digital legacy.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Name Input */}
                      <div className="relative">
                        <FiUser
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"
                          size={20}
                        />
                        <input
                          type="text"
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#33C5E0]/50"
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      </div>

                      {/* Email Input */}
                      <div className="relative">
                        <FiMail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]"
                          size={20}
                        />
                        <input
                          type="email"
                          placeholder="Your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#33C5E0]/50"
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      </div>

                      {/* Error Message */}
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-sm"
                        >
                          {error}
                        </motion.p>
                      )}

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl font-semibold text-black flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                        style={{
                          background: 'linear-gradient(135deg, #33C5E0, #0EA5E9)',
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSubmitting ? (
                          <>
                            <FiLoader className="animate-spin" size={20} />
                            Joining...
                          </>
                        ) : (
                          <>
                            Join Waitlist
                            <FiArrowRight size={20} />
                          </>
                        )}
                      </motion.button>
                    </form>

                    <p className="text-[#64748B] text-xs text-center mt-6">
                      No spam, ever. We'll only email you about launch updates.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[#33C5E0] text-sm font-semibold tracking-widest uppercase mb-3">
              Why InheritX
            </p>
            <h2
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              The Future of Digital Asset Planning
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="p-6 rounded-2xl transition-all hover:border-[rgba(51,197,224,0.3)]"
                  style={{
                    background: 'rgba(15,23,42,0.4)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(10px)',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: 'rgba(51,197,224,0.1)',
                    }}
                  >
                    <Icon size={22} color="#33C5E0" />
                  </div>
                  <h3
                    className="text-white font-semibold mb-2"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-[#94A3B8] text-sm">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/img/logo.svg" alt="InheritX" width={32} height={32} />
          </Link>
          <div className="text-[#64748B] text-sm">
            © 2026 InheritX. Built on Lisk.
          </div>
          <div className="flex gap-6 items-center">
            <a
              href="https://t.me/+sUOXda22kXsyMzI0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#64748B] hover:text-[#33C5E0] transition-colors"
            >
              <FaTelegram size={20} />
            </a>
            <a
              href="https://x.com/projectInheritX"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#64748B] hover:text-[#33C5E0] transition-colors"
            >
              <FaXTwitter size={18} />
            </a>
            <Link
              href="/guidelines"
              className="text-[#64748B] text-sm no-underline hover:text-[#33C5E0] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/guidelines"
              className="text-[#64748B] text-sm no-underline hover:text-[#33C5E0] transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
