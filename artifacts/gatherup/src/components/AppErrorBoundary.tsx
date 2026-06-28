import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Something went wrong while loading the app.",
    };
  }

  componentDidCatch(error: Error) {
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="w-full max-w-md rounded-3xl border bg-card p-6 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              The app hit a snag
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.message}
            </p>
            <Button
              className="mt-5 rounded-full"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
