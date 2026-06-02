import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";

// ---------------------------------------------------------------------------
// Scroll-reveal wrapper — fades + slides children in when they enter viewport
// ---------------------------------------------------------------------------
function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const offsets = {
    up: { y: 48, x: 0 },
    left: { y: 0, x: -48 },
    right: { y: 0, x: 48 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: offsets[direction].x, y: offsets[direction].y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Feature data
// ---------------------------------------------------------------------------
const features = [
  {
    title: "Drag-and-Drop Kanban",
    subtitle: "Visualize your workflow",
    description:
      "Move tasks effortlessly between columns with intuitive drag-and-drop. Watch your team's progress unfold in real time across customizable boards that adapt to any workflow.",
    highlights: ["Instant status sync", "Multi-project boards", "Touch-friendly"],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <path d="M17.5 14v7M14 17.5h7" />
      </svg>
    ),
  },
  {
    title: "Real-time Analytics",
    subtitle: "Data-driven decisions",
    description:
      "Gain instant clarity with live dashboards that surface velocity trends, bottleneck alerts, and team performance metrics. No waiting for end-of-sprint reports.",
    highlights: ["Live velocity charts", "Burndown tracking", "Export-ready reports"],
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-6 4 4 5-8" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Tech stack data
// ---------------------------------------------------------------------------
const techStack = [
  // Row 1
  [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Frontend" },
    { name: "Tailwind CSS", category: "Frontend" },
    { name: "Framer Motion", category: "Frontend" },
    { name: "FastAPI", category: "Backend" },
    { name: "Python", category: "Backend" },
    { name: "SQLAlchemy", category: "Backend" },
  ],
  // Row 2
  [
    { name: "PostgreSQL", category: "Database" },
    { name: "JWT", category: "Auth" },
    { name: "OAuth", category: "Auth" },
    { name: "Vite", category: "Tools" },
    { name: "Git", category: "Tools" },
    { name: "AWS", category: "Infra" },
  ],
];

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-[#FAFAF9] text-[#1a1a2e] antialiased overflow-x-hidden">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#FAFAF9]/80 border-b border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="#fff" opacity="0.9" />
              </svg>
            </div>
            <span className="font-semibold text-[#1a1a2e] text-lg tracking-tight">
              NEXUS <span className="text-[#6d28d9]">PM</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-[#6b7280]">
            <a href="#features" className="hover:text-[#1a1a2e] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[#1a1a2e] transition-colors">Workflow</a>
            <a href="#tech-stack" className="hover:text-[#1a1a2e] transition-colors">Tech Stack</a>
            <a href="#cta" className="hover:text-[#1a1a2e] transition-colors">Get Started</a>
          </div>

          <Link
            to="/auth"
            className="px-5 py-2 rounded-lg bg-[#1a1a2e] text-white text-sm font-medium hover:bg-[#2d2d4e] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="landing-mesh-bg" aria-hidden="true" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#6d28d9 1px, transparent 1px), linear-gradient(90deg, #6d28d9 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <Reveal>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase bg-[#ede9fe] text-[#6d28d9] border border-[#ddd6fe] mb-8">
            Project Management, Reimagined
          </span>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] max-w-4xl mb-6">
            <span className="text-[#1a1a2e]">Nexus PM:</span>
            <br />
            <span className="landing-gradient-text">Manage the Future</span>
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-lg md:text-xl text-[#6b7280] max-w-2xl leading-relaxed mb-10">
            The project management platform built for modern teams. Organize, track,
            and deliver with clarity — from first sprint to final deploy.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/auth"
              className="px-8 py-3.5 rounded-xl bg-[#1a1a2e] text-white font-medium text-base hover:bg-[#2d2d4e] shadow-lg shadow-black/10 transition-all hover:shadow-xl hover:shadow-black/15 hover:-translate-y-0.5"
            >
              Start for Free
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 rounded-xl border border-[#d1d5db] text-[#374151] font-medium text-base hover:bg-[#f3f4f6] transition-colors"
            >
              Explore Features
            </a>
          </div>
        </Reveal>

        {/* Abstract floating shapes */}
        <div className="absolute top-24 left-[8%] w-16 h-16 rounded-2xl bg-[#ede9fe] opacity-40 landing-float-shape" style={{ animationDelay: "0s" }} />
        <div className="absolute top-48 right-[10%] w-12 h-12 rounded-full bg-[#ddd6fe] opacity-30 landing-float-shape" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 left-[15%] w-10 h-10 rounded-xl bg-[#c4b5fd] opacity-20 landing-float-shape" style={{ animationDelay: "4s" }} />
        <div className="absolute bottom-32 right-[18%] w-14 h-14 rounded-full bg-[#ede9fe] opacity-25 landing-float-shape" style={{ animationDelay: "1s" }} />
      </section>

      {/* ── Social proof strip ─────────────────────────────────────────── */}
      <Reveal>
        <section className="py-12 border-y border-[#e8e5e0] bg-[#FAFAF9]">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-12 text-center">
            {[
              { value: "12k+", label: "Teams worldwide" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "4.9/5", label: "User satisfaction" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-3xl font-bold text-[#1a1a2e]">{stat.value}</span>
                <span className="text-sm text-[#9ca3af] mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Feature Sections (alternating) ─────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4">
                Everything you need to ship faster
              </h2>
              <p className="text-[#6b7280] text-lg max-w-xl mx-auto">
                Powerful features that adapt to your team's workflow, not the other way around.
              </p>
            </div>
          </Reveal>

          {features.map((feature, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <div
                key={feature.title}
                className={`flex flex-col ${
                  isReversed ? "md:flex-row-reverse" : "md:flex-row"
                } items-center gap-16 mb-28 last:mb-0`}
              >
                {/* Text side */}
                <Reveal
                  direction={isReversed ? "right" : "left"}
                  className="flex-1"
                >
                  <div>
                    <span className="text-xs font-semibold tracking-widest uppercase text-[#6d28d9] mb-3 block">
                      {feature.subtitle}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-4 leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-[#6b7280] text-base leading-relaxed mb-6">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-3 text-sm text-[#374151]">
                          <span className="w-5 h-5 rounded-full bg-[#ede9fe] text-[#6d28d9] flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>

                {/* Visual side — abstract card */}
                <Reveal
                  direction={isReversed ? "left" : "right"}
                  delay={0.15}
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl bg-white border border-[#e5e7eb] shadow-xl shadow-black/[0.04] flex items-center justify-center group overflow-hidden">
                    {/* Subtle gradient inside card */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#faf5ff] to-[#f5f3ff] opacity-60" />
                    {/* Decorative circles */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#ede9fe] opacity-30" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#ddd6fe] opacity-20" />
                    {/* Icon */}
                    <div className="relative z-10 w-20 h-20 rounded-2xl bg-[#1a1a2e] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                      {feature.icon}
                    </div>
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Workflow strip ──────────────────────────────────────────────── */}
      <section id="workflow" className="py-24 px-6 bg-[#f5f3f0] border-y border-[#e8e5e0]">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4">
              Streamlined from start to finish
            </h2>
            <p className="text-[#6b7280] text-lg max-w-xl mx-auto mb-16">
              Three steps to transform how your team delivers projects.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create",
                desc: "Spin up projects and break work into actionable tasks in seconds.",
              },
              {
                step: "02",
                title: "Organize",
                desc: "Drag tasks across your Kanban board. Set priorities, assign owners.",
              },
              {
                step: "03",
                title: "Deliver",
                desc: "Track velocity, resolve blockers, and ship with confidence.",
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.12}>
                <div className="bg-white rounded-2xl p-8 border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow duration-300 text-left">
                  <span className="text-4xl font-bold text-[#ede9fe] block mb-4">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-semibold text-[#1a1a2e] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section id="cta" className="py-28 px-6">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4">
              Ready to manage the future?
            </h2>
            <p className="text-[#6b7280] text-lg mb-10 max-w-lg mx-auto">
              Join thousands of high-performing teams already using Nexus PM to
              ship better software, faster.
            </p>
            <Link
              to="/auth"
              className="inline-block px-10 py-4 rounded-xl bg-[#1a1a2e] text-white font-medium text-base hover:bg-[#2d2d4e] shadow-lg shadow-black/10 transition-all hover:shadow-xl hover:shadow-black/15 hover:-translate-y-0.5"
            >
              Get Started — It's Free
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Tech Stack ─────────────────────────────────────────────────── */}
      <section id="tech-stack" className="py-24 px-6 bg-[#f5f3f0] border-y border-[#e8e5e0] overflow-hidden">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <Reveal>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase bg-[#ede9fe] text-[#6d28d9] border border-[#ddd6fe] mb-6">
              Under the Hood
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] mb-4">
              Engineered for Scale
            </h2>
            <p className="text-[#6b7280] text-lg max-w-xl mx-auto">
              Built on a modern, production-grade stack chosen for performance,
              type safety, and developer experience.
            </p>
          </Reveal>
        </div>

        {/* Infinite marquee — two rows, opposite directions */}
        {techStack.map((row, rowIndex) => (
          <div key={rowIndex} className="relative mb-5 last:mb-0">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#f5f3f0] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-[#f5f3f0] to-transparent pointer-events-none" />

            <div
              className={`flex gap-4 w-max ${
                rowIndex === 0 ? "landing-marquee-left" : "landing-marquee-right"
              }`}
            >
              {/* Duplicate the set twice for seamless loop */}
              {[...row, ...row].map((tech, i) => (
                <div
                  key={`${tech.name}-${i}`}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md hover:border-[#c4b5fd] hover:-translate-y-0.5 transition-all duration-300 select-none cursor-default"
                >
                  <span className="text-sm font-semibold text-[#1a1a2e] whitespace-nowrap">
                    {tech.name}
                  </span>
                  <span className="text-[10px] font-medium tracking-wider uppercase text-[#9ca3af] whitespace-nowrap">
                    {tech.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e8e5e0] py-10 px-6 bg-[#FAFAF9]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#1a1a2e] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="#fff" opacity="0.9" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1a1a2e]">
              NEXUS <span className="text-[#6d28d9]">PM</span>
            </span>
          </div>
          <p className="text-xs text-[#9ca3af]">
            &copy; 2026 Nexus PM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
