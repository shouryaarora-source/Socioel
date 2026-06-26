import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { useListEvents, useGetFeaturedEvents, useListCategories } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Compass, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategory(cat);
  }, []);

  const { data: featuredEvents, isLoading: loadingFeatured } = useGetFeaturedEvents();
  const { data: events, isLoading: loadingEvents } = useListEvents({
    search: search || undefined,
    category: selectedCategory,
    upcoming: true
  });
  const { data: categories } = useListCategories();

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4 tracking-tight text-foreground">
              Find your <span className="text-primary">people.</span><br />
              Find your <span className="text-secondary">pace.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover local runs, hikes, and community meetups happening near you.
            </p>
            
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Search events by name or location..." 
                className="pl-10 h-12 rounded-full bg-card shadow-sm border-0 focus-visible:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 pt-2 px-2 -mx-2 hide-scrollbar justify-center">
            <Badge 
              variant={!selectedCategory ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 rounded-full text-sm transition-colors ${!selectedCategory ? 'shadow-md' : 'bg-background hover:bg-muted'}`}
              onClick={() => setSelectedCategory(undefined)}
            >
              All Events
            </Badge>
            {categories?.map((cat) => (
              <Badge 
                key={cat.name}
                variant={selectedCategory === cat.name ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 rounded-full text-sm transition-colors ${selectedCategory === cat.name ? 'shadow-md' : 'bg-background hover:bg-muted'}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        </section>

        {!search && !selectedCategory && featuredEvents && featuredEvents.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-display font-bold">Featured This Week</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.slice(0, 3).map((event, i) => (
                <EventCard key={event.id} event={event} featured={i === 0} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">
              {search ? 'Search Results' : selectedCategory ? `${selectedCategory} Events` : 'Upcoming Events'}
            </h2>
          </div>
          
          {(loadingEvents || loadingFeatured) && (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!loadingEvents && events?.length === 0 && (
            <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We couldn't find any events matching your criteria. Why not start your own?
              </p>
              <Button onClick={() => window.location.href = '/events/new'}>
                Create an Event
              </Button>
            </div>
          )}

          {!loadingEvents && events && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
