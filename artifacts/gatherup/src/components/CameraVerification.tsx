import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, RefreshCw, ShieldCheck, Loader2, X } from "lucide-react";

interface CameraVerificationProps {
  open: boolean;
  onClose: () => void;
  onVerified: (selfieDataUrl: string) => void;
}

type Step = "intro" | "camera" | "preview" | "done";

export function CameraVerification({ open, onClose, onVerified }: CameraVerificationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("intro");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep("camera");
    } catch {
      setCameraError("Camera access denied. Please allow camera access in your browser settings.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    setStep("preview");
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirm = useCallback(() => {
    if (capturedImage) {
      onVerified(capturedImage);
      setStep("done");
    }
  }, [capturedImage, onVerified]);

  const handleClose = useCallback(() => {
    stopCamera();
    setStep("intro");
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  }, [stopCamera, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-xl">Verify Your Identity</DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Take a quick selfie to get a verified badge on your profile.
            </DialogDescription>
          </DialogHeader>

          {step === "intro" && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-foreground">How it works</p>
                <ul className="text-sm text-muted-foreground space-y-1.5 text-left list-none">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">1</span>
                    Allow camera access when prompted
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">2</span>
                    Take a clear selfie of your face
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">3</span>
                    Get your verified badge instantly
                  </li>
                </ul>
              </div>
              {cameraError && (
                <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-xl text-center">
                  {cameraError}
                </p>
              )}
              <Button onClick={startCamera} className="w-full rounded-xl">
                <Camera className="w-4 h-4 mr-2" />
                Open Camera
              </Button>
            </div>
          )}

          {step === "camera" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-6 border-2 border-white/40 rounded-full" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Position your face in the circle and tap capture
              </p>
              <Button onClick={capture} size="lg" className="rounded-full w-16 h-16 p-0">
                <Camera className="w-6 h-6" />
              </Button>
            </div>
          )}

          {step === "preview" && capturedImage && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-muted">
                <img src={capturedImage} alt="Captured selfie" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Looks good? Confirm to get your verified badge.
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={retake} className="flex-1 rounded-xl">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={confirm} className="flex-1 rounded-xl">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-foreground">Verification submitted!</p>
                <p className="text-sm text-muted-foreground mt-1">Your verified badge will appear on your profile.</p>
              </div>
              <Button onClick={handleClose} className="rounded-xl">Done</Button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
