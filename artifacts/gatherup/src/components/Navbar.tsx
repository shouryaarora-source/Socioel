import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Compass, Grid, User } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Discover", icon: Compass },
    { path: "/categories", label: "Categories", icon: Grid },
    { path: "/profile/1", label: "Profile", icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
            G
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            GatherUp
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
        </div>

        <div className="flex items-center gap-4">
          <Link href="/events/new">
            <Button className="rounded-full shadow-sm hover-elevate">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
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
      </div>
    </nav>
  );
}
