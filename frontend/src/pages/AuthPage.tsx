import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import ParticleBackground from "../components/auth/ParticleBackground";
import { GoogleLogin } from "@react-oauth/google";

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
  const glowRef = useCursorGlow();

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 overflow-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <ParticleBackground />

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[130px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-violet-850/10 rounded-full blur-[110px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      {/* Main card with cursor glow effect */}
      <div
        ref={glowRef}
        className="relative z-20 max-w-[960px] flex rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900/40 backdrop-blur-md"
        style={{ "--glow-x": "50%", "--glow-y": "50%", "--glow-opacity": "0" } as React.CSSProperties}
      >
        {/* Cursor glow layer */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 rounded-2xl"
          style={{
            background: "radial-gradient(400px circle at var(--glow-x) var(--glow-y), rgba(124,58,237,0.04), transparent 70%)",
            opacity: "var(--glow-opacity)",
          }}
        />

        <LeftPanel activeTab={activeTab} />

        <div className="flex-1 bg-zinc-900/80 flex flex-col p-8 min-h-[600px] relative z-10 w-full sm:w-[480px]">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 mb-8 font-mono">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 pb-3 text-xs font-semibold border-b-2 transition-all duration-300 cursor-pointer
                  ${activeTab === tab
                    ? "text-zinc-100 border-zinc-100"
                    : "text-zinc-500 border-transparent hover:text-zinc-400"
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
      className="hidden md:flex flex-col w-[380px] bg-zinc-950/50 p-10 justify-between relative overflow-hidden border-r border-zinc-800 transition-transform duration-100 ease-out"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.03] animate-grid-shift"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating glow orb */}
      <div className="absolute top-1/3 left-1/4 w-[280px] h-[280px] bg-violet-500/5 rounded-full blur-[70px] animate-float pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center gap-3 z-10">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shadow-lg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="#09090b" opacity="0.9" />
          </svg>
        </div>
        <span className="text-white font-bold text-base tracking-wide font-mono">
          NEXUS <span className="text-zinc-500">PM</span>
        </span>
      </div>

      {/* Copy */}
      <div className="relative z-10">
        <h2 className="text-white text-3xl font-semibold leading-tight mb-3 transition-all duration-500">
          {activeTab === "login" ? (
            <>Welcome<br /><span className="text-zinc-400">back.</span></>
          ) : (
            <>Start<br /><span className="text-zinc-400">building.</span></>
          )}
        </h2>
        <p className="text-zinc-455 text-xs leading-relaxed mb-8 transition-all duration-500">
          {activeTab === "login"
            ? "Your projects, tasks, and team are waiting for you."
            : "Streamline your projects, manage tasks, and boost productivity."}
        </p>

        {[
          { icon: "clipboard", label: "Project Management", sub: "Organise and track your projects" },
          { icon: "users", label: "Team Collaboration", sub: "Work together seamlessly" },
          { icon: "chart", label: "Task Tracking", sub: "Stay on top of every task" },
        ].map((f, i) => (
          <div
            key={f.label}
            className="flex items-center gap-4 mb-5 group cursor-default"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0 group-hover:border-zinc-700 transition-all duration-300">
              <FeatureIcon type={f.icon} />
            </div>
            <div>
              <p className="text-zinc-200 text-xs font-semibold group-hover:text-white transition-colors duration-200">{f.label}</p>
              <p className="text-zinc-500 text-[10px] font-mono mt-0.5">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="relative z-10 text-zinc-600 font-mono text-[10px]">&copy; 2026 Nexus PM. All rights reserved.</p>
    </div>
  );
}

// ─── Feature icons ────────────────────────────────────────────────────────────
function FeatureIcon({ type }: { type: string }) {
  switch (type) {
    case "clipboard":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
          <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
        </svg>
      );
    case "users":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "chart":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-6 4 4 5-8" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitch, onSuccess }: {
  onSwitch: () => void;
  onSuccess: () => void;
}) {
  const { login } = useAuth();
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
      login(data.access_token, { full_name: data.full_name, email: data.email });
      onSuccess();
    } catch (err: any) {
      if (err?.response?.status === 422) {
        setError("Invalid input formatting. Please check your email and fields.");
      } else if (typeof err?.response?.data?.detail === "string") {
        setError(err.response.data.detail);
      } else if (Array.isArray(err?.response?.data?.detail)) {
        const msgs = err.response.data.detail.map((d: any) => d.msg).join(", ");
        setError(`Validation Error: ${msgs}`);
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full text-zinc-200">
      <p className="text-white text-lg font-bold mb-1">Welcome back!</p>
      <p className="text-zinc-500 text-xs mb-6 font-mono">Login to your account</p>

      {error && <ErrorBox message={error} />}

      <Field label="Email">
        <InputWrap icon="mail">
          <input type="email" placeholder="Enter your email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required className="auth-input" />
        </InputWrap>
      </Field>

      <Field label="Password">
        <InputWrap icon="lock">
          <input type={showPw ? "text" : "password"} placeholder="Enter your password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            required className="auth-input pr-10" />
          <EyeToggle show={showPw} onToggle={() => setShowPw(!showPw)} />
        </InputWrap>
      </Field>

      <div className="flex justify-between items-center mb-6 font-mono text-[10px]">
        <label className="flex items-center gap-2 text-zinc-500 cursor-pointer select-none">
          <input type="checkbox" checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            className="accent-zinc-400" />
          Remember me
        </label>
        <button type="button" className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
          Forgot password?
        </button>
      </div>

      <button ref={btnRef} type="submit" disabled={loading}
        className="magnetic-btn w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold font-mono rounded-lg flex items-center justify-center gap-2 mb-5 transition-all duration-200 cursor-pointer">
        {loading ? <Spinner /> : <>Login &rarr;</>}
      </button>

      <Divider />
      <SocialButtons setLoading={setLoading} setError={setError} />
      <p className="text-center text-zinc-500 text-xs mt-6 font-mono">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-zinc-300 font-semibold hover:text-white transition-colors cursor-pointer">
          Sign up
        </button>
      </p>
    </form>
  );
}

// ─── Signup Form ──────────────────────────────────────────────────────────────
function SignupForm({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<SignupForm>({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // OTP Verification States
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpTimer, setOtpTimer] = useState(59);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const inputRefs = useRef<HTMLInputElement[]>([]);

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
      setOtpTimer(59);
    } catch (err: any) {
      if (err?.response?.status === 422) {
        setError("Invalid input formatting. Please check your email and fields.");
      } else if (typeof err?.response?.data?.detail === "string") {
        setError(err.response.data.detail);
      } else if (Array.isArray(err?.response?.data?.detail)) {
        const msgs = err.response.data.detail.map((d: any) => d.msg).join(", ");
        setError(`Validation Error: ${msgs}`);
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for OTP
  useEffect(() => {
    if (success && otpTimer > 0) {
      const timerInterval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [success, otpTimer]);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next input box
    if (index < 5 && element.value) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      // Focus previous input box
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    setVerifying(true);
    setOtpError("");

    try {
      const { data } = await api.post("/auth/verify-otp", {
        email: form.email,
        otp: otpCode
      });

      if (data.access_token) {
        login(data.access_token, { full_name: data.full_name, email: data.email });
        onSuccess();
        navigate("/dashboard");
      } else {
        throw new Error("No token returned from server.");
      }
    } catch (err: any) {
      setOtpError(err?.response?.data?.detail || "Invalid verification code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = () => {
    setOtpTimer(59);
    setOtp(Array(6).fill(""));
    setOtpError("");
    alert("A new OTP code has been sent to your email!");
  };

  if (success) {
    return (
      <form onSubmit={handleVerifyOtp} className="flex flex-col h-full justify-between animate-fade-in text-zinc-200">
        <div>
          <p className="text-white text-lg font-bold mb-1">Verify your email</p>
          <p className="text-zinc-500 text-xs mb-6 font-mono leading-relaxed">
            We sent a secure code to: <span className="font-semibold text-zinc-300">{form.email}</span>
          </p>

          {otpError && <ErrorBox message={otpError} />}

          {/* 6 OTP Boxes Row */}
          <div className="flex justify-between gap-2.5 mb-6">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => { inputRefs.current[idx] = el as HTMLInputElement; }}
                onChange={(e) => handleOtpChange(e.target, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-10 h-12 text-center text-xl font-bold font-mono bg-zinc-950 border border-zinc-800 rounded-xl focus:border-zinc-700 text-zinc-105 outline-none transition-all duration-200"
              />
            ))}
          </div>

          {/* Resend Timer section */}
          <div className="text-center mb-6">
            {otpTimer > 0 ? (
              <p className="text-[10px] text-zinc-500 font-mono">
                Resend code in <span className="font-bold text-zinc-300">{otpTimer}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                className="text-[10px] font-semibold font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Resend Verification Code
              </button>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={verifying}
            className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold font-mono rounded-lg flex items-center justify-center gap-2 mb-4 transition-all duration-200 cursor-pointer"
          >
            {verifying ? <Spinner /> : "Verify OTP"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full text-zinc-200">
      <p className="text-white text-lg font-bold mb-1">Create account</p>
      <p className="text-zinc-500 text-xs mb-6 font-mono">Start managing your projects today</p>

      {error && <ErrorBox message={error} />}

      <Field label="Full name">
        <InputWrap icon="user">
          <input type="text" placeholder="Enter your name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required className="auth-input" />
        </InputWrap>
      </Field>
      <Field label="Email">
        <InputWrap icon="mail">
          <input type="email" placeholder="Enter your email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required className="auth-input" />
        </InputWrap>
      </Field>
      <Field label="Password">
        <InputWrap icon="lock">
          <input type={showPw ? "text" : "password"} placeholder="Create a password (min 8 chars)"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            required className="auth-input pr-10" />
          <EyeToggle show={showPw} onToggle={() => setShowPw(!showPw)} />
        </InputWrap>
      </Field>
      <Field label="Confirm password">
        <InputWrap icon="lock">
          <input type={showPw ? "text" : "password"} placeholder="Confirm your password"
            value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required className="auth-input" />
        </InputWrap>
      </Field>

      <button ref={btnRef} type="submit" disabled={loading}
        className="magnetic-btn w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold font-mono rounded-lg flex items-center justify-center gap-2 mb-5 transition-all duration-200 cursor-pointer">
        {loading ? <Spinner /> : <>Create account &rarr;</>}
      </button>

      <Divider />
      <SocialButtons setLoading={setLoading} setError={setError} />
      <p className="text-center text-zinc-500 text-xs mt-4 font-mono">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-zinc-300 font-semibold hover:text-white transition-colors cursor-pointer">
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
      <label className="block text-zinc-400 text-xs font-medium mb-1.5 font-sans">{label}</label>
      {children}
    </div>
  );
}

function InputWrap({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550 pointer-events-none">
        <InputIcon type={icon} />
      </span>
      {children}
    </div>
  );
}

// ─── Input icons ──────────────────────────────────────────────────────────────
function InputIcon({ type }: { type: string }) {
  switch (type) {
    case "mail":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
        </svg>
      );
    case "lock":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      );
    case "user":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-550 hover:text-zinc-300 transition-colors cursor-pointer"
      aria-label={show ? "Hide password" : "Show password"}>
      {show ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 px-4 py-2.5 rounded bg-zinc-950 border border-red-900/60 text-red-400 text-xs font-mono animate-shake">
      {message}
    </div>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />;
}

function Divider() {
  return (
    <div className="relative text-center mb-5 font-mono text-[10px]">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-850" />
      </div>
      <span className="relative bg-zinc-900 px-3 text-zinc-550">or continue with</span>
    </div>
  );
}

function SocialButtons({
  setLoading,
  setError,
}: {
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
}) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setLoading(true);
    try {
      const token = credentialResponse.credential;
      if (!token) {
        throw new Error("No credential token returned from Google");
      }
      const { data } = await api.post("/auth/google", {
        credential_token: token,
      });
      login(data.access_token, {
        full_name: data.full_name,
        email: data.email,
        role: data.role || "developer",
      });
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err?.response?.status === 422) {
        setError("Invalid Google token formatting or parameters.");
      } else if (typeof err?.response?.data?.detail === "string") {
        setError(err.response.data.detail);
      } else {
        setError("Google authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  return (
    <div className="flex flex-col gap-3 items-center justify-center w-full">
      <div className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_black"
          shape="rectangular"
          text="continue_with"
          width="380"
        />
      </div>
    </div>
  );
}
