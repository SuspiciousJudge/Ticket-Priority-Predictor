import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import {
  ArrowRight,
  Brain,
  Route,
  BarChart3,
  CheckCircle2,
  Menu,
  X,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Zap,
  Star,
  ChevronRight,
} from 'lucide-react';

function SectionReveal({ children, className = '', delay = 0 }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function StatCounter({ end, suffix = '', label }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.4 });
  return (
    <div ref={ref} className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
      <div className="text-4xl font-extrabold tracking-tight text-slate-900">
        {inView ? <CountUp end={end} duration={2.2} separator="," /> : 0}
        {suffix}
      </div>
      <div className="mt-2 text-sm font-medium text-slate-600">{label}</div>
    </div>
  );
}

function FloatingBadge({ children, className }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

const companyLogos = ['NOVA INC', 'BLUEWAVE', 'STACKPOINT', 'CLOUDNEST', 'VECTORLABS', 'NIMBLEOPS'];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Head of Support, Nova Inc',
    quote: 'We reduced first-response time by 67% in six weeks. The AI routing is unbelievably reliable.',
  },
  {
    name: 'Marcus Rivera',
    role: 'IT Operations Lead, Bluewave',
    quote: 'Our team stopped firefighting and started planning. Priority prediction changed how we run support.',
  },
  {
    name: 'Anika Patel',
    role: 'VP Customer Experience, Stackpoint',
    quote: 'The dashboards give executive-level visibility instantly. We can finally trust our SLA reporting.',
  },
];

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [typed, setTyped] = useState('');

  const headline = 'AI-Powered Ticket Management That Saves 80% of Your Time';

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let index = 0;
    const id = setInterval(() => {
      index += 1;
      setTyped(headline.slice(0, index));
      if (index >= headline.length) clearInterval(id);
    }, 24);
    return () => clearInterval(id);
  }, [headline]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = useMemo(
    () => [
      { label: 'Features', href: '#features' },
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#cta' },
    ],
    []
  );

  return (
    <div className="min-h-screen scroll-smooth bg-slate-50 text-slate-900">
      <AnimatePresence>
        {!loaded && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <p className="text-sm font-medium tracking-[0.18em] text-slate-300">TICKET IQ</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <a href="#hero" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">TicketIQ</span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100">
              Watch Demo
            </Link>
            <Link
              to="/signup"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition duration-700 group-hover:translate-x-full" />
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
            >
              <div className="space-y-2 px-6 py-4">
                {navLinks.map((link) => (
                  <a key={link.label} href={link.href} className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-700" onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </a>
                ))}
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold">Watch Demo</Link>
                  <Link to="/signup" className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-center text-sm font-semibold text-white">Get Started</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section id="hero" className="relative isolate overflow-hidden px-6 pb-24 pt-36 lg:px-10">
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 20%, rgba(99,102,241,0.22), transparent 35%), radial-gradient(circle at 85% 10%, rgba(139,92,246,0.22), transparent 35%), radial-gradient(circle at 70% 70%, rgba(6,182,212,0.2), transparent 40%)',
              backgroundSize: '160% 160%',
            }}
          />

          <div className="mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-2">
            <SectionReveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Enterprise-grade AI for support teams
              </div>

              <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-tight text-slate-900 md:text-6xl xl:text-7xl">
                {typed}
                <span className="ml-1 inline-block h-[0.9em] w-[3px] animate-pulse bg-indigo-600 align-[-0.1em]" />
              </h1>

              <p className="mt-6 max-w-xl text-lg text-slate-600 md:text-xl">
                Predict priority, route intelligently, and resolve incidents faster with a single AI-powered ticket workspace designed for high-volume B2B teams.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/signup"
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-500/30"
                >
                  <span className="relative z-10 inline-flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition duration-700 group-hover:translate-x-full" />
                </Link>
                <a href="#dashboard-preview" className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-base font-bold text-slate-700 transition hover:bg-slate-100">
                  <PlayCircle className="h-4 w-4" />
                  Watch Demo
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  No credit card required
                </div>
                <div className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Setup in 15 minutes
                </div>
              </div>
            </SectionReveal>

            <SectionReveal delay={0.15}>
              <div className="relative">
                <FloatingBadge className="absolute -left-4 top-8 rounded-2xl border border-white/30 bg-white/75 px-4 py-3 shadow-xl backdrop-blur-xl">
                  <p className="text-xs font-semibold text-slate-500">Prediction Accuracy</p>
                  <p className="text-xl font-extrabold text-indigo-600">92%</p>
                </FloatingBadge>

                <FloatingBadge className="absolute -right-3 bottom-6 rounded-2xl border border-white/30 bg-white/75 px-4 py-3 shadow-xl backdrop-blur-xl">
                  <p className="text-xs font-semibold text-slate-500">Tickets Analyzed</p>
                  <p className="text-xl font-extrabold text-cyan-600">1000+</p>
                </FloatingBadge>

                <motion.div
                  className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-5 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today</p>
                      <p className="text-xl font-bold">147 New Tickets</p>
                    </div>
                    <div className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">+24% resolved</div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                    {[
                      { id: 'TCK-1382', title: 'Payment gateway timeout in EU region', p: 'Critical', bar: 'w-[88%]', color: 'bg-red-500' },
                      { id: 'TCK-1371', title: 'SSO token refresh failing for enterprise user', p: 'High', bar: 'w-[72%]', color: 'bg-orange-500' },
                      { id: 'TCK-1368', title: 'Analytics widget not loading in dashboard', p: 'Medium', bar: 'w-[54%]', color: 'bg-amber-500' },
                    ].map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-500">{item.id}</p>
                            <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                          </div>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">{item.p}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                          <div className={`h-1.5 rounded-full ${item.color} ${item.bar}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </SectionReveal>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-8">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <p className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Trusted by leading teams</p>
            <div className="relative overflow-hidden">
              <div className="animate-logo-marquee flex gap-12 whitespace-nowrap">
                {[...companyLogos, ...companyLogos].map((logo, i) => (
                  <div key={`${logo}-${i}`} className="text-sm font-bold tracking-[0.2em] text-slate-400">
                    {logo}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-24 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <SectionReveal className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Core capabilities</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Everything your support team needs to move faster</h2>
            </SectionReveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Brain,
                  title: 'AI Priority Prediction',
                  metric: '92% Accuracy',
                  desc: 'Classifies ticket urgency with high confidence using real issue context and historical trends.',
                },
                {
                  icon: Route,
                  title: 'Smart Ticket Routing',
                  metric: '3x Faster Assignment',
                  desc: 'Routes incidents to the best-fit owner in seconds based on team, load, and expertise.',
                },
                {
                  icon: BarChart3,
                  title: 'Real-time Analytics',
                  metric: '15+ Visualizations',
                  desc: 'Track workload, SLA, and resolution trends with interactive dashboards built for operations.',
                },
              ].map((feature, idx) => (
                <SectionReveal key={feature.title} delay={idx * 0.08}>
                  <motion.div whileHover={{ y: -6, scale: 1.02 }} className="group h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-xl">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
                    <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{feature.metric}</p>
                    <p className="mt-4 text-slate-600">{feature.desc}</p>
                  </motion.div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white px-6 py-24 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <SectionReveal className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">How it works</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">From ticket creation to instant action in 3 steps</h2>
            </SectionReveal>

            <div className="relative mt-14 grid gap-8 md:grid-cols-3">
              <div className="pointer-events-none absolute left-1/2 top-14 hidden h-[2px] w-[62%] -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-cyan-500 md:block" />
              {[
                { title: 'Create Ticket', desc: 'Submit issue details from any channel.', icon: '01' },
                { title: 'AI Analyzes', desc: 'Model predicts urgency and category instantly.', icon: '02' },
                { title: 'Auto-Assigned', desc: 'Best-fit owner receives ticket with SLA context.', icon: '03' },
              ].map((step, i) => (
                <SectionReveal key={step.title} delay={i * 0.1}>
                  <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-lg font-black text-white shadow-lg">
                      {step.icon}
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-slate-600">{step.desc}</p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="dashboard-preview" className="px-6 py-24 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <SectionReveal>
              <div className="rounded-[2rem] border border-white/40 bg-gradient-to-br from-indigo-100/60 via-white to-cyan-100/60 p-6 shadow-2xl backdrop-blur-xl md:p-10">
                <div className="grid items-center gap-8 lg:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Live dashboard</p>
                    <h2 className="mt-3 text-4xl font-extrabold tracking-tight">Operational visibility in one glance</h2>
                    <p className="mt-4 text-slate-600">
                      Monitor backlog health, resolution velocity, and team performance with contextual insights that update in real time.
                    </p>
                    <ul className="mt-6 space-y-3 text-sm text-slate-700">
                      {['Priority heatmaps and SLA timelines', 'Assignee workload balancing', 'Confidence-based triage recommendations'].map((item) => (
                        <li key={item} className="inline-flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <motion.div
                    className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-xl"
                    initial={{ y: 10 }}
                    whileInView={{ y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-slate-100 p-4">
                        <p className="text-xs font-semibold text-slate-500">Resolution Rate</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">94%</p>
                      </div>
                      <div className="rounded-xl bg-slate-100 p-4">
                        <p className="text-xs font-semibold text-slate-500">Avg Response</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">1.4h</p>
                      </div>
                      <div className="col-span-2 rounded-xl bg-slate-100 p-4">
                        <p className="text-xs font-semibold text-slate-500">Priority Distribution</p>
                        <div className="mt-2 h-2 rounded-full bg-slate-200">
                          <div className="h-2 w-[28%] rounded-l-full bg-red-500" />
                          <div className="-mt-2 ml-[28%] h-2 w-[33%] bg-orange-500" />
                          <div className="-mt-2 ml-[61%] h-2 w-[26%] bg-amber-500" />
                          <div className="-mt-2 ml-[87%] h-2 w-[13%] rounded-r-full bg-emerald-500" />
                        </div>
                      </div>
                    </div>

                    <div className="absolute -bottom-4 -right-4 rounded-2xl border border-white/40 bg-white/75 p-4 shadow-lg backdrop-blur-xl">
                      <p className="text-xs font-semibold text-slate-500">AI Confidence</p>
                      <p className="text-xl font-black text-indigo-600">98.2%</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        <section className="bg-white px-6 py-24 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <SectionReveal className="text-center">
              <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Impact at scale</h2>
            </SectionReveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCounter end={92} suffix="%" label="Prediction Accuracy" />
              <StatCounter end={80} suffix="%" label="Time Saved" />
              <StatCounter end={1000} suffix="+" label="Tickets Processed" />
              <StatCounter end={3} suffix="x" label="Faster Resolution" />
            </div>
          </div>
        </section>

        <section className="px-6 py-24 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <SectionReveal className="text-center">
              <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Teams love how fast it feels</h2>
            </SectionReveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, idx) => (
                <SectionReveal key={t.name} delay={idx * 0.08}>
                  <motion.div whileHover={{ y: -5 }} className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-xl">
                    <div className="mb-3 flex items-center gap-1 text-amber-500">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-700">"{t.quote}"</p>
                    <div className="mt-5">
                      <p className="font-bold">{t.name}</p>
                      <p className="text-sm text-slate-500">{t.role}</p>
                    </div>
                  </motion.div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="px-6 pb-24 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <SectionReveal>
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-14 text-white shadow-2xl md:px-14">
                <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-cyan-300/30 blur-2xl" />

                <h2 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">Ready to Transform Your Ticket Management?</h2>
                <p className="mt-4 max-w-2xl text-indigo-100">
                  Join teams using AI to cut noise, route smarter, and close incidents faster across every support channel.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50">
                    Get Started Free
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/60 px-6 py-3 font-bold text-white transition hover:bg-white/10">
                    Schedule Demo
                    <PlayCircle className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-12 lg:px-10">
        <div className="mx-auto grid w-full max-w-7xl gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">TicketIQ</span>
            </div>
            <p className="mt-4 max-w-md text-sm text-slate-600">
              AI-powered ticket management for modern support organizations that need precision, speed, and executive visibility.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How it Works</a></li>
              <li><a href="#cta">Pricing</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><a href="#hero">About</a></li>
              <li><a href="#cta">Contact</a></li>
              <li><Link to="/login">Demo</Link></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} TicketIQ. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#hero" className="hover:text-slate-700">LinkedIn</a>
            <a href="#hero" className="hover:text-slate-700">X</a>
            <a href="#hero" className="hover:text-slate-700">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
