'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
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
  FiX
} from 'react-icons/fi';

const COLORS = {
  primary: '#33C5E0',
  primaryHover: '#2AB5CF',
  dark: '#050608',
  darkCard: '#0C0F12',
  darkSection: '#0A0D10',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(51,197,224,0.3)',
};

export default function HomePage() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { icon: FiLock, title: 'Non-Custodial', desc: 'You maintain full control. Assets stay in your wallet until distribution.' },
    { icon: FiShield, title: 'Privacy First', desc: 'Beneficiary data is hashed on-chain. Only verified claims succeed.' },
    { icon: FiClock, title: 'Flexible Timing', desc: 'Lump sum or scheduled distributions — monthly, quarterly, yearly.' },
    { icon: FiUsers, title: 'Multi-Beneficiary', desc: 'Add up to 10 beneficiaries with custom allocation percentages.' },
    { icon: FiZap, title: 'Instant Claims', desc: 'Beneficiaries claim instantly when conditions are met.' },
    { icon: FiGlobe, title: 'Global Access', desc: 'Access from anywhere. All you need is a Web3 wallet.' },
  ];

  const steps = [
    { step: '01', title: 'Connect', desc: 'Link your Web3 wallet securely' },
    { step: '02', title: 'Verify', desc: 'Complete KYC verification' },
    { step: '03', title: 'Create', desc: 'Set up your inheritance plan' },
    { step: '04', title: 'Relax', desc: 'Assets distribute automatically' },
  ];

  const stats = [
    { value: '$2M+', label: 'Assets Secured' },
    { value: '500+', label: 'Active Plans' },
    { value: '24/7', label: 'Availability' },
  ];

  const securityItems = [
    'Smart contracts audited by leading security firms',
    'Beneficiary data hashed using keccak256',
    'Encrypted claim codes — only beneficiaries can access',
    'Non-custodial architecture — you control everything',
  ];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.dark }}>
      {/* Ambient background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1000,
          height: 600,
          background: 'radial-gradient(ellipse at center, rgba(51,197,224,0.08), transparent 70%)' 
        }} />
      </div>

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(5,6,8,0.9)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          marginTop: '20px'
        }}>
          <Link href="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            textDecoration: 'none', 
            color: 'white', 
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700, 
            fontSize: 20
          }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              background: `linear-gradient(135deg, ${COLORS.primary}, #1A8A9E)`, 
              borderRadius: 10, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 800, 
              fontSize: 14,
              color: COLORS.dark
            }}>
              IX
            </div>
            InheritX
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="hide-on-mobile">
            <a href="#features" style={{ color: COLORS.textMuted, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
            <a href="#how-it-works" style={{ color: COLORS.textMuted, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>How It Works</a>
            <a href="#security" style={{ color: COLORS.textMuted, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Security</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {mounted && (
              isConnected ? (
                <Link href="/dashboard" className="btn btn-primary btn-sm">
                  Dashboard <FiArrowRight size={14} />
                </Link>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button onClick={openConnectModal} className="btn btn-primary">
                      Connect
                    </button>
                  )}
                </ConnectButton.Custom>
              )
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ 
                padding: 8, 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                color: COLORS.textMuted,
                display: 'none'
              }}
              className="show-on-mobile"
            >
              {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 24px 80px',
        position: 'relative'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              background: 'rgba(51,197,224,0.1)',
              border: '1px solid rgba(51,197,224,0.2)',
              borderRadius: 100,
              fontSize: 13,
              color: COLORS.primary,
              marginBottom: 40,
              fontWeight: 500
            }}>
              <span style={{ width: 6, height: 6, background: COLORS.primary, borderRadius: '50%' }} />
              Powered by Lisk Blockchain
            </div>

            {/* Headline */}
            <h1 style={{ 
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(42px, 4vw, 80px)', 
              fontWeight: 800, 
              lineHeight: 1, 
              marginBottom: 24,
              letterSpacing: '-0.03em'
            }}>
              <span style={{ color: '#fff' }}>SECURE YOUR</span>
              <br />
              <span style={{ color: COLORS.primary }}>DIGITAL LEGACY</span>
            </h1>

            <p style={{ 
              fontSize: 18, 
              color: COLORS.textMuted, 
              marginBottom: 48,
              maxWidth: 540,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7
            }}>
              Create automated inheritance plans for your crypto assets. 
              Trustless, private, and fully on-chain.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
              {mounted && (
                isConnected ? (
                  <Link href="/dashboard" className="btn btn-primary btn-lg">
                    Open Dashboard <FiArrowUpRight size={18} />
                  </Link>
                ) : (
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button onClick={openConnectModal} className="btn btn-primary btn-lg" style={{ minWidth: 180 }}>
                        Get Started <FiArrowRight size={18} />
                      </button>
                    )}
                  </ConnectButton.Custom>
                )
              )}
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
              {stats.map((stat, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 32, 
                    fontWeight: 800, 
                    color: '#fff'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textDim, marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '100px 24px', background: COLORS.darkSection }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div 
            style={{ marginBottom: 64 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              letterSpacing: 2, 
              color: COLORS.primary, 
              marginBottom: 12,
              textTransform: 'uppercase'
            }}>
              Features
            </p>
            <h2 style={{ 
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(32px, 5vw, 48px)', 
              fontWeight: 700, 
              maxWidth: 600,
              lineHeight: 1.1,
              color: '#fff'
            }}>
              Everything you need for digital estate planning
            </h2>
          </motion.div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 16 
          }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  style={{
                    background: COLORS.darkCard,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 16,
                    padding: 28,
                    transition: 'all 0.3s ease'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ borderColor: COLORS.borderHover }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(51,197,224,0.1)',
                    color: COLORS.primary,
                    marginBottom: 20
                  }}>
                    <Icon size={22} />
                  </div>
                  <h3 style={{ 
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 18, 
                    fontWeight: 600, 
                    marginBottom: 8,
                    color: '#fff'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6 }}>
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div 
            style={{ textAlign: 'center', marginBottom: 64 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              letterSpacing: 2, 
              color: COLORS.primary, 
              marginBottom: 12,
              textTransform: 'uppercase'
            }}>
              Process
            </p>
            <h2 style={{ 
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(32px, 5vw, 48px)', 
              fontWeight: 700,
              color: '#fff'
            }}>
              How it works
            </h2>
          </motion.div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 32
          }}>
            {steps.map((item, index) => (
              <motion.div
                key={index}
                style={{ textAlign: 'center', padding: 16 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div style={{
                  width: 72,
                  height: 72,
                  margin: '0 auto 20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(51,197,224,0.1)',
                  border: '1px solid rgba(51,197,224,0.2)',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: COLORS.primary
                }}>
                  {item.step}
                </div>
                <h3 style={{ 
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 20, 
                  fontWeight: 700, 
                  marginBottom: 8,
                  color: '#fff'
                }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, color: COLORS.textMuted }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" style={{ padding: '100px 24px', background: COLORS.darkSection }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            style={{
              background: 'linear-gradient(135deg, rgba(51,197,224,0.05), transparent)',
              border: '1px solid rgba(51,197,224,0.1)',
              borderRadius: 24,
              padding: 'clamp(32px, 6vw, 64px)',
              position: 'relative',
              overflow: 'hidden'
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: 48,
              alignItems: 'center'
            }}>
              <div>
                <p style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  letterSpacing: 2, 
                  color: COLORS.primary, 
                  marginBottom: 12,
                  textTransform: 'uppercase'
                }}>
                  Security
                </p>
                <h2 style={{ 
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 'clamp(28px, 4vw, 40px)', 
                  fontWeight: 700, 
                  marginBottom: 20,
                  color: '#fff'
                }}>
                  Built for trust
                </h2>
                <p style={{ fontSize: 15, color: COLORS.textMuted, marginBottom: 28, lineHeight: 1.7 }}>
                  Your inheritance plans are protected by multiple layers of security. 
                  We never have access to your assets.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {securityItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: COLORS.primary,
                        flexShrink: 0,
                        marginTop: 2
                      }}>
                        <FiCheck size={12} color="#000" />
                      </div>
                      <span style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src="/img/hero-img.png" alt="Security" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 24px' }}>
        <motion.div
          style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={{ 
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)', 
            fontWeight: 700, 
            marginBottom: 16,
            color: '#fff'
          }}>
            Ready to secure your legacy?
          </h2>
          <p style={{ fontSize: 16, color: COLORS.textMuted, marginBottom: 36, maxWidth: 450, marginLeft: 'auto', marginRight: 'auto' }}>
            Join thousands who trust InheritX for their digital inheritance planning.
          </p>
          {mounted && (
            isConnected ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard <FiArrowUpRight size={18} />
              </Link>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button onClick={openConnectModal} className="btn btn-primary btn-lg" style={{ minWidth: 180 }}>
                    Start Now <FiArrowRight size={18} />
                  </button>
                )}
              </ConnectButton.Custom>
            )
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '28px 24px', 
        borderTop: `1px solid ${COLORS.border}`
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            fontFamily: "'Syne', sans-serif"
          }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              background: COLORS.primary, 
              borderRadius: 6, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 700, 
              fontSize: 10,
              color: COLORS.dark
            }}>
              IX
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>InheritX</span>
          </div>
          <div style={{ fontSize: 13, color: COLORS.textDim }}>
            © 2024 InheritX. Built on Lisk.
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ fontSize: 13, color: COLORS.textDim, textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ fontSize: 13, color: COLORS.textDim, textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ fontSize: 13, color: COLORS.textDim, textDecoration: 'none' }}>Docs</a>
          </div>
        </div>
      </footer>

      {/* Mobile responsive styles */}
      <style jsx global>{`
        .hide-on-mobile {
          display: flex;
        }
        .show-on-mobile {
          display: none !important;
        }
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none !important;
          }
          .show-on-mobile {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
