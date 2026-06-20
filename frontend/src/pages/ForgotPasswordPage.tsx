import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ParticleBackground from "../components/auth/ParticleBackground";
import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../services/authService";
import {
  Mail,
  Lock,
  ShieldAlert,
  Check,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

// Magnetic button hook for cursor interactivity
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

// Card tilt hook for interactive 3D rotation
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = (e.clientX - cx) / (rect.width / 2);
      const y = (e.clientY - cy) / (rect.height / 2);
      
      const rx = y * -6;
      const ry = x * 6;
      el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    const leave = () => {
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [otpTimer, setOtpTimer] = useState(59);
  const otpInputRefs = useRef<HTMLInputElement[]>([]);
  
  const btnRef = useMagnetic();
  const tiltRef = useTilt();

  useEffect(() => {
    if (step === 2 && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, otpTimer]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccessMsg("Reset code has been sent to your email.");
      setOtpTimer(59);
      setStep(2);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { detail?: string } | undefined;
        setError(responseData?.detail || "Failed to send reset code. Please verify your email.");
      } else {
        setError("Failed to send reset code. Please verify your email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter all 6 digits of the code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyResetOtp(email.trim(), otpCode);
      setSuccessMsg("Code verified. Please enter your new password.");
      setStep(3);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { detail?: string } | undefined;
        setError(responseData?.detail || "Invalid code. Please try again.");
      } else {
        setError("Invalid code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const otpCode = otp.join("");
      await resetPassword(email.trim(), otpCode, newPassword);
      alert("Password reset successfully! Redirecting to login...");
      navigate("/auth");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { detail?: string } | undefined;
        setError(responseData?.detail || "Failed to reset password. Please request a new code.");
      } else {
        setError("Failed to reset password. Please request a new code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (index < 5 && element.value) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      if (index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      await forgotPassword(email.trim());
      setSuccessMsg("A new verification code has been sent!");
      setOtpTimer(59);
      setOtp(Array(6).fill(""));
    } catch {
      setError("Failed to resend code. Please try again.");
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, text: "None", color: "bg-zinc-800" };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    switch (score) {
      case 1:
        return { score: 25, text: "Weak", color: "bg-red-500" };
      case 2:
        return { score: 50, text: "Fair", color: "bg-amber-500" };
      case 3:
        return { score: 75, text: "Good", color: "bg-violet-500" };
      case 4:
        return { score: 100, text: "Strong", color: "bg-emerald-500" };
      default:
        return { score: 0, text: "Weak", color: "bg-red-500" };
    }
  };

  const pwStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 overflow-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <ParticleBackground />

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[130px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-violet-850/10 rounded-full blur-[110px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      {/* Main card */}
      <div className="relative z-20 max-w-[960px] flex rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900/40 backdrop-blur-md">
        {/* Left Side Panel */}
        <div
          ref={tiltRef}
          className="hidden md:flex flex-col w-[380px] bg-zinc-950/50 p-10 justify-between relative overflow-hidden border-r border-zinc-800 transition-transform duration-100 ease-out"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Animated grid */}
          <div
            className="absolute inset-0 opacity-[0.03] animate-grid-shift"
            style={{
              backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute top-1/3 left-1/4 w-[280px] h-[280px] bg-violet-500/5 rounded-full blur-[70px] animate-float pointer-events-none" />

          {/* Logo */}
          <div className="relative flex items-center gap-3 z-10">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shadow-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="#09090b" opacity="0.9" />
              </svg>
            </div>
            <span className="text-zinc-50 font-bold text-base tracking-wide font-mono">
              NEXUS <span className="text-zinc-500">PM</span>
            </span>
          </div>

          <div className="relative z-10">
            <h2 className="text-zinc-50 text-3xl font-semibold leading-tight mb-3">
              Reset<br /><span className="text-zinc-400">Password.</span>
            </h2>
            <p className="text-zinc-500 text-xs leading-relaxed mb-6">
              Follow the secure steps to restore your account configuration.
            </p>
          </div>
          <p className="relative z-10 text-zinc-600 font-mono text-[10px]">&copy; 2026 Nexus PM. All rights reserved.</p>
        </div>

        {/* Right Side Form Panel */}
        <div className="flex-1 bg-zinc-900/80 flex flex-col px-10 py-8 min-h-[600px] relative z-10 w-full sm:w-[480px]">
          {/* Back Button */}
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-50 text-2xs font-mono mb-8 self-start transition-colors cursor-pointer"
          >
            <ArrowLeft size={12} />
            Back to Login
          </button>

          {/* Error and Success Banners */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-900/60 rounded-lg flex items-start gap-2.5 text-xs text-red-400 font-mono animate-shake">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && !error && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-lg flex items-start gap-2.5 text-xs text-emerald-400 font-mono">
              <Check size={14} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="flex flex-col justify-between flex-1 text-zinc-200">
              <div>
                <p className="text-zinc-50 text-lg font-bold mb-1">Forgot Password?</p>
                <p className="text-zinc-500 text-xs mb-6 font-mono">
                  Enter your email address and we'll send you a 6-digit verification code.
                </p>

                <div className="mb-6">
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5 font-sans">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550">
                      <Mail size={14} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 pl-10 focus:border-zinc-700 text-zinc-100 placeholder-zinc-650 outline-none transition duration-200 text-sm font-sans"
                    />
                  </div>
                </div>
              </div>

              <button
                ref={btnRef}
                type="submit"
                disabled={loading || !email}
                className="magnetic-btn w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-bold font-mono rounded-lg flex items-center justify-center gap-2 mb-5 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col justify-between flex-1 text-zinc-200">
              <div>
                <p className="text-zinc-50 text-lg font-bold mb-1">Verify Reset Code</p>
                <p className="text-zinc-500 text-xs mb-6 font-mono leading-relaxed">
                  Enter the secure 6-digit verification code sent to: <span className="font-semibold text-zinc-300">{email}</span>
                </p>

                <div className="flex justify-between gap-2.5 mb-6">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      ref={(el) => { otpInputRefs.current[idx] = el as HTMLInputElement; }}
                      onChange={(e) => handleOtpChange(e.target, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="w-10 h-12 text-center text-xl font-bold font-mono bg-zinc-950 border border-zinc-800 rounded-xl focus:border-zinc-700 text-zinc-100 outline-none transition-all duration-200"
                    />
                  ))}
                </div>

                <div className="text-center mb-6">
                  {otpTimer > 0 ? (
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Resend code in <span className="font-bold text-zinc-300">{otpTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-[10px] font-semibold font-mono text-zinc-300 hover:text-zinc-50 transition-colors cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>

              <button
                ref={btnRef}
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="magnetic-btn w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-bold font-mono rounded-lg flex items-center justify-center gap-2 mb-5 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="flex flex-col justify-between flex-1 text-zinc-200">
              <div className="space-y-4">
                <div>
                  <p className="text-zinc-50 text-lg font-bold mb-1">Set New Password</p>
                  <p className="text-zinc-500 text-xs mb-4 font-mono">
                    Please secure your account with a strong password combination.
                  </p>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5 font-sans">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550">
                      <Lock size={14} />
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="auth-input w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 pl-10 pr-10 focus:border-zinc-700 text-zinc-100 placeholder-zinc-650 outline-none transition duration-200 text-sm font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-550 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Password Strength Gauge */}
                  {newPassword && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500">Strength:</span>
                        <span className={`font-bold uppercase ${pwStrength.text === "Weak" ? "text-red-400" : pwStrength.text === "Fair" ? "text-amber-400" : pwStrength.text === "Good" ? "text-violet-400" : "text-emerald-400"}`}>
                          {pwStrength.text}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                        <div
                          className={`h-full ${pwStrength.color} transition-all duration-300`}
                          style={{ width: `${pwStrength.score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5 font-sans">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550">
                      <Lock size={14} />
                    </span>
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      required
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="auth-input w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 pl-10 pr-10 focus:border-zinc-700 text-zinc-100 placeholder-zinc-650 outline-none transition duration-200 text-sm font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-550 hover:text-zinc-300 cursor-pointer"
                    >
                      {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                ref={btnRef}
                type="submit"
                disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="magnetic-btn w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-bold font-mono rounded-lg flex items-center justify-center gap-2 mb-5 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
