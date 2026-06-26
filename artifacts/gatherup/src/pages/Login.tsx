import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Phone, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = "phone" | "otp";

export default function Login() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to send code", variant: "destructive" });
        return;
      }
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setStep("otp");
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: phone.trim(), code: otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Invalid code", description: data.error || "Please check the code and try again.", variant: "destructive" });
        setOtp("");
        return;
      }
      login(data.user);
      toast({ title: "Welcome!", description: "You're now logged in." });
      setLocation("/");
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  function handleOtpChange(val: string) {
    if (/^\d{0,6}$/.test(val)) setOtp(val);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-3xl mb-4 shadow-lg">
            S
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">Socioel</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover your community</p>
        </div>

        <div className="bg-card rounded-3xl border shadow-sm p-6">
          {step === "phone" ? (
            <>
              <div className="mb-6">
                <h2 className="font-display font-bold text-xl text-foreground mb-1">Sign in</h2>
                <p className="text-sm text-muted-foreground">Enter your phone number and we'll send you a code.</p>
              </div>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Phone number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 rounded-xl"
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl"
                  disabled={isLoading || !phone.trim()}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Code
                </Button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("phone"); setOtp(""); setDevCode(null); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 -ml-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="mb-6">
                <h2 className="font-display font-bold text-xl text-foreground mb-1">Enter code</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{phone}</span>
                </p>
              </div>

              {devCode && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium mb-1">Dev mode — your code:</p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-amber-800">{devCode}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Verification code</label>
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
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 mr-2" />
                  )}
                  Verify & Sign In
                </Button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 py-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend code
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
