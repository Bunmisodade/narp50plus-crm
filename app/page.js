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
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-sm border-b border-line">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between px-6 sm:px-8 py-4">
          <div className="flex items-center gap-2.5 font-serif font-semibold text-lg">
            <span className="wordmark-tab" />Cooperative CRM
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a className="text-ink-soft hover:text-forest-dark transition" href="#features">Features</a>
            <a className="text-ink-soft hover:text-forest-dark transition" href="#pricing">Pricing</a>
            <a className="text-ink-soft hover:text-forest-dark transition" href="/login">Log in</a>
            <a className="btn btn-primary" href="/signup?plan=growth">Start your cooperative</a>
          </nav>
        </div>
      </header>

      <section className="pt-16 sm:pt-20 pb-14">
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
          <div>
            <span className="eyebrow">Built for cooperative societies</span>
            <h1 className="text-[38px] sm:text-5xl lg:text-[58px] leading-[1.06] my-4 tracking-tight">
              Every Member.<br />Every Naira.<br /><em className="not-italic text-forest">One Ledger.</em>
            </h1>
            <p className="text-lg text-ink-soft max-w-[46ch] mb-8">
              Track contributions, manage members, and keep your cooperative&rsquo;s books straight. Built for cooperatives.
            </p>
            <div className="flex gap-3.5 flex-wrap">
              <a className="btn btn-primary" href="/signup?plan=growth">Start your cooperative</a>
              <a className="btn btn-ghost" href="#pricing">See pricing</a>
            </div>
          </div>

          <div className="relative">
            <div className="ledger-card">
              <svg className="absolute -top-10 -right-8 w-24 h-24 rotate-[-11deg]" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#A13D2C" strokeWidth="2.5" opacity="0.85" />
                <circle cx="50" cy="50" r="34" fill="none" stroke="#A13D2C" strokeWidth="1" opacity="0.6" />
                <text x="50" y="46" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10.5" fill="#A13D2C" opacity="0.9" fontWeight="600">VERIFIED</text>
                <text x="50" y="60" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="#A13D2C" opacity="0.75">MEMBER LEDGER</text>
              </svg>
              <div className="hidden md:flex flex-col gap-2.5 absolute -right-3.5 top-12">
                <div className="tab-chip">Starter</div>
                <div className="tab-chip">Growth</div>
                <div className="tab-chip">Enterprise</div>
              </div>
              <div className="flex justify-between items-baseline border-b-2 border-ink pb-2.5 mb-1.5">
                <span className="font-serif text-base font-semibold">Member Ledger</span>
                <span className="font-mono text-[11px] text-ink-soft">NARP-0001&ndash;0500</span>
              </div>
              {[
                { no: "001", name: "Adeola B.", status: "Paid", due: false },
                { no: "002", name: "Chinedu O.", status: "Paid", due: false },
                { no: "003", name: "Folake A.", status: "Due", due: true },
                { no: "004", name: "Tunde K.", status: "Paid", due: false },
              ].map((row, i, arr) => (
                <div
                  key={row.no}
                  className={`grid grid-cols-[28px_1fr_76px_84px] gap-2.5 items-center py-2.5 text-[13.5px] ${i < arr.length - 1 ? "border-b border-line" : ""}`}
                >
                  <span className="font-mono text-ink-soft text-xs">{row.no}</span>
                  <span className="font-medium">{row.name}</span>
                  <span className={`font-mono text-[10.5px] tracking-wide px-1.5 py-0.5 rounded-full text-center uppercase ${row.due ? "bg-rust-tint text-rust" : "bg-forest-tint text-forest-dark"}`}>
                    {row.status}
                  </span>
                  <span className="font-mono text-right text-ink-soft">₦12,000</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-line bg-paper-deep py-5">
        <p className="text-center font-mono text-[13px] text-ink-soft tracking-wide">
          From <strong className="text-forest-dark">30-member</strong> community groups to <strong className="text-forest-dark">500-member</strong> cooperatives — the ledger scales with you.
        </p>
      </div>

      <section id="features" className="py-16 sm:py-20">
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8">
          <div className="max-w-xl mb-10 reveal">
            <span className="eyebrow">What&rsquo;s inside</span>
            <h2 className="text-[28px] sm:text-4xl mt-2.5 tracking-tight">Four things your cooperative actually needs</h2>
            <p className="text-ink-soft text-base mt-3">No modules you&rsquo;ll never touch. Just the record-keeping a member-owned society runs on.</p>
          </div>
          <div className="border-t-2 border-ink">
            {[
              { n: "01", title: "Member Ledger", tag: "Core", body: "Every member\u2019s contributions, join date, and payment history in one place \u2014 searchable, filterable by active, overdue, or lapsed." },
              { n: "02", title: "Multi-Cooperative Ready", tag: "Core", body: "Each cooperative\u2019s data is walled off at the database level \u2014 admins only ever see their own members, never another society\u2019s." },
              { n: "03", title: "QuickBooks Sync", tag: "Add-on", body: "Link contributions and payments straight to your books when you need it. Optional \u2014 plenty of cooperatives run just fine without it." },
              { n: "04", title: "Self-Serve Onboarding", tag: "Core", body: "Generate an invite code, hand it to your cooperative\u2019s admin, and they\u2019re in \u2014 no setup call required." },
            ].map((f) => (
              <div key={f.n} className="grid grid-cols-[40px_1fr] sm:grid-cols-[44px_1fr_1.4fr] gap-4 sm:gap-6 items-center py-7 border-b border-line reveal">
                <div className="w-[30px] h-[30px] flex items-center justify-center rounded-full border-[1.5px] border-forest text-forest font-mono text-[13px]">
                  {f.n}
                </div>
                <div className="col-span-1 sm:col-span-1 flex items-baseline gap-2.5 flex-wrap">
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <span className="font-mono text-[11px] text-brass uppercase tracking-wide">{f.tag}</span>
                </div>
                <p className="col-span-2 sm:col-span-1 text-ink-soft text-[15px] m-0 max-w-[52ch]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 sm:py-20">
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8">
          <div className="max-w-xl mb-10 reveal">
            <span className="eyebrow">Pricing</span>
            <h2 className="text-[28px] sm:text-4xl mt-2.5 tracking-tight">Pick your tier</h2>
            <p className="text-ink-soft text-base mt-3">Flat monthly pricing per cooperative. No per-member surprises.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="price-card reveal">
              <span className="font-mono text-xs tracking-wide uppercase text-brass">Starter</span>
              <h3 className="text-2xl mt-2 mb-1">For small societies</h3>
              <div className="font-mono text-[34px] font-semibold text-ink mt-2.5 mb-0.5">₦10,000<span className="text-sm font-medium text-ink-soft">/mo</span></div>
              <div className="text-[13.5px] text-ink-soft mb-5">Up to 100 members</div>
              <ul className="list-none p-0 m-0 mb-6 flex-1">
                {["Member ledger & contribution tracking", "Self-serve onboarding", "Single admin login", "Email support"].map((li, i) => (
                  <li key={li} className={`flex gap-2.5 items-start py-2 text-sm ${i > 0 ? "border-t border-line" : ""}`}>
                    <span className="text-forest font-mono mt-0.5">✓</span> {li}
                  </li>
                ))}
              </ul>
              <a className="btn btn-ghost w-full" href="/signup?plan=starter">Get started</a>
            </div>

            <div className="price-card featured reveal">
              <span className="ribbon">Most common</span>
              <span className="font-mono text-xs tracking-wide uppercase text-brass">Growth</span>
              <h3 className="text-2xl mt-2 mb-1">For active societies</h3>
              <div className="font-mono text-[34px] font-semibold text-ink mt-2.5 mb-0.5">₦15,000<span className="text-sm font-medium text-ink-soft">/mo</span></div>
              <div className="text-[13.5px] text-ink-soft mb-5">Up to 300 members</div>
              <ul className="list-none p-0 m-0 mb-6 flex-1">
                {["Everything in Starter", "QuickBooks sync add-on", "Multiple admin logins", "Priority email support"].map((li, i) => (
                  <li key={li} className={`flex gap-2.5 items-start py-2 text-sm ${i > 0 ? "border-t border-line" : ""}`}>
                    <span className="text-forest font-mono mt-0.5">✓</span> {li}
                  </li>
                ))}
              </ul>
              <a className="btn btn-primary w-full" href="/signup?plan=growth">Get started</a>
            </div>

            <div className="price-card reveal">
              <span className="font-mono text-xs tracking-wide uppercase text-brass">Enterprise</span>
              <h3 className="text-2xl mt-2 mb-1">For federations &amp; large societies</h3>
              <div className="font-mono text-[34px] font-semibold text-ink mt-2.5 mb-0.5">₦25,000<span className="text-sm font-medium text-ink-soft">/mo</span></div>
              <div className="text-[13.5px] text-ink-soft mb-5">Unlimited members</div>
              <ul className="list-none p-0 m-0 mb-6 flex-1">
                {["Everything in Growth", "Custom statement generation", "Dedicated onboarding support", "WhatsApp & phone support"].map((li, i) => (
                  <li key={li} className={`flex gap-2.5 items-start py-2 text-sm ${i > 0 ? "border-t border-line" : ""}`}>
                    <span className="text-forest font-mono mt-0.5">✓</span> {li}
                  </li>
                ))}
              </ul>
              <a className="btn btn-ghost w-full" href="/signup?plan=enterprise">Get started</a>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-forest text-white py-14 sm:py-16 rounded-lg mx-4 sm:mx-8 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-white text-[26px] sm:text-[34px]">Ready to put your cooperative&rsquo;s books in order?</h2>
          <p className="text-[#D9E7E2] my-3.5 mb-7">Generate an invite code and your admin can be in within minutes.</p>
          <a className="btn bg-white text-forest-dark hover:bg-brass-tint hover:shadow-none" href="/signup?plan=growth">Start your cooperative</a>
        </div>
      </div>

      <footer className="py-12 pb-14">
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8 flex flex-wrap justify-between items-center gap-3 border-t border-line pt-6 text-[13px] text-ink-soft">
          <span>© 2026 Cooperative CRM, a Corporate Bundles product.</span>
          <span className="font-mono tracking-wide">Built on trust, kept in ledgers.</span>
        </div>
      </footer>
    </>
  );
}
