import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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

  const navItems = [
    { path: "/", label: "Discover", icon: Compass },
    { path: "/categories", label: "Categories", icon: Grid },
  ];

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
            S
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Socioel
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          {user && (
            <Link
              href={`/profile/${user.id}`}
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                location.startsWith("/profile") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && (
            user ? (
              <>
                <Link href="/events/new">
                  <Button className="rounded-full shadow-sm hover-elevate hidden md:flex">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
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
                      <Link href={`/profile/${user.id}`}>
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
              </>
            ) : (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setLocation("/login")}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex items-center justify-around p-3 pb-safe z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        {user ? (
          <Link
            href={`/profile/${user.id}`}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              location.startsWith("/profile") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        ) : (
          <button
            onClick={() => setLocation("/login")}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors text-muted-foreground"
          >
            <LogIn className="w-5 h-5" />
            <span className="text-[10px] font-medium">Sign In</span>
          </button>
        )}
        <Link
          href="/events/new"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            location === "/events/new" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-medium">Create</span>
        </Link>
      </div>
    </nav>
  );
}
