import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Phone, Mail, User, Lock, Eye, EyeOff,
  ChevronDown, ChevronUp, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Mode = "signin" | "signup";

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In state
  const [identifier, setIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // ─── Navigation / gestures ───────────────────────────────────────────────────

  function goBack() {
    // If user came from CreateEvent (and we redirected to login), always send them back home.
    if (sessionStorage.getItem("pendingCreateEvent") === "1") {
      try {
        sessionStorage.removeItem("pendingCreateEvent");
      } catch {
        // ignore
      }
      setLocation("/");
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    setLocation(sessionStorage.getItem("postLoginRedirect") || "/");
  }


  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (t) touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    const t = e.changedTouches[0];
    touchStart.current = null;
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Leftward swipe: significant horizontal travel, mostly horizontal
    if (dx < -70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goBack();
    }
  }

  // ─── Sign In ────────────────────────────────────────────────────────────────

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !signInPassword) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim(), password: signInPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Sign in failed", description: data.error || "Please check your details.", variant: "destructive" });
        return;
      }
      login(data.user);
      toast({ title: `Welcome back, ${data.user.name}!` });

      const redirectTo = sessionStorage.getItem("postLoginRedirect");
      if (redirectTo) sessionStorage.removeItem("postLoginRedirect");

      setLocation(redirectTo || `/profile/${data.user.id}`);

    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Sign Up ────────────────────────────────────────────────────────────────

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !password) return;

    // Helps debug “Network error” by surfacing server errors in UI.
    // (Backend returns JSON { error: ... } on failures.)
    const getServerError = async (res: Response) => {
      try {
        const data = await res.json();
        return data?.error || JSON.stringify(data);
      } catch {
        return await res.text();
      }
    };

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please re-enter your password.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),

        phone: phone.trim(),
        password,
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

      if (!res.ok) {
        const serverError = await getServerError(res);
        toast({ title: "Registration failed", description: serverError || "Please try again.", variant: "destructive" });
        return;
      }

      const data = await res.json();

      login(data.user);
      toast({ title: `Welcome to Socioel, ${data.user.name}!`, description: "Your account is ready." });
      setLocation(`/profile/${data.user.id}`);
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setShowPassword(false);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close / go back */}
      <button
        type="button"
        onClick={goBack}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground bg-muted/60 hover:bg-muted hover:text-foreground transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

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
          {mode === "signin" && (
            <>
              <div className="mb-5">
                <h2 className="font-display font-bold text-xl text-foreground mb-1">Welcome back</h2>
                <p className="text-sm text-muted-foreground">Sign in with your phone or email.</p>
              </div>
              <form onSubmit={handleSignIn} className="space-y-4">
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
                      autoComplete="username"
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="pl-10 pr-10 rounded-xl h-12"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-xl h-11" disabled={isLoading || !identifier.trim() || !signInPassword}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-5">
                Don't have an account?{" "}
                <button onClick={() => switchMode("signup")} className="text-primary font-medium hover:underline">
                  Create one
                </button>
              </p>
            </>
          )}

          {/* ── SIGN UP ── */}
          {mode === "signup" && (
            <>
              <div className="mb-5">
                <h2 className="font-display font-bold text-xl text-foreground mb-1">Create your account</h2>
                <p className="text-sm text-muted-foreground">Tell us a bit about yourself.</p>
              </div>
              <form onSubmit={handleSignUp} className="space-y-4">

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
                      autoComplete="email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Password <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 rounded-xl h-12"
                      autoComplete="new-password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Confirm Password <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 rounded-xl h-12 ${
                        confirmPassword && password !== confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""
                      }`}
                      autoComplete="new-password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">Passwords don't match</p>
                  )}
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
                  disabled={isLoading || !name.trim() || !phone.trim() || !password}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
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
