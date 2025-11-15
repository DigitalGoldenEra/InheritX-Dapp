import Image from "next/image";
import Link from "next/link";
import Navbar from "@/src/components/layouts/Navbar";
import { processSteps, benefitCards } from "@/src/data/static";
import {
  FaArrowRight,
  FaPhone,
  FaTwitter,
  FaLinkedin,
  FaDiscord,
  FaGithub,
} from "react-icons/fa";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#161E22] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-[-15%] h-112 w-md rounded-full bg-[radial-gradient(circle_at_center,rgba(51,197,224,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute -bottom-40 left-[-10%] h-120 w-120 rounded-full bg-[radial-gradient(circle_at_center,rgba(51,197,224,0.14),transparent_65%)] blur-2xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-360 flex-col gap-24 px-6 pb-16 pt-5 md:px-12 lg:px-20">
        <Navbar />

        <section
          id="hero"
          className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
        >
          <div className="flex flex-col gap-8">
            <div className="max-w-2xl space-y-6">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#33C5E0]">
                From your hands to theirs
                <span className="h-px w-12 bg-[#33C5E0]/40" />
              </p>
              <h1 className="text-4xl font-inheritx-display leading-[1.15] text-slate-100 sm:text-5xl lg:text-6xl">
                From Your Hands, <br></br>To theirs Without A Hitch.
          </h1>
              <p className="max-w-xl text-base text-slate-400 sm:text-lg">
                InheritX guides your wealth to the people who matter most. Plan
                once, share securely, and rest easy knowing every branch of your
                legacy is covered.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 rounded-full bg-[#33C5E0] px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#0D1A1E] "
              >
                Start Now
                <FaArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="#benefits"
                className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300 transition-colors hover:text-slate-50"
              >
                Why It Matters
              </Link>
            </div>
          </div>

          <div className="relative hidden min-h-104 overflow-hidden rounded-[2.5rem] p-10 lg:block">
            <img src="/img/hero-img.png" alt="InheritX hero image" className="w-full h-full object-cover" />
          </div>
        </section>

        <section
          id="how-it-works"
          className="relative grid gap-12 rounded-[2.5rem] border border-slate-800/70 bg-linear-to-br from-[#1C252A] via-[#141D21] to-[#11181C] p-10 md:p-14"
        >
          <div className="space-y-5">
            <h2 className="text-3xl font-inheritx-display text-slate-100 sm:text-4xl">
              What Is InheritX?
            </h2>
            <p className="text-slate-400">
              InheritX helps you plan and share your assets with the right
              people, at the right time. We make inheritance simple, secure, and
              stress-free — without unnecessary delays or complications.
            </p>
            <p className="text-slate-400">
              Think of it as planting a tree: your roots are the assets you&apos;ve
              built, and we make sure the branches grow to those you care about
              most.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <div
                key={step.id}
                className="relative flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-[#0F171B]/80 p-6 shadow-[0_12px_30px_rgba(15,23,27,0.36)]"
              >
                <div className="flex items-center gap-3 text-[#0D1A1E]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#33C5E0]/90 text-sm font-semibold"
                    aria-hidden="true"
                  >
                    {step.id}
                  </span>
                  <span className="rounded-full bg-[#33C5E0]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-[#33C5E0]">
                    Step {index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-100">
                  <div className="rounded-xl bg-[#33C5E0]/10 p-3 text-[#33C5E0]">
                    {(() => {
                      const Icon = step.icon;
                      return <Icon className={step.iconClassName} />;
                    })()}
                  </div>
                  <h3 className="text-lg font-inheritx-display">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 rounded-2xl border border-[#33C5E0]/30 bg-[#0F181C]/80 p-6 shadow-[0_12px_40px_rgba(51,197,224,0.18)] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:p-8">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-[#33C5E0]">
                Why this works
              </p>
              <h3 className="text-3xl font-inheritx-display text-slate-100">
                Starts with purpose, ends with peace of mind.
              </h3>
              <p className="text-sm text-slate-400">
                We tie every instruction to your original intention, safeguard
                the transfer rules you set, and automate the notifications so no
                branch is left behind. It&apos;s your tree, in full bloom.
              </p>
            </div>
          </div>
        </section>

        <section
          id="benefits"
          className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <div className="space-y-5">
            <h2 className="text-3xl font-inheritx-display text-slate-100 sm:text-4xl">
              Benefits of InheritX
            </h2>
            <p className="text-slate-400">
              Here&apos;s why families trust us. InheritX keeps your instructions
              secure, your beneficiaries informed, and your legacy intact — all
              while reducing paperwork to a few guided steps.
            </p>
          </div>

          <div className="grid gap-6 md:col-span-2 md:grid-cols-4">
            {benefitCards.map((benefit) => (
              <div
                key={benefit.title}
                className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-[#10181C]/85 p-6 transition-transform hover:-translate-y-1 hover:border-[#33C5E0]/40"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#33C5E0]/10 text-[#33C5E0]">
                  {(() => {
                    const Icon = benefit.icon;
                    return <Icon className={benefit.iconClassName} />;
                  })()}
                </div>
                <h3 className="text-lg font-inheritx-display text-slate-100">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call To Action */}
        <section
          id="cta"
          className="flex flex-col items-center gap-6 rounded-[2.5rem] border border-[#33C5E0]/30 bg-linear-to-br from-[#111B1F] via-[#152126] to-[#0D1519] p-12 text-center"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-[#33C5E0]">
            Ready When You Are
          </p>
          <h2 className="max-w-2xl text-3xl font-inheritx-display text-slate-100 sm:text-4xl">
            Create Your Plan, Share It Seamlessly, and Let Us Handle the Rest.
          </h2>
          <Link
            href="#hero"
            className="inline-flex items-center gap-3 rounded-full bg-[#33C5E0] px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#0D1A1E] shadow-[0_18px_40px_rgba(51,197,224,0.35)] transition-transform hover:-translate-y-0.5"
          >
            Create Your Plan
            <FaArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>

      <footer
        id="footer"
        className="border-t border-slate-800/70 bg-[#12191D]/80 py-16 text-sm"
      >
        <div className="mx-auto w-full max-w-360 px-6 md:px-12 lg:px-20">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Image
                  src="/img/logo.svg"
                  alt="InheritX logo"
                  width={48}
                  height={48}
                />
                <span className="text-lg font-inheritx-display tracking-[0.3em] text-slate-100">
                  INHERITX
                </span>
        </div>
              <p className="max-w-md text-sm text-slate-400 mb-6">
                Secure, seamless wealth transfer for the people who matter most.
                Plan your legacy with confidence.
              </p>
              {/* Social Media Icons */}
              <div className="flex items-center gap-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/30 text-slate-400 transition-all hover:border-[#33C5E0]/50 hover:bg-[#33C5E0]/10 hover:text-[#33C5E0]"
                  aria-label="Twitter"
                >
                  <FaTwitter className="text-lg" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/30 text-slate-400 transition-all hover:border-[#33C5E0]/50 hover:bg-[#33C5E0]/10 hover:text-[#33C5E0]"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="text-lg" />
                </a>
                <a
                  href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/30 text-slate-400 transition-all hover:border-[#33C5E0]/50 hover:bg-[#33C5E0]/10 hover:text-[#33C5E0]"
                  aria-label="Discord"
                >
                  <FaDiscord className="text-lg" />
          </a>
          <a
                  href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/30 text-slate-400 transition-all hover:border-[#33C5E0]/50 hover:bg-[#33C5E0]/10 hover:text-[#33C5E0]"
                  aria-label="GitHub"
                >
                  <FaGithub className="text-lg" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-inheritx-display uppercase tracking-[0.3em] text-slate-100 mb-4">
                Quick Links
              </h3>
              <nav className="flex flex-col gap-3">
                <Link
                  href="#hero"
                  className="text-sm text-slate-400 transition-colors hover:text-[#33C5E0]"
                >
                  Home
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-sm text-slate-400 transition-colors hover:text-[#33C5E0]"
                >
                  How It Works
                </Link>
                <Link
                  href="#benefits"
                  className="text-sm text-slate-400 transition-colors hover:text-[#33C5E0]"
                >
                  Benefits
                </Link>
                <Link
                  href="#cta"
                  className="text-sm text-slate-400 transition-colors hover:text-[#33C5E0]"
                >
                  Get Started
                </Link>
              </nav>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-inheritx-display uppercase tracking-[0.3em] text-slate-100 mb-4">
                Legal
              </h3>
              <nav className="flex flex-col gap-3">
                <Link
                  href="#"
                  className="text-sm text-slate-400 transition-colors hover:text-[#33C5E0]"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  className="text-sm text-slate-400 transition-colors hover:text-[#33C5E0]"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="#"
                  className="text-sm text-slate-400 transition-colors hover:text-[#33C5E0]"
                >
                  Code of Ethics
                </Link>
                <Link
                  href="#footer"
                  className="text-sm text-slate-400 transition-colors hover:text-[#33C5E0]"
                >
                  Support
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-slate-800/70 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} InheritX. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Built with security and transparency in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
