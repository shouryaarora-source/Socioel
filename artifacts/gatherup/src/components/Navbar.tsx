import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Compass, Grid, User, LogIn, LogOut, Map } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapModal } from "@/components/MapModal";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isLoading, logout } = useAuth();
  const [mapOpen, setMapOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  const profilePath = user ? `/profile/${user.id}` : "/login";

  const navItems = [
    { path: "/", label: "Discover", icon: Compass },
    { path: "/categories", label: "Categories", icon: Grid },
  ];

  return (
    <>
      {/* Top bar — logo + sign in / avatar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
              S
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              Socioel
            </span>
          </Link>

          {!isLoading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Avatar className="w-9 h-9 border-2 border-primary/20 hover:border-primary/60 transition-colors">
                      <AvatarImage src={user.avatarUrl || ""} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-display font-bold text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                    <Link href={profilePath}>
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive rounded-xl"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setLocation("/login")}
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Sign In
              </Button>
            )
          )}
        </div>
      </header>

      {/* Fixed bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg">
        <div className="flex items-center justify-around px-2 py-2 pb-safe max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.path ||
              (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-colors ${
                  isActive
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Profile icon */}
          <Link
            href={profilePath}
            className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-colors ${
              location.startsWith("/profile") || location === "/login"
                ? "text-primary bg-primary/8"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Floating buttons — stacked bottom-right */}
      <div className="fixed bottom-20 right-5 z-50 flex flex-col items-end gap-3">
        {/* Map FAB */}
        <button
          onClick={() => setMapOpen(true)}
          className="w-12 h-12 flex items-center justify-center bg-card border border-border text-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-150"
          aria-label="Open map"
        >
          <Map className="w-5 h-5" />
        </button>

        {/* Create Event FAB */}
        <Link href="/events/new">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground pl-4 pr-5 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 font-semibold text-sm">
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </Link>
      </div>

      {/* Map modal overlay */}
      {mapOpen && <MapModal onClose={() => setMapOpen(false)} />}

      {/* Spacer so content isn't hidden behind the bottom nav */}
      <div className="h-[64px]" />
    </>
  );
}
