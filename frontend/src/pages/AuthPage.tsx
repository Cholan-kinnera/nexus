import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

// ─── Cursor glow hook ─────────────────────────────────────────────────────────
function useCursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--glow-x", `${x}px`);
      el.style.setProperty("--glow-y", `${y}px`);
      el.style.setProperty("--glow-opacity", "1");
    };

    const leave = () => {
      el.style.setProperty("--glow-opacity", "0");
    };

    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  return ref;
}

// ─── Magnetic button hook ─────────────────────────────────────────────────────
function useMagnetic() {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.25;
      const dy = (e.clientY - cy) * 0.25;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const reset = () => {
      el.style.transform = "translate(0,0)";
    };

    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", reset);
    };
  }, []);

  return ref;
}

// ─── Card tilt hook ───────────────────────────────────────────────────────────
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (y - 0.5) * -6;
      const rotateY = (x - 0.5) * 6;
      el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const reset = () => {
      el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    };

    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", reset);
    };
  }, []);

  return ref;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface LoginForm { email: string; password: string; remember: boolean }
interface SignupForm { fullName: string; email: string; password: string; confirmPassword: string }

// ─── Auth Page ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const { login } = useAuth();
  const glowRef = useCursorGlow();

  return (
    <div className="min-h-screen bg-[#0a0812] flex items-center justify-center p-4 overflow-hidden">

      {/* Ambient background orbs — static, always present */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] bg-violet-700/8 rounded-full blur-[130px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-violet-900/6 rounded-full blur-[110px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-indigo-800/5 rounded-full blur-[90px] animate-pulse-slow" style={{ animationDelay: "4s" }} />
      </div>

      {/* Main card with cursor glow effect */}
      <div
        ref={glowRef}
        className="relative w-full max-w-[960px] flex rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/70 auth-card-glow"
        style={{ "--glow-x": "50%", "--glow-y": "50%", "--glow-opacity": "0" } as React.CSSProperties}
      >
        {/* Cursor glow layer — follows mouse inside card */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 rounded-2xl"
          style={{
            background: "radial-gradient(400px circle at var(--glow-x) var(--glow-y), rgba(124,58,237,0.08), transparent 70%)",
            opacity: "var(--glow-opacity)",
          }}
        />

        <LeftPanel activeTab={activeTab} />

        <div className="flex-1 bg-[#12101e] flex flex-col p-8 min-h-[600px] relative z-10">
          {/* Tabs */}
          <div className="flex border-b border-white/[0.08] mb-8">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-all duration-300
                  ${activeTab === tab
                    ? "text-violet-400 border-violet-500"
                    : "text-slate-500 border-transparent hover:text-slate-400"
                  }`}
              >
                {tab === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Sliding track */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex h-full"
              style={{
                width: "200%",
                transform: activeTab === "login" ? "translateX(0)" : "translateX(-50%)",
                transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div className="h-full" style={{ width: "50%", flexShrink: 0 }}>
                <LoginForm
                  onSwitch={() => setActiveTab("signup")}
                  onSuccess={() => navigate("/dashboard")}
                  login={login}
                />
              </div>
              <div className="h-full pl-6" style={{ width: "50%", flexShrink: 0 }}>
                <SignupForm
                  onSwitch={() => setActiveTab("login")}
                  onSuccess={() => setActiveTab("login")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Left Panel with tilt ─────────────────────────────────────────────────────
function LeftPanel({ activeTab }: { activeTab: "login" | "signup" }) {
  const tiltRef = useTilt();

  return (
    <div
      ref={tiltRef}
      className="hidden md:flex flex-col w-[420px] bg-[#0e0b1e] p-10 justify-between relative overflow-hidden border-r border-white/[0.05] transition-transform duration-100 ease-out"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.025] animate-grid-shift"
        style={{
          backgroundImage:
            "linear-gradient(#a78bfa 1px, transparent 1px), linear-gradient(90deg, #a78bfa 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating glow orb inside left panel */}
      <div className="absolute top-1/3 left-1/4 w-[280px] h-[280px] bg-violet-600/12 rounded-full blur-[70px] animate-float pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center gap-3 z-10">
        <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50 animate-logo-glow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="#fff" opacity="0.9" />
          </svg>
        </div>
        <span className="text-white font-semibold text-lg tracking-wide">
          NEXUS <span className="text-violet-400">PM</span>
        </span>
      </div>

      {/* Copy — fades between login/signup */}
      <div className="relative z-10">
        <h2 className="text-white text-3xl font-semibold leading-tight mb-3 transition-all duration-500">
          {activeTab === "login" ? (
            <>Welcome<br /><span className="text-violet-400">back.</span></>
          ) : (
            <>Start<br /><span className="text-violet-400">building.</span></>
          )}
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-10 transition-all duration-500">
          {activeTab === "login"
            ? "Your projects, tasks, and team are waiting for you."
            : "Streamline your projects, manage tasks, and boost productivity."}
        </p>

        {[
          { icon: "📋", label: "Project Management", sub: "Organise and track your projects" },
          { icon: "👥", label: "Team Collaboration", sub: "Work together seamlessly" },
          { icon: "📊", label: "Task Tracking", sub: "Stay on top of every task" },
        ].map((f, i) => (
          <div
            key={f.label}
            className="flex items-center gap-4 mb-5 group"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="w-10 h-10 rounded-xl bg-violet-900/40 border border-violet-800/40 flex items-center justify-center text-base flex-shrink-0 group-hover:bg-violet-800/50 group-hover:border-violet-600/50 transition-all duration-300 group-hover:scale-110">
              {f.icon}
            </div>
            <div>
              <p className="text-white text-sm font-medium group-hover:text-violet-300 transition-colors duration-200">{f.label}</p>
              <p className="text-slate-600 text-xs">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="relative z-10 text-slate-700 text-xs">© 2026 Nexus PM. All rights reserved.</p>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitch, onSuccess, login }: {
  onSwitch: () => void;
  onSuccess: () => void;
  login: (token: string) => void;
}) {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "", remember: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const btnRef = useMagnetic();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email: form.email, password: form.password });
      login(data.access_token);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <p className="text-white text-xl font-semibold mb-1">Welcome back!</p>
      <p className="text-slate-500 text-sm mb-7">Login to your account</p>

      {error && <ErrorBox message={error} />}

      <Field label="Email">
        <InputWrap icon="✉">
          <input type="email" placeholder="Enter your email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required className="auth-input" />
        </InputWrap>
      </Field>

      <Field label="Password">
        <InputWrap icon="🔒">
          <input type={showPw ? "text" : "password"} placeholder="Enter your password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            required className="auth-input pr-10" />
          <EyeToggle show={showPw} onToggle={() => setShowPw(!showPw)} />
        </InputWrap>
      </Field>

      <div className="flex justify-between items-center mb-6">
        <label className="flex items-center gap-2 text-slate-500 text-xs cursor-pointer">
          <input type="checkbox" checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            className="accent-violet-500" />
          Remember me
        </label>
        <button type="button" className="text-violet-400 text-xs hover:text-violet-300 transition-colors">
          Forgot password?
        </button>
      </div>

      <button ref={btnRef} type="submit" disabled={loading}
        className="magnetic-btn w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60
          text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2
          shadow-lg shadow-violet-900/40 mb-5 transition-all duration-200">
        {loading ? <Spinner /> : <>Login →</>}
      </button>

      <Divider />
      <SocialButtons />
      <p className="text-center text-slate-500 text-sm mt-5">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
          Sign up
        </button>
      </p>
    </form>
  );
}

// ─── Signup Form ──────────────────────────────────────────────────────────────
function SignupForm({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<SignupForm>({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const btnRef = useMagnetic();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords don't match.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await api.post("/auth/signup", { email: form.email, password: form.password, full_name: form.fullName });
      setSuccess(true);
      setTimeout(onSuccess, 1800);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-3xl animate-success-pop">✅</div>
        <p className="text-white text-lg font-medium">Account created!</p>
        <p className="text-slate-500 text-sm">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <p className="text-white text-xl font-semibold mb-1">Create account</p>
      <p className="text-slate-500 text-sm mb-6">Start managing your projects today</p>

      {error && <ErrorBox message={error} />}

      <Field label="Full name">
        <InputWrap icon="👤">
          <input type="text" placeholder="Enter your name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required className="auth-input" />
        </InputWrap>
      </Field>
      <Field label="Email">
        <InputWrap icon="✉">
          <input type="email" placeholder="Enter your email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required className="auth-input" />
        </InputWrap>
      </Field>
      <Field label="Password">
        <InputWrap icon="🔒">
          <input type={showPw ? "text" : "password"} placeholder="Create a password (min 8 chars)"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            required className="auth-input pr-10" />
          <EyeToggle show={showPw} onToggle={() => setShowPw(!showPw)} />
        </InputWrap>
      </Field>
      <Field label="Confirm password">
        <InputWrap icon="🔒">
          <input type={showPw ? "text" : "password"} placeholder="Confirm your password"
            value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required className="auth-input" />
        </InputWrap>
      </Field>

      <button ref={btnRef} type="submit" disabled={loading}
        className="magnetic-btn w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60
          text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2
          shadow-lg shadow-violet-900/40 mb-5 transition-all duration-200">
        {loading ? <Spinner /> : <>Create account →</>}
      </button>

      <Divider />
      <SocialButtons />
      <p className="text-center text-slate-500 text-sm mt-4">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
          Login
        </button>
      </p>
    </form>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-slate-400 text-xs font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function InputWrap({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-40">{icon}</span>
      {children}
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
      aria-label={show ? "Hide password" : "Show password"}>
      {show ? "🙈" : "👁"}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 px-4 py-3 rounded-lg bg-red-950/60 border border-red-800/50 text-red-400 text-sm animate-shake">
      {message}
    </div>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

function Divider() {
  return (
    <div className="relative text-center mb-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/[0.06]" />
      </div>
      <span className="relative bg-[#12101e] px-3 text-slate-600 text-xs">or continue with</span>
    </div>
  );
}

function SocialButtons() {
  return (
    <div className="flex gap-3">
      {[
        { name: "Google", logo: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
        { name: "GitHub", logo: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg> },
      ].map(({ name, logo }) => (
        <button key={name} type="button"
          className="social-btn flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
            border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07]
            text-slate-300 text-sm font-medium transition-all duration-200 hover:border-violet-500/30 hover:scale-[1.02]">
          {logo}{name}
        </button>
      ))}
    </div>
  );
}
