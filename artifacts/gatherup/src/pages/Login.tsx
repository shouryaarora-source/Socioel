import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Phone, ShieldCheck, ArrowLeft, RefreshCw,
  User, Mail, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Mode = "signin" | "signup";
type Step = "details" | "otp";

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("details");

  // Shared OTP state
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState(""); // actual phone OTP was sent to
  const [isLoading, setIsLoading] = useState(false);

  // Sign In state
  const [identifier, setIdentifier] = useState("");

  // Sign Up state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // ─── Sign In ────────────────────────────────────────────────────────────────

  async function handleSignInSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to send code", variant: "destructive" });
        return;
      }
      setOtpPhone(data.phone ?? identifier.trim());
      if (data.devCode) setDevCode(data.devCode);
      setStep("otp");
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignInVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: otpPhone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Invalid code", description: data.error || "Please check and try again.", variant: "destructive" });
        setOtp("");
        return;
      }
      if (data.isNewUser) {
        // Phone verified but no account — move to sign-up with phone prefilled
        setPhone(otpPhone);
        setMode("signup");
        setStep("details");
        setOtp("");
        setDevCode(null);
        toast({ title: "Phone verified!", description: "Fill in your details to create your account." });
        return;
      }
      login(data.user);
      toast({ title: `Welcome back, ${data.user.name}!` });
      setLocation(`/profile/${data.user.id}`);
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Sign Up ────────────────────────────────────────────────────────────────

  async function handleSignUpSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to send code", variant: "destructive" });
        return;
      }
      setOtpPhone(data.phone ?? phone.trim());
      if (data.devCode) setDevCode(data.devCode);
      setStep("otp");
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        phone: otpPhone,
        code: otp,
      };
      if (email.trim()) body.email = email.trim().toLowerCase();
      if (gender) body.gender = gender;
      if (age) body.age = parseInt(age);
      if (profession.trim()) body.profession = profession.trim();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Registration failed", description: data.error || "Please try again.", variant: "destructive" });
        if (res.status === 400 && data.error?.includes("already registered")) {
          setStep("details");
        } else {
          setOtp("");
        }
        return;
      }
      login(data.user);
      toast({ title: `Welcome to Socioel, ${data.user.name}!`, description: "Your account is ready." });
      setLocation(`/profile/${data.user.id}`);
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  function handleOtpChange(val: string) {
    if (/^\d{0,6}$/.test(val)) setOtp(val);
  }

  function resetToDetails() {
    setStep("details");
    setOtp("");
    setDevCode(null);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setStep("details");
    setOtp("");
    setDevCode(null);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-3xl mb-4 shadow-lg">
            S
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">Socioel</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover your community</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-muted rounded-2xl p-1 mb-5">
          <button
            onClick={() => switchMode("signin")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              mode === "signin"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchMode("signup")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              mode === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="bg-card rounded-3xl border shadow-sm p-6">

          {/* ── SIGN IN ── */}
          {mode === "signin" && step === "details" && (
            <>
              <div className="mb-5">
                <h2 className="font-display font-bold text-xl text-foreground mb-1">Welcome back</h2>
                <p className="text-sm text-muted-foreground">Enter your phone number or email to continue.</p>
              </div>
              <form onSubmit={handleSignInSendOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Phone or Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="+91 98765 43210 or you@email.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-xl h-11" disabled={isLoading || !identifier.trim()}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Code
                </Button>
              </form>
            </>
          )}

          {mode === "signin" && step === "otp" && (
            <>
              <button onClick={resetToDetails} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 -ml-1 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="mb-5">
                <h2 className="font-display font-bold text-xl text-foreground mb-1">Enter code</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{otpPhone}</span>
                </p>
              </div>
              {devCode && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium mb-1">Dev mode — your code:</p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-amber-800">{devCode}</p>
                </div>
              )}
              <form onSubmit={handleSignInVerify} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  className="rounded-xl text-center text-2xl font-mono tracking-widest h-14"
                  autoFocus
                  disabled={isLoading}
                />
                <Button type="submit" className="w-full rounded-xl h-11" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Verify & Sign In
                </Button>
                <button
                  type="button"
                  onClick={handleSignInSendOtp}
                  disabled={isLoading}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 py-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend code
                </button>
              </form>
            </>
          )}

          {/* ── SIGN UP ── */}
          {mode === "signup" && step === "details" && (
            <>
              <div className="mb-5">
                <h2 className="font-display font-bold text-xl text-foreground mb-1">Create your account</h2>
                <p className="text-sm text-muted-foreground">Tell us a bit about yourself.</p>
              </div>
              <form onSubmit={handleSignUpSendOtp} className="space-y-4">

                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Full Name <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                      required
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Phone Number <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Email <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Optional fields toggle */}
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline transition-colors"
                >
                  {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showOptional ? "Hide" : "Add"} optional details
                </button>

                {showOptional && (
                  <div className="space-y-4 pt-1">
                    {/* Gender */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Gender</label>
                      <div className="flex flex-wrap gap-2">
                        {GENDERS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(gender === g ? "" : g)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                              gender === g
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Age</label>
                      <Input
                        type="number"
                        min="13"
                        max="100"
                        placeholder="Your age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="rounded-xl h-12"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Profession */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Profession</label>
                      <Input
                        placeholder="e.g. Software Engineer, Teacher…"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="rounded-xl h-12"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-xl h-11 mt-2"
                  disabled={isLoading || !name.trim() || !phone.trim()}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Verification Code
                </Button>
              </form>
            </>
          )}

          {mode === "signup" && step === "otp" && (
            <>
              <button onClick={resetToDetails} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 -ml-1 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="mb-5">
                <h2 className="font-display font-bold text-xl text-foreground mb-1">Verify your number</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{otpPhone}</span>
                </p>
              </div>
              {devCode && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium mb-1">Dev mode — your code:</p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-amber-800">{devCode}</p>
                </div>
              )}
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  className="rounded-xl text-center text-2xl font-mono tracking-widest h-14"
                  autoFocus
                  disabled={isLoading}
                />
                <Button type="submit" className="w-full rounded-xl h-11" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Create Account
                </Button>
                <button
                  type="button"
                  onClick={handleSignUpSendOtp}
                  disabled={isLoading}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 py-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend code
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
