"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const revealEls = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        :root {
          --paper: #F1ECD9;
          --paper-deep: #E9E2CC;
          --line: #D3CBB2;
          --line-strong: #B9AE8D;
          --ink: #23281F;
          --ink-soft: #5B5744;
          --forest: #2F6F5E;
          --forest-dark: #204E42;
          --forest-tint: #E4EEE9;
          --brass: #A9791F;
          --brass-tint: #F3E6C6;
          --rust: #A13D2C;
          --card: #FCFAF3;
          --radius: 3px;
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          background: var(--paper);
          color: var(--ink);
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.55;
          -webkit-font-smoothing: antialiased;
        }
        h1, h2, h3 { font-family: 'Fraunces', serif; margin: 0; color: var(--ink); font-weight: 600; }
        a { color: inherit; text-decoration: none; }
        .mono { font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.02em; }
        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--forest);
          font-weight: 600;
        }
        .wrap { max-width: 1120px; margin: 0 auto; padding: 0 32px; }
        img, svg { display: block; max-width: 100%; }

        header.nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(241,236,217,0.92);
          backdrop-filter: blur(6px);
          border-bottom: 1px solid var(--line);
        }
        .nav-inner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 32px;
          max-width: 1120px; margin: 0 auto;
        }
        .wordmark {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Fraunces', serif; font-weight: 600; font-size: 19px;
        }
        .wordmark .tab {
          width: 22px; height: 28px;
          background: var(--forest);
          border-radius: 2px 6px 6px 2px;
          position: relative;
        }
        .wordmark .tab::after {
          content: "";
          position: absolute; left: 4px; top: 6px; right: 4px;
          height: 2px; background: var(--brass-tint);
          box-shadow: 0 6px 0 var(--brass-tint), 0 12px 0 var(--brass-tint);
        }
        nav.links { display: flex; align-items: center; gap: 30px; font-size: 14.5px; font-weight: 500; }
        nav.links a.muted { color: var(--ink-soft); transition: color .15s; }
        nav.links a.muted:hover { color: var(--forest-dark); }
        .btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 11px 22px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14.5px;
          border-radius: var(--radius);
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
        }
        .btn-primary { background: var(--forest); color: #fff; }
        .btn-primary:hover { background: var(--forest-dark); transform: translateY(-1px); box-shadow: 0 4px 10px rgba(32,78,66,0.25); }
        .btn-ghost { border-color: var(--line-strong); color: var(--ink); background: transparent; }
        .btn-ghost:hover { border-color: var(--forest); color: var(--forest-dark); }
        .btn:focus-visible { outline: 2px solid var(--forest); outline-offset: 2px; }

        .hero { padding: 88px 0 64px; }
        .hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; }
        .hero h1 {
          font-size: clamp(38px, 4.6vw, 58px);
          line-height: 1.06;
          margin: 18px 0 22px;
          letter-spacing: -0.01em;
        }
        .hero h1 em { font-style: normal; color: var(--forest); }
        .hero p.lede { font-size: 18px; color: var(--ink-soft); max-width: 46ch; margin-bottom: 32px; }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; }

        .ledger-card {
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 6px;
          box-shadow: 0 20px 46px -18px rgba(35,40,31,0.35);
          position: relative;
          padding: 26px 26px 22px;
          transform: rotate(1.1deg);
        }
        .ledger-head {
          display: flex; justify-content: space-between; align-items: baseline;
          border-bottom: 2px solid var(--ink);
          padding-bottom: 10px; margin-bottom: 6px;
        }
        .ledger-head .title { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 600; }
        .ledger-head .meta { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--ink-soft); }
        .ledger-row {
          display: grid; grid-template-columns: 28px 1fr 76px 84px;
          gap: 10px; align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
          font-size: 13.5px;
        }
        .ledger-row .no { font-family: 'IBM Plex Mono', monospace; color: var(--ink-soft); font-size: 12px; }
        .ledger-row .name { font-weight: 500; }
        .ledger-row .status {
          font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .05em;
          padding: 3px 7px; border-radius: 20px; text-align: center; text-transform: uppercase;
          background: var(--forest-tint); color: var(--forest-dark);
        }
        .ledger-row .status.due { background: #F6E7D8; color: var(--rust); }
        .ledger-row .amt { font-family: 'IBM Plex Mono', monospace; text-align: right; color: var(--ink-soft); }

        .stamp {
          position: absolute; top: -18px; right: -14px;
          width: 96px; height: 96px;
          transform: rotate(-11deg);
        }

        .tabs-index {
          position: absolute; right: -13px; top: 46px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .tabs-index .tab-chip {
          background: var(--brass);
          color: #fff;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
          padding: 6px 10px 6px 12px;
          border-radius: 3px 8px 8px 3px;
          box-shadow: 2px 2px 0 rgba(35,40,31,0.18);
        }
        .tabs-index .tab-chip:nth-child(2) { background: var(--forest); }
        .tabs-index .tab-chip:nth-child(3) { background: var(--rust); }

        .trust {
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          padding: 20px 0;
          background: var(--paper-deep);
        }
        .trust p {
          text-align: center;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          color: var(--ink-soft);
          letter-spacing: .02em;
        }
        .trust strong { color: var(--forest-dark); }

        section { padding: 88px 0; }
        .section-head { max-width: 640px; margin-bottom: 48px; }
        .section-head h2 { font-size: clamp(28px,3vw,36px); margin-top: 10px; letter-spacing: -0.01em; }
        .section-head p { color: var(--ink-soft); font-size: 16.5px; margin-top: 12px; }

        .feature-ledger { border-top: 2px solid var(--ink); }
        .feature-item {
          display: grid;
          grid-template-columns: 44px 1fr 1.4fr;
          gap: 26px;
          align-items: center;
          padding: 28px 0;
          border-bottom: 1px solid var(--line);
        }
        .feature-item .tick {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid var(--forest);
          border-radius: 50%;
          color: var(--forest);
          font-family: 'IBM Plex Mono', monospace; font-size: 13px;
          align-self: center;
        }
        .feature-item .title-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .feature-item h3 { font-size: 19px; font-weight: 600; }
        .feature-item p { color: var(--ink-soft); font-size: 15px; margin: 0; max-width: 52ch; }
        .feature-item .tag {
          font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--brass);
          text-transform: uppercase; letter-spacing: .08em; display: inline-block;
        }

        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
        .price-card {
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 6px;
          padding: 30px 26px 26px;
          display: flex; flex-direction: column;
          position: relative;
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .price-card:hover { transform: translateY(-5px); box-shadow: 0 22px 40px -22px rgba(35,40,31,0.35); }
        .price-card.featured { border-color: var(--forest); box-shadow: 0 22px 44px -20px rgba(32,78,66,0.3); }
        .price-card .ribbon {
          position: absolute; top: -12px; left: 26px;
          background: var(--forest); color: #fff;
          font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase;
          padding: 5px 10px; border-radius: 3px;
        }
        .price-card .tier-name { font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--brass); }
        .price-card h3 { font-size: 24px; margin: 8px 0 4px; }
        .price-card .price { font-family: 'IBM Plex Mono', monospace; font-size: 34px; font-weight: 600; color: var(--ink); margin: 10px 0 2px; }
        .price-card .price span { font-size: 14px; font-weight: 500; color: var(--ink-soft); }
        .price-card .for { font-size: 13.5px; color: var(--ink-soft); margin-bottom: 20px; }
        .price-card ul { list-style: none; padding: 0; margin: 0 0 26px; flex: 1; }
        .price-card li { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-top: 1px solid var(--line); font-size: 14px; color: var(--ink); }
        .price-card li:first-child { border-top: none; }
        .price-card li .check { color: var(--forest); font-family: 'IBM Plex Mono', monospace; margin-top: 1px; }
        .price-card .btn { width: 100%; }

        .cta-band {
          background: var(--forest);
          color: #fff;
          padding: 72px 0;
          border-radius: 8px;
          margin: 0 32px;
          text-align: center;
        }
        .cta-band .wrap { max-width: 640px; }
        .cta-band h2 { color: #fff; font-size: clamp(26px,3vw,34px); }
        .cta-band p { color: #D9E7E2; margin: 14px 0 30px; font-size: 16px; }
        .cta-band .btn-primary { background: #fff; color: var(--forest-dark); }
        .cta-band .btn-primary:hover { background: var(--brass-tint); box-shadow: none; }

        footer { padding: 48px 0 60px; }
        .footer-inner {
          display: flex; justify-content: space-between; align-items: center;
          border-top: 1px solid var(--line); padding-top: 24px;
          font-size: 13px; color: var(--ink-soft);
          flex-wrap: wrap; gap: 12px;
        }

        .reveal { opacity: 0; transform: translateY(14px); transition: opacity .5s ease, transform .5s ease; }
        .reveal.in { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1; transform: none; transition: none; }
          .price-card, .btn { transition: none; }
        }

        @media (max-width: 880px) {
          .hero-grid { grid-template-columns: 1fr; }
          .pricing-grid { grid-template-columns: 1fr; }
          .feature-item { grid-template-columns: 40px 1fr; }
          .feature-item > .title-row,
          .feature-item > p { grid-column: 2 / 3; }
          nav.links { display: none; }
          .ledger-card { transform: none; }
          .tabs-index { display: none; }
          .cta-band { margin: 0 16px; }
        }
      `}</style>

      <header className="nav">
        <div className="nav-inner">
          <div className="wordmark"><span className="tab"></span>Cooperative CRM</div>
          <nav className="links">
            <a className="muted" href="#features">Features</a>
            <a className="muted" href="#pricing">Pricing</a>
            <a className="muted" href="/login">Log in</a>
            <a className="btn btn-primary" href="/signup?plan=growth">Start your cooperative</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Built for cooperative societies</span>
            <h1>Every Member.<br />Every Naira.<br /><em>One Ledger.</em></h1>
            <p className="lede">Track contributions, manage members, and keep your cooperative&rsquo;s books straight. Built for cooperatives.</p>
            <div className="hero-ctas">
              <a className="btn btn-primary" href="/signup?plan=growth">Start your cooperative</a>
              <a className="btn btn-ghost" href="#pricing">See pricing</a>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <div className="ledger-card">
              <svg className="stamp" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#A13D2C" strokeWidth="2.5" opacity="0.85" />
                <circle cx="50" cy="50" r="34" fill="none" stroke="#A13D2C" strokeWidth="1" opacity="0.6" />
                <text x="50" y="46" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10.5" fill="#A13D2C" opacity="0.9" fontWeight="600">VERIFIED</text>
                <text x="50" y="60" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="#A13D2C" opacity="0.75">MEMBER LEDGER</text>
              </svg>
              <div className="tabs-index">
                <div className="tab-chip">Starter</div>
                <div className="tab-chip">Growth</div>
                <div className="tab-chip">Enterprise</div>
              </div>
              <div className="ledger-head">
                <span className="title">Member Ledger</span>
                <span className="meta">NARP-0001&ndash;0500</span>
              </div>
              <div className="ledger-row">
                <span className="no">001</span>
                <span className="name">Adeola B.</span>
                <span className="status">Paid</span>
                <span className="amt">₦12,000</span>
              </div>
              <div className="ledger-row">
                <span className="no">002</span>
                <span className="name">Chinedu O.</span>
                <span className="status">Paid</span>
                <span className="amt">₦12,000</span>
              </div>
              <div className="ledger-row">
                <span className="no">003</span>
                <span className="name">Folake A.</span>
                <span className="status due">Due</span>
                <span className="amt">₦12,000</span>
              </div>
              <div className="ledger-row" style={{ borderBottom: "none" }}>
                <span className="no">004</span>
                <span className="name">Tunde K.</span>
                <span className="status">Paid</span>
                <span className="amt">₦12,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="trust">
        <p>From <strong>30-member</strong> community groups to <strong>500-member</strong> cooperatives — the ledger scales with you.</p>
      </div>

      <section id="features">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">What&rsquo;s inside</span>
            <h2>Four things your cooperative actually needs</h2>
            <p>No modules you&rsquo;ll never touch. Just the record-keeping a member-owned society runs on.</p>
          </div>
          <div className="feature-ledger">
            <div className="feature-item reveal">
              <div className="tick">01</div>
              <div className="title-row">
                <h3>Member Ledger</h3>
                <span className="tag">Core</span>
              </div>
              <p>Every member&rsquo;s contributions, join date, and payment history in one place — searchable, filterable by active, overdue, or lapsed.</p>
            </div>
            <div className="feature-item reveal">
              <div className="tick">02</div>
              <div className="title-row">
                <h3>Multi-Cooperative Ready</h3>
                <span className="tag">Core</span>
              </div>
              <p>Each cooperative&rsquo;s data is walled off at the database level — admins only ever see their own members, never another society&rsquo;s.</p>
            </div>
            <div className="feature-item reveal">
              <div className="tick">03</div>
              <div className="title-row">
                <h3>QuickBooks Sync</h3>
                <span className="tag">Add-on</span>
              </div>
              <p>Link contributions and payments straight to your books when you need it. Optional — plenty of cooperatives run just fine without it.</p>
            </div>
            <div className="feature-item reveal">
              <div className="tick">04</div>
              <div className="title-row">
                <h3>Self-Serve Onboarding</h3>
                <span className="tag">Core</span>
              </div>
              <p>Generate an invite code, hand it to your cooperative&rsquo;s admin, and they&rsquo;re in — no setup call required.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Pricing</span>
            <h2>Pick your tier</h2>
            <p>Flat monthly pricing per cooperative. No per-member surprises.</p>
          </div>
          <div className="pricing-grid">
            <div className="price-card reveal">
              <span className="tier-name">Starter</span>
              <h3>For small societies</h3>
              <div className="price">₦10,000<span>/mo</span></div>
              <div className="for">Up to 100 members</div>
              <ul>
                <li><span className="check">✓</span> Member ledger &amp; contribution tracking</li>
                <li><span className="check">✓</span> Self-serve onboarding</li>
                <li><span className="check">✓</span> Single admin login</li>
                <li><span className="check">✓</span> Email support</li>
              </ul>
              <a className="btn btn-ghost" href="/signup?plan=starter">Get started</a>
            </div>
            <div className="price-card featured reveal">
              <span className="ribbon">Most common</span>
              <span className="tier-name">Growth</span>
              <h3>For active societies</h3>
              <div className="price">₦15,000<span>/mo</span></div>
              <div className="for">Up to 300 members</div>
              <ul>
                <li><span className="check">✓</span> Everything in Starter</li>
                <li><span className="check">✓</span> QuickBooks sync add-on</li>
                <li><span className="check">✓</span> Multiple admin logins</li>
                <li><span className="check">✓</span> Priority email support</li>
              </ul>
              <a className="btn btn-primary" href="/signup?plan=growth">Get started</a>
            </div>
            <div className="price-card reveal">
              <span className="tier-name">Enterprise</span>
              <h3>For federations &amp; large societies</h3>
              <div className="price">₦25,000<span>/mo</span></div>
              <div className="for">Unlimited members</div>
              <ul>
                <li><span className="check">✓</span> Everything in Growth</li>
                <li><span className="check">✓</span> Custom statement generation</li>
                <li><span className="check">✓</span> Dedicated onboarding support</li>
                <li><span className="check">✓</span> WhatsApp &amp; phone support</li>
              </ul>
              <a className="btn btn-ghost" href="/signup?plan=enterprise">Get started</a>
            </div>
          </div>
        </div>
      </section>

      <div className="cta-band">
        <div className="wrap">
          <h2>Ready to put your cooperative&rsquo;s books in order?</h2>
          <p>Generate an invite code and your admin can be in within minutes.</p>
          <a className="btn btn-primary" href="/signup?plan=growth">Start your cooperative</a>
        </div>
      </div>

      <footer>
        <div className="wrap footer-inner">
          <span>© 2026 Cooperative CRM, a Corporate Bundles product.</span>
          <span className="mono">Built on trust, kept in ledgers.</span>
        </div>
      </footer>
    </>
  );
}
