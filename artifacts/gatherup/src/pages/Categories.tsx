import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useListCategories, useGetEventStats } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, Search } from "lucide-react";

const CATEGORY_STYLES: Record<string, { bg: string, text: string }> = {
  running: { bg: "bg-primary", text: "text-primary-foreground" },
  hiking: { bg: "bg-secondary", text: "text-secondary-foreground" },
  cycling: { bg: "bg-accent", text: "text-accent-foreground" },
  sports: { bg: "bg-blue-500", text: "text-white" },
  yoga: { bg: "bg-purple-500", text: "text-white" },
  social: { bg: "bg-pink-500", text: "text-white" },
};

export default function Categories() {
  const [, setLocation] = useLocation();
  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const { data: stats, isLoading: loadingStats } = useGetEventStats();
  const [search, setSearch] = useState("");

  if (loadingCategories || loadingStats) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const handleCategoryClick = (name: string) => {
    // Navigating back to home but there's no native way to pass state to the Home component
    // unless we use URL params. We can change Home to read from a query parameter.
    // For now, let's just go home, but ideally Home should support ?category=Running
    setLocation(`/?category=${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background/50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-extrabold text-foreground tracking-tight mb-4">
            Explore Categories
          </h1>
          <p className="text-lg text-muted-foreground">
            Find the perfect activity and join your community.
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
            <div className="bg-card border rounded-3xl p-6 text-center shadow-sm">
              <div className="text-4xl font-display font-bold text-primary mb-1">
                {stats.totalEvents}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Events
              </div>
            </div>
            <div className="bg-card border rounded-3xl p-6 text-center shadow-sm">
              <div className="text-4xl font-display font-bold text-secondary mb-1">
                {stats.totalAttendees}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Total Attendees
              </div>
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search categories..."
              className="pl-10 h-12 rounded-full bg-card shadow-sm border-0 focus-visible:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.filter((cat) => cat.name.toLowerCase().includes(search.toLowerCase())).map((cat) => {
            const style = CATEGORY_STYLES[cat.name.toLowerCase()] || { bg: "bg-muted", text: "text-foreground" };
            
            return (
              <Card 
                key={cat.name}
                className="group cursor-pointer border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden"
                onClick={() => handleCategoryClick(cat.name)}
              >
                <div className={`h-32 ${style.bg} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>
                  <h2 className={`text-3xl font-display font-bold ${style.text} relative z-10`}>
                    {cat.name}
                  </h2>
                </div>
                <div className="p-6 bg-card flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold">{cat.eventCount}</span>
                    <span className="text-muted-foreground ml-2 text-sm">active events</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
