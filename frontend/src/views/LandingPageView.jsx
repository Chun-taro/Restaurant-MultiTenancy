import React, { useState } from 'react';

export default function LandingPageView({
  onGoToLogin,
  onGoToConsole,
  isAuthenticated,
  tenants = [],
  onOpenTenantPortal,
  onOpenStorefront,
  onQuickProvisionDemo,
  isProvisioningDemo = false
}) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [activeFaq, setActiveFaq] = useState(null);

  const hasLiveTenants = Boolean(tenants && tenants.length > 0);

  const showcaseTenants = hasLiveTenants
    ? tenants.map(t => ({
        name: t.name,
        slug: t.slug,
        cuisine: t.cuisine_type || 'Dining & Drinks',
        city: t.city || 'Metro Manila',
        subdomain: t.subdomain || t.slug,
        logo: t.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
        color: t.primary_color || '#6366F1',
        tagline: `${t.cuisine_type || 'Gourmet'} restaurant powered by RestoSaaS`
      }))
    : [];

  const [selectedShowcaseSlug, setSelectedShowcaseSlug] = useState('');
  const effectiveSelectedSlug = selectedShowcaseSlug || showcaseTenants[0]?.slug;
  const activeShowcaseTenant = showcaseTenants.find(t => t.slug === effectiveSelectedSlug) || showcaseTenants[0];

  const plans = [
    {
      name: 'Starter Cafe',
      price: billingCycle === 'monthly' ? '₱1,499' : '₱14,990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      desc: 'Ideal for food trucks, pop-up kiosks, coffee bars, and small bistros starting digital ordering.',
      features: ['Up to 40 Menu Items', '2 Staff / Cashier Accounts', '300 Monthly Orders', 'QR Table Ordering & Menus', 'Maya & Card Payments', 'Standard Email Support']
    },
    {
      name: 'Growth Bistro',
      price: billingCycle === 'monthly' ? '₱2,999' : '₱29,990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      popular: true,
      desc: 'Standard tier for full-service dining, bistros, and expanding culinary brands.',
      features: ['Up to 150 Menu Items', '6 Staff Accounts', '1,500 Monthly Orders', 'Custom Subdomain & Domain Mapping', 'Real-Time Kitchen Display', 'Advanced Sales Analytics', '2.0% Low Platform Fee']
    },
    {
      name: 'Pro Restaurant',
      price: billingCycle === 'monthly' ? '₱5,499' : '₱54,990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      desc: 'Comprehensive powerhouse for high-volume dining rooms, multi-branch groups & bars.',
      features: ['Unlimited Menu Items', '15 Staff Accounts', 'Unlimited Monthly Orders', 'Inventory & Modifiers Control', 'Multi-terminal Kitchen Routing', '1.2% Priority Platform Fee', 'Priority 24/7 SLA']
    },
    {
      name: 'Enterprise Franchise',
      price: billingCycle === 'monthly' ? '₱12,999' : '₱129,990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      desc: 'Tailored for restaurant chains, hospitality franchises, and multi-concept food halls.',
      features: ['Unlimited Outlets & Products', '50 Staff Accounts', 'Dedicated Cloud Cluster Partition', 'Custom Domain SSL Auto-Provisioning', '0.5% Enterprise Platform Fee', 'Custom POS Integrations', 'Dedicated Account Manager']
    }
  ];

  const faqs = [
    {
      q: 'How does multi-tenant data isolation protect each restaurant?',
      a: 'RestoSaaS uses strict data partitioning. Each tenant has an isolated data context, guaranteeing that order logs, sales metrics, customer lists, and staff credentials cannot be accessed across different restaurant stores.'
    },
    {
      q: 'How does QR table ordering work for customers?',
      a: 'Each dining table has a unique QR code (e.g. Table 1, Table 4). Customers scan the QR code using any smartphone camera without downloading any mobile app. The digital menu opens immediately in their browser, allows them to add customizations and modifiers, and lets them pay via Maya, GCash, cards, or at the counter.'
    },
    {
      q: 'Can restaurant owners link their own custom web domains?',
      a: 'Yes. In addition to their default subdomains (such as brandobar.restosaas.ph), Pro and Enterprise tenants can bind custom domains (e.g. order.brandobar.com) with automatic SSL certificate routing.'
    },
    {
      q: 'Can I test multiple restaurant environments at once?',
      a: 'Yes! Use the Live Demo Showcase section below or access individual tenant portals from the Super Admin cockpit to test different restaurant themes, menus, and order queues side by side.'
    }
  ];

  return (
    <div className="landing-page-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', position: 'relative', zIndex: 1 }}>
      {/* Top Navigation */}
      <nav style={{
        height: '76px',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.88)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <i className="ri-store-3-fill"></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              RestoSaaS <span className="brand-badge" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--primary-light)', border: '1px solid rgba(59,130,246,0.25)', fontSize: '10px' }}>ENTERPRISE</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Multi-Tenant Restaurant Platform</div>
          </div>
        </div>

        {/* Center Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#architecture" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Features</a>
          <a href="#demos" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Live Demos</a>
          <a href="#pricing" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Pricing</a>
          <a href="#faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>FAQ</a>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="system-status-pill" style={{ padding: '5px 12px', fontSize: '12px' }}>
            <span className="pulse-dot"></span>
            <span>Cloud Network Operational</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}
            onClick={isAuthenticated ? onGoToConsole : onGoToLogin}
          >
            <i className={isAuthenticated ? "ri-dashboard-line" : "ri-shield-keyhole-line"}></i>
            {isAuthenticated ? 'Super Admin Console' : 'Super Admin Sign In'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '90px 24px 70px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '920px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(224, 90, 43, 0.12)',
            border: '1px solid rgba(224, 90, 43, 0.25)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--primary-light)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            marginBottom: '24px'
          }}>
            <i className="ri-fire-fill" style={{ color: 'var(--primary)' }}></i> Multi-Tenant Restaurant Cloud Platform
          </div>

          <h1 style={{
            fontSize: '52px',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            color: '#FFFFFF'
          }}>
            One Unified Platform.
            <br />
            <span style={{ color: '#F08358' }}>
              Infinite Branded Restaurant Stores.
            </span>
          </h1>

          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '720px',
            margin: '0 auto 40px',
            lineHeight: 1.65
          }}>
            Launch, manage, and monetize hundreds of standalone restaurant brands from a single master dashboard.
            Every restaurant receives independent branding, contactless QR table ordering, live kitchen portals,
            and automated billing.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '15px', fontWeight: 700 }}
              onClick={isAuthenticated ? onGoToConsole : onGoToLogin}
            >
              <i className="ri-shield-user-fill"></i> Super Admin Console
            </button>
            <a
              href="#demos"
              className="btn btn-secondary"
              style={{ padding: '14px 28px', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}
            >
              <i className="ri-play-circle-line" style={{ color: 'var(--emerald)' }}></i> Explore Live Restaurant Demos
            </a>
          </div>

          {/* Quick specs pill bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            maxWidth: '860px',
            margin: '64px auto 0',
            textAlign: 'left'
          }}>
            <div className="card" style={{ padding: '18px 20px', background: 'rgba(17, 24, 39, 0.7)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Architecture</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>Tenant Isolation</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Independent data partitioning</div>
            </div>

            <div className="card" style={{ padding: '18px 20px', background: 'rgba(17, 24, 39, 0.7)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Deployment</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>Instant Provisioning</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Live stores in seconds</div>
            </div>

            <div className="card" style={{ padding: '18px 20px', background: 'rgba(17, 24, 39, 0.7)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Dining Experience</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>QR Table Ordering</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Zero-app mobile browser flow</div>
            </div>

            <div className="card" style={{ padding: '18px 20px', background: 'rgba(17, 24, 39, 0.7)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Checkout Rails</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>Maya & GCash Ready</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Instant online & cash checkout</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Multi-Tenant Demo Showcase Section */}
      <section id="demos" style={{
        padding: '80px 24px',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(11, 15, 25, 0.95) 100%)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--emerald)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px'
            }}>
              <i className="ri-live-line"></i> Interactive Multi-Tenant Showcase
            </div>
            <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Experience Any Active Restaurant Environment
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '640px', margin: '10px auto 0', lineHeight: 1.6 }}>
              Select any provisioned restaurant below to preview their dedicated customer storefront and kitchen management portal in real time.
            </p>
          </div>

          {!hasLiveTenants ? (
            <div className="card" style={{
              padding: '44px 36px',
              textAlign: 'center',
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px dashed rgba(99, 102, 241, 0.35)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              marginTop: '28px'
            }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                margin: '0 auto 18px',
                border: '1px solid rgba(99, 102, 241, 0.25)'
              }}>
                <i className="ri-store-3-line"></i>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: 'var(--primary-light)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '16px'
              }}>
                <i className="ri-information-line"></i>
                <span>Clean Database — Zero Restaurants Provisioned</span>
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                No Live Restaurants In Database Yet
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', maxWidth: '620px', margin: '0 auto 28px', lineHeight: 1.65 }}>
                The platform database is freshly initialized with zero fake tenants. You can create your first restaurant in the Super Admin Console, or click the button below to instantly deploy a live demo restaurant with sample menus and QR tables.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {onQuickProvisionDemo && (
                  <button
                    className="btn btn-emerald"
                    style={{ padding: '13px 26px', fontSize: '14px', fontWeight: 700 }}
                    onClick={onQuickProvisionDemo}
                    disabled={isProvisioningDemo}
                  >
                    <i className={isProvisioningDemo ? "ri-loader-4-line ri-spin" : "ri-magic-line"}></i>
                    {isProvisioningDemo ? 'Provisioning Demo Store...' : '🚀 Quick Provision Demo Restaurant (1-Click)'}
                  </button>
                )}

                <button
                  className="btn btn-primary"
                  style={{ padding: '13px 26px', fontSize: '14px', fontWeight: 700 }}
                  onClick={isAuthenticated ? onGoToConsole : onGoToLogin}
                >
                  <i className="ri-shield-user-fill"></i>
                  {isAuthenticated ? 'Open Super Admin to Provision' : 'Super Admin Sign In'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Restaurant Selector Tabs */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                marginTop: '28px'
              }}>
                {showcaseTenants.map((t) => {
                  const isSelected = t.slug === activeShowcaseTenant?.slug;
                  return (
                    <button
                      key={t.slug}
                      onClick={() => setSelectedShowcaseSlug(t.slug)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 18px',
                        borderRadius: 'var(--radius-pill)',
                        border: isSelected ? `2px solid ${t.color || 'var(--primary)'}` : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: isSelected ? 700 : 500,
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? `0 0 16px ${t.color}33` : 'none'
                      }}
                    >
                      <img
                        src={t.logo}
                        alt={t.name}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span>{t.name}</span>
                      {isSelected && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color || 'var(--primary)' }}></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Tenant Feature Card */}
              {activeShowcaseTenant && (
                <div className="card" style={{
                  padding: '32px 36px',
                  borderTop: `4px solid ${activeShowcaseTenant.color || 'var(--primary)'}`,
                  background: 'rgba(17, 24, 39, 0.85)',
                  boxShadow: 'var(--shadow-xl)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: '36px',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <img
                          src={activeShowcaseTenant.logo}
                          alt={activeShowcaseTenant.name}
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: 'var(--radius-lg)',
                            objectFit: 'cover',
                            border: '2px solid rgba(255,255,255,0.1)'
                          }}
                        />
                        <div>
                          <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                            {activeShowcaseTenant.name}
                          </h3>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span><i className="ri-map-pin-2-line" style={{ color: 'var(--primary-light)' }}></i> {activeShowcaseTenant.city}</span>
                            <span>·</span>
                            <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>{activeShowcaseTenant.cuisine}</span>
                          </div>
                        </div>
                      </div>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '22px' }}>
                        {activeShowcaseTenant.tagline}. Each restaurant tenant operates under its own isolated partition, menu matrix, table layout, and staff roles.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                          <i className="ri-global-line" style={{ color: '#38BDF8' }}></i>
                          <span>Tenant Subdomain: </span>
                          <code style={{ color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>https://{activeShowcaseTenant.subdomain}.restosaas.ph</code>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                          <i className="ri-shield-check-line" style={{ color: 'var(--emerald)' }}></i>
                          <span>Partition: </span>
                          <code style={{ color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>partition_{activeShowcaseTenant.slug} (Isolated)</code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '12px 22px', fontSize: '14px', fontWeight: 700 }}
                          onClick={() => onOpenStorefront(activeShowcaseTenant.slug)}
                        >
                          <i className="ri-store-2-line"></i> Customer Storefront ↗
                        </button>
                        <button
                          className="btn btn-emerald"
                          style={{ padding: '12px 22px', fontSize: '14px', fontWeight: 700 }}
                          onClick={() => onOpenTenantPortal(activeShowcaseTenant.slug)}
                        >
                          <i className="ri-dashboard-2-line"></i> Tenant Portal ↗
                        </button>
                      </div>
                    </div>

                    {/* Right Quick Preview Box */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Included in this restaurant tier
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="ri-qr-code-line"></i>
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontSize: '13.5px', fontWeight: 600 }}>QR Table Ordering Engine</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>Instant table-assigned orders with zero staff bottlenecks.</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="ri-restaurant-line"></i>
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontSize: '13.5px', fontWeight: 600 }}>Kitchen Display System (KDS)</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>Real-time ticket updates as chefs cook and dispatch meals.</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="ri-bank-card-line"></i>
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontSize: '13.5px', fontWeight: 600 }}>Omnichannel Local Checkout</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>Maya, GCash, Card, and Cash counter billing settlement.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Multi-Tenancy Architecture Pillars */}
      <section id="architecture" style={{ padding: '90px 24px', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '54px' }}>
            <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              The Three Core Engines of RestoSaaS
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '640px', margin: '10px auto 0', lineHeight: 1.6 }}>
              Built for enterprise scalability, complete data security, and frictionless dining workflows.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div className="card" style={{ borderTop: '4px solid var(--primary)', padding: '28px 24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '18px' }}>
                <i className="ri-shield-star-line"></i>
              </div>
              <h3 style={{ color: '#fff', fontSize: '19px', fontWeight: 700, marginBottom: '10px' }}>Super Admin Cockpit</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '18px' }}>
                Master control center to provision restaurant accounts, configure subscription pricing tiers, track MRR revenue, manage platform staff, and audit actions.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Automated Restaurant Provisioning</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> 1-Click Owner Impersonation</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Recurring Subscription Billing Ledger</li>
              </ul>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--emerald)', padding: '28px 24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '18px' }}>
                <i className="ri-restaurant-2-line"></i>
              </div>
              <h3 style={{ color: '#fff', fontSize: '19px', fontWeight: 700, marginBottom: '10px' }}>Restaurant Manager Portal</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '18px' }}>
                Dedicated dashboard for restaurant managers and chefs to curate digital menus, customize logo branding colors, monitor live orders, and review sales.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Dynamic Categories & Modifiers</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Real-Time Kitchen Order Screen</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Table QR Code Generator & Export</li>
              </ul>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--amber)', padding: '28px 24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '18px' }}>
                <i className="ri-qr-code-line"></i>
              </div>
              <h3 style={{ color: '#fff', fontSize: '19px', fontWeight: 700, marginBottom: '10px' }}>Customer QR Storefront</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '18px' }}>
                Mobile-optimized web storefront customized with the restaurant's brand colors, fast menu filtering, table assignment, and instant digital payments.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> App-Free Frictionless Mobile Ordering</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Native Maya & GCash Payment Rails</li>
                <li><i className="ri-check-line" style={{ color: 'var(--emerald)' }}></i> Real-Time Order Status Tracker</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '90px 24px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Simple, Transparent SaaS Pricing
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '8px' }}>
              Manage subscription tiers, feature gates, and transaction rates directly within the Super Admin console.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-pill)', padding: '4px', marginTop: '24px' }}>
              <button
                className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-pill)', padding: '6px 20px', fontWeight: 600 }}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly Billing
              </button>
              <button
                className={`btn btn-sm ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-pill)', padding: '6px 20px', fontWeight: 600 }}
                onClick={() => setBillingCycle('yearly')}
              >
                Annual Billing <span style={{ fontSize: '10.5px', color: '#34D399', fontWeight: 700 }}>(Save 17%)</span>
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
                  style={{ width: '100%', marginTop: 'auto', padding: '11px', fontWeight: 700 }}
                  onClick={onGoToLogin}
                >
                  Manage in Super Admin
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" style={{ padding: '80px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', marginTop: '6px' }}>
              Everything you need to know about the RestoSaaS platform architecture.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '18px 24px',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border-subtle)'
                  }}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '15.5px', fontWeight: 700, color: '#fff' }}>
                      {faq.q}
                    </h4>
                    <i className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} style={{ fontSize: '20px', color: 'var(--primary-light)' }}></i>
                  </div>
                  {isOpen && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '12px', lineHeight: 1.6 }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '40px 40px 30px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.95)',
        fontSize: '13px',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          maxWidth: '1160px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px'
            }}>
              <i className="ri-store-3-fill"></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff' }}>RestoSaaS Platform</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enterprise Multi-Tenant Restaurant OS</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#architecture" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Platform</a>
            <a href="#demos" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Live Demos</a>
            <a href="#pricing" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Pricing</a>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              onClick={onGoToLogin}
            >
              Super Admin Portal
            </button>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            © 2026 RestoSaaS Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
