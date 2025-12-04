'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { 
  FiShield, 
  FiClock, 
  FiUsers, 
  FiLock, 
  FiZap, 
  FiGlobe,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi';

export default function HomePage() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: <FiShield />,
      title: 'Secure & Trustless',
      description: 'Smart contracts on Lisk blockchain. No intermediaries needed.',
    },
    {
      icon: <FiClock />,
      title: 'Automated Distribution',
      description: 'Lump sum, monthly, quarterly, or yearly distributions.',
    },
    {
      icon: <FiUsers />,
      title: 'Multiple Beneficiaries',
      description: 'Add up to 10 beneficiaries with custom allocations.',
    },
    {
      icon: <FiLock />,
      title: 'Privacy Protected',
      description: 'Beneficiary data hashed on-chain for privacy.',
    },
    {
      icon: <FiZap />,
      title: 'Instant Claims',
      description: 'Beneficiaries claim instantly when time arrives.',
    },
    {
      icon: <FiGlobe />,
      title: 'Global Access',
      description: 'Access from anywhere with a Web3 wallet.',
    },
  ];

  const steps = [
    { num: '01', title: 'Connect Wallet', desc: 'Link your Web3 wallet' },
    { num: '02', title: 'Complete KYC', desc: 'Verify your identity' },
    { num: '03', title: 'Create Plan', desc: 'Set up your inheritance' },
    { num: '04', title: 'Auto Distribute', desc: 'Assets transfer on date' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E12' }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(10, 14, 18, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'white', fontWeight: 700, fontSize: 18 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #33C5E0, #1A8A9E)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>IX</div>
            InheritX
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div className="hide-mobile" style={{ display: 'flex', gap: 32 }}>
              <a href="#features" style={{ color: '#A0AEC0', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
              <a href="#how-it-works" style={{ color: '#A0AEC0', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>How It Works</a>
            </div>
            
            {mounted && (
              isConnected ? (
                <Link href="/dashboard" className="btn btn-primary btn-sm">
                  Dashboard <FiArrowRight size={14} />
                </Link>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button onClick={openConnectModal} className="btn btn-primary">
                      Connect Wallet
                    </button>
                  )}
                </ConnectButton.Custom>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(51, 197, 224, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }} />

        <motion.div 
          style={{ maxWidth: 800, textAlign: 'center', position: 'relative', zIndex: 1 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(51, 197, 224, 0.1)',
              border: '1px solid rgba(51, 197, 224, 0.2)',
              borderRadius: 100,
              fontSize: 13,
              color: '#33C5E0',
              marginBottom: 32
            }}
          >
            <FiZap size={14} />
            Built on Lisk Blockchain
          </motion.div>

          <h1 style={{ 
            fontSize: 'clamp(40px, 8vw, 72px)', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            marginBottom: 24,
            letterSpacing: '-0.02em'
          }}>
            The Future of<br />
            <span style={{ 
              background: 'linear-gradient(135deg, #33C5E0 0%, #5ED4E8 50%, #33C5E0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Digital Inheritance
            </span>
          </h1>

          <p style={{ 
            fontSize: 18, 
            color: '#A0AEC0', 
            marginBottom: 40,
            maxWidth: 560,
            margin: '0 auto 40px'
          }}>
            Create secure, automated inheritance plans for your digital assets. 
            Your legacy, protected by blockchain technology.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {mounted && (
              isConnected ? (
                <Link href="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard <FiArrowRight size={18} />
                </Link>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button onClick={openConnectModal} className="btn btn-primary btn-lg">
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
          <motion.div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 32, 
              marginTop: 80,
              paddingTop: 40,
              borderTop: '1px solid rgba(255,255,255,0.06)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { value: '$2M+', label: 'Assets Secured' },
              { value: '500+', label: 'Plans Created' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#33C5E0' }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: '#64748B' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '100px 24px', background: '#0D1117' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div 
            style={{ textAlign: 'center', marginBottom: 64 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontSize: 40, fontWeight: 700, marginBottom: 16 }}>
              Everything You Need
            </h2>
            <p style={{ fontSize: 18, color: '#A0AEC0', maxWidth: 500, margin: '0 auto' }}>
              Complete tools for secure digital inheritance planning.
            </p>
          </motion.div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 24 
          }}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                style={{
                  background: '#12181E',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 32,
                  transition: 'all 0.3s ease'
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  borderColor: 'rgba(51, 197, 224, 0.3)',
                  transform: 'translateY(-4px)'
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  background: 'rgba(51, 197, 224, 0.1)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#33C5E0',
                  fontSize: 20,
                  marginBottom: 20
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 14, color: '#A0AEC0', lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
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
            <h2 style={{ fontSize: 40, fontWeight: 700, marginBottom: 16 }}>
              How It Works
            </h2>
            <p style={{ fontSize: 18, color: '#A0AEC0' }}>
              Four simple steps to secure your digital legacy.
            </p>
          </motion.div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: 24 
          }}>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                style={{
                  background: '#12181E',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 32,
                  position: 'relative'
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div style={{ 
                  fontSize: 48, 
                  fontWeight: 800, 
                  color: 'rgba(51, 197, 224, 0.2)',
                  marginBottom: 16
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: '#A0AEC0' }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section style={{ padding: '100px 24px', background: '#0D1117' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 64,
            alignItems: 'center'
          }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 20 }}>
                Security First
              </h2>
              <p style={{ fontSize: 16, color: '#A0AEC0', marginBottom: 32, lineHeight: 1.7 }}>
                Your inheritance plans are protected by multiple layers of security.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  'Smart contracts audited by leading firms',
                  'Beneficiary data hashed using keccak256',
                  'Claim codes encrypted before storage',
                  'Non-custodial - you control your assets',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      background: 'rgba(16, 185, 129, 0.15)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FiCheck size={14} color="#10B981" />
                    </div>
                    <span style={{ fontSize: 14, color: '#A0AEC0' }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              style={{ display: 'flex', justifyContent: 'center' }}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div style={{
                width: 200,
                height: 200,
                background: 'linear-gradient(135deg, rgba(51, 197, 224, 0.1), rgba(139, 92, 246, 0.1))',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(51, 197, 224, 0.2)'
              }}>
                <FiShield size={64} color="#33C5E0" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 24px' }}>
        <motion.div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(51, 197, 224, 0.1), rgba(139, 92, 246, 0.05))',
            border: '1px solid rgba(51, 197, 224, 0.2)',
            borderRadius: 24,
            padding: '64px 48px',
            textAlign: 'center'
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>
            Ready to Secure Your Legacy?
          </h2>
          <p style={{ fontSize: 16, color: '#A0AEC0', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Join users who trust InheritX for their digital inheritance planning.
          </p>
          {mounted && (
            isConnected ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard <FiArrowRight size={18} />
              </Link>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button onClick={openConnectModal} className="btn btn-primary btn-lg">
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
        padding: '32px 24px', 
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#33C5E0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#0A0E12' }}>IX</div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>InheritX</span>
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            © 2024 InheritX. Built on Lisk.
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
