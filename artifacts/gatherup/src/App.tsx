import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import EventDetail from "@/pages/EventDetail";
import CreateEvent from "@/pages/CreateEvent";
import Profile from "@/pages/Profile";
import Categories from "@/pages/Categories";
import Login from "@/pages/Login";
import VideoTemplate from "@/components/video/VideoTemplate";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
const queryClient = new QueryClient();


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/categories" component={Categories} />
      <Route path="/events/new" component={CreateEvent} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/video" component={VideoTemplate} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppErrorBoundary>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AppErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}


export default App;
