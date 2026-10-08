import React, { useState } from 'react';

export default function LandingPageView({ onGoToLogin, onGoToConsole, isAuthenticated, onOpenTenantPortal, onOpenStorefront }) {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'Starter Cafe',
      price: billingCycle === 'monthly' ? '₱1,499' : '₱14,990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      desc: 'Perfect for food trucks, pop-up kiosks, and small bistros starting their digital journey.',
      features: ['Up to 40 Menu Items', '2 Staff Accounts', '300 Monthly Orders', 'QR Table Ordering', 'Online Payments (Maya/Cards)']
    },
    {
      name: 'Growth Bistro',
      price: billingCycle === 'monthly' ? '₱2,999' : '₱29,990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      popular: true,
      desc: 'Standard tier for full-service dining, bistros, and expanding local favorites.',
      features: ['Up to 150 Menu Items', '6 Staff Accounts', '1,200 Monthly Orders', 'Custom Subdomain & Domain', 'Advanced Sales Analytics', '2.0% Low Platform Fee']
    },
    {
      name: 'Pro Restaurant',
      price: billingCycle === 'monthly' ? '₱5,499' : '₱54,990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      desc: 'Comprehensive powerhouse for multi-branch restaurants with high dine-in & delivery volumes.',
      features: ['Unlimited Menu Items', '15 Staff Accounts', 'Unlimited Monthly Orders', 'Raw Ingredient Inventory', 'Multi-terminal Support', '1.2% Priority Platform Fee']
    },
    {
      name: 'Enterprise Franchise',
      price: billingCycle === 'monthly' ? '₱12,999' : '₱129,990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      desc: 'Custom SLA, dedicated cloud database isolation, zero commission, and custom POS integration.',
      features: ['Unlimited Products & Branches', '50 Staff Accounts', 'Custom Domain Mapping', 'Dedicated Database Isolation', '0.5% Enterprise Fee', '24/7 Dedicated Support']
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-body)', color: 'var(--text-main)' }}>
      {/* Landing Navbar */}
      <nav style={{
        height: '74px',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary) 0%, #4338CA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px',
            boxShadow: '0 4px 14px var(--primary-glow)'
          }}>
            <i className="ri-store-3-fill"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              RestoSaaS <span className="brand-badge">SQLITE</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Multi-Tenant Restaurant Platform</div>
          </div>
        </div>

        {/* Center Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13.5px', fontWeight: 500 }}>Features</a>
          <a href="#architecture" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13.5px', fontWeight: 500 }}>Architecture</a>
          <a href="#pricing" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13.5px', fontWeight: 500 }}>SaaS Pricing</a>
        </div>

        {/* Right Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="system-status-pill" style={{ padding: '4px 10px', fontSize: '11.5px' }}>
            <span className="pulse-dot"></span>
            <span>Zero XAMPP · SQLite Native</span>
          </div>

          <button
            className="btn btn-primary btn-sm"
            style={{ padding: '8px 18px', fontSize: '13px' }}
            onClick={onGoToLogin}
          >
            <i className="ri-shield-keyhole-line"></i>
            {isAuthenticated ? 'Enter Super Admin' : 'Super Admin Login'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '90px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient background glow */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ maxWidth: '880px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--primary-light)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '24px'
          }}>
            <i className="ri-flashlight-fill"></i> Multi-Tenant Restaurant Management + Online Ordering Platform
          </div>

          <h1 style={{
            fontSize: '52px',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '22px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 60%, #94A3B8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            One Platform. Many Restaurants.
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #34D399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Each With Its Own Branded Experience.
            </span>
          </h1>

          <p style={{
            fontSize: '17px',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Instead of building separate apps for every restaurant, operate a single scalable SaaS engine.
            Each restaurant receives an isolated account, custom subdomains, digital menu, QR table ordering,
            and billing ledger.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="/admin"
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '14.5px', textDecoration: 'none' }}
              onClick={(e) => {
                e.preventDefault();
                onGoToLogin();
              }}
            >
              <i className="ri-shield-user-fill"></i> Super Admin Console (/admin)
            </a>
            <a
              href="/portal/brandobar"
              target="_blank"
              rel="noreferrer"
              className="btn btn-emerald"
              style={{ padding: '12px 24px', fontSize: '14.5px', textDecoration: 'none' }}
            >
              <i className="ri-dashboard-2-line"></i> Tenant Portal ↗ (/portal/brandobar)
            </a>
            <a
              href="/store/brandobar"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: '12px 24px', fontSize: '14.5px', textDecoration: 'none' }}
            >
              <i className="ri-store-2-line"></i> Customer Storefront ↗ (/store/brandobar)
            </a>
          </div>

          {/* Quick specs pill bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            maxWidth: '820px',
            margin: '60px auto 0',
            textAlign: 'left'
          }}>
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Architecture</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>Tenant Isolation</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Independent data partitioning</div>
            </div>

            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Zero Setup</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#34D399', marginTop: '4px' }}>No XAMPP Needed</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Runs on native SQLite engine</div>
            </div>

            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Dine-In & Pickup</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>QR Table Ordering</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Instant table QR codes</div>
            </div>

            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Local Checkout</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>Maya / GCash Ready</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Philippine payment rails</div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Tenancy Concept Section */}
      <section id="architecture" style={{ padding: '80px 24px', background: 'rgba(0,0,0,0.25)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              High-Level Multi-Tenant Architecture
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '640px', margin: '8px auto 0' }}>
              Built strictly according to Section 3 of the Architecture Proposal for maximum reliability and zero cross-tenant contamination.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div className="card" style={{ borderTop: '3px solid var(--primary)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
                <i className="ri-shield-star-line"></i>
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Super Admin Panel</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                Master cockpit to provision restaurants, control subscription tiers, monitor MRR growth, manage platform users, and review immutable audit logs.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Tenant Provisioning & Suspension</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> One-Click Owner Impersonation</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Subscription Plan Monetization</li>
              </ul>
            </div>

            <div className="card" style={{ borderTop: '3px solid var(--emerald)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
                <i className="ri-restaurant-2-line"></i>
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Restaurant Dashboard</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                Dedicated dashboard for restaurant owners and managers to upload menus, handle live orders, configure branding logos, and manage staff.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Menu Category & Item Catalog</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Live Kitchen Order Updates</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Custom Theme Color Preview</li>
              </ul>
            </div>

            <div className="card" style={{ borderTop: '3px solid var(--amber)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
                <i className="ri-qr-code-line"></i>
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Customer Storefront & PWA</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                Ultra-responsive mobile-first storefront accessible via subdomains (<code style={{ color: 'var(--primary-light)' }}>juansgrill.restosaas.ph</code>) or table QR codes.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Contactless QR Table Ordering</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Cart, Checkout & Maya Payment</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Real-Time Order Status Tracker</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Transparent SaaS Subscription Tiers
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px' }}>
              Configured directly inside the Super Admin panel with customizable commission rates.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)', padding: '3px', marginTop: '20px' }}>
              <button
                className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-pill)', padding: '5px 16px' }}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`btn btn-sm ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-pill)', padding: '5px 16px' }}
                onClick={() => setBillingCycle('yearly')}
              >
                Annual <span style={{ fontSize: '10px', color: '#34D399', fontWeight: 700 }}>(2 Months Free)</span>
              </button>
            </div>
          </div>

          <div className="plans-grid">
            {plans.map((p, idx) => (
              <div key={idx} className={`pricing-card ${p.popular ? 'popular' : ''}`}>
                {p.popular && <div className="popular-badge">Most Popular</div>}
                <div className="pricing-plan-name">{p.name}</div>
                <div className="pricing-plan-desc">{p.desc}</div>

                <div className="pricing-price-wrap">
                  <div className="pricing-amount">{p.price}</div>
                  <div className="pricing-period">{p.period}</div>
                </div>

                <ul className="pricing-features-list">
                  {p.features.map((f, fIdx) => (
                    <li key={fIdx} className="pricing-feature-item included">
                      <i className="ri-check-line"></i>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`btn ${p.popular ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', marginTop: 'auto' }}
                  onClick={onGoToLogin}
                >
                  Configure in Super Admin
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '30px 40px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ri-store-3-line" style={{ color: 'var(--primary-light)' }}></i>
          <span>RestoSaaS Multi-Tenant Architecture · Built with React + Express + SQLite</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontSize: '13px' }}
            onClick={onGoToLogin}
          >
            Super Admin Login
          </button>
          <span>·</span>
          <span>Zero XAMPP Dependency</span>
        </div>
      </footer>
    </div>
  );
}
