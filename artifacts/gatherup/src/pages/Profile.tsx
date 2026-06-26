import { useParams, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { 
  useGetUser, 
  useGetUserHostedEvents, 
  useGetUserJoinedEvents 
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Award, Users } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const params = useParams();
  const id = parseInt(params.id || "1");
  const [, setLocation] = useLocation();

  const { data: user, isLoading: loadingUser } = useGetUser(id, {
    query: { enabled: !!id }
  });

  const { data: hostedEvents, isLoading: loadingHosted } = useGetUserHostedEvents(id, {
    query: { enabled: !!id }
  });

  const { data: joinedEvents, isLoading: loadingJoined } = useGetUserJoinedEvents(id, {
    query: { enabled: !!id }
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <Button variant="outline" onClick={() => setLocation("/")}>Go back home</Button>
        </div>
      </div>
    );
  }

  const joinCount = user.eventsJoined ?? 0;
  const hostCount = user.eventsHosted ?? 0;

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background/50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        
        {/* Profile Header */}
        <div className="bg-card rounded-3xl p-8 border shadow-sm mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20"></div>
          
          <div className="relative pt-12 flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-32 h-32 border-4 border-card shadow-lg bg-card">
              <AvatarImage src={user.avatarUrl || ""} className="object-cover" />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-display font-bold">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">{user.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                </span>
              </div>
              
              {user.bio && (
                <p className="text-foreground/80 max-w-2xl mb-6">
                  {user.bio}
                </p>
              )}

              <div className="flex items-center justify-center md:justify-start gap-6">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-2xl font-display font-bold text-foreground">{joinCount}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" /> Events Joined
                  </span>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-2xl font-display font-bold text-foreground">{hostCount}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Award className="w-4 h-4" /> Events Hosted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="joined" className="w-full">
          <TabsList className="w-full max-w-md mb-8 grid grid-cols-2 p-1 bg-muted/50 rounded-2xl h-auto">
            <TabsTrigger value="joined" className="rounded-xl py-3 text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Joined ({joinedEvents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="hosted" className="rounded-xl py-3 text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Hosted ({hostedEvents?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="joined" className="mt-0 outline-none">
            {loadingJoined ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : joinedEvents && joinedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {joinedEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed">
                <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No events joined</h3>
                <p className="text-muted-foreground mb-6">You haven't joined any events yet.</p>
                <Button onClick={() => setLocation("/")}>Discover Events</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hosted" className="mt-0 outline-none">
            {loadingHosted ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : hostedEvents && hostedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hostedEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed">
                <Award className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No events hosted</h3>
                <p className="text-muted-foreground mb-6">You haven't hosted any events yet.</p>
                <Button onClick={() => setLocation("/events/new")}>Host an Event</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
