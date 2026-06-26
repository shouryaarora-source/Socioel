import { Link, useLocation } from "wouter";
import { Plus, Compass, Grid, User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isLoading, logout } = useAuth();

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
      {/* Top bar — logo only */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
              S
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              Socioel
            </span>
          </Link>
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

          {/* Profile / Sign In */}
          {!isLoading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-colors text-muted-foreground hover:text-foreground focus:outline-none">
                    <Avatar className="w-5 h-5 border border-primary/30">
                      <AvatarImage src={user.avatarUrl || ""} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-[10px]">
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-medium">Profile</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-48 rounded-2xl mb-2">
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
              <button
                onClick={() => setLocation("/login")}
                className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-colors text-muted-foreground hover:text-foreground"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-[11px] font-medium">Sign In</span>
              </button>
            )
          )}
        </div>
      </nav>

      {/* Floating Action Button — Create Event */}
      <Link href="/events/new">
        <button className="fixed bottom-20 right-5 z-50 flex items-center gap-2 bg-primary text-primary-foreground pl-4 pr-5 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 font-semibold text-sm">
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </Link>

      {/* Spacer so content isn't hidden behind the bottom nav */}
      <div className="h-[64px]" />
    </>
  );
}
