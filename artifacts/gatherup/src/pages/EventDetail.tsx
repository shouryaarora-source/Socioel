import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { 
  useGetEvent, 
  useGetEventAttendees, 
  useJoinEvent, 
  useLeaveEvent,
  useDeleteEvent,
  getGetEventQueryKey,
  getGetEventAttendeesQueryKey,
  getListEventsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Users, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CURRENT_USER_ID = 1; // Hardcoded for simplicity

export default function EventDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event, isLoading: loadingEvent } = useGetEvent(id, {
    query: { enabled: !!id }
  });
  
  const { data: attendees, isLoading: loadingAttendees } = useGetEventAttendees(id, {
    query: { enabled: !!id }
  });

  const joinEvent = useJoinEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetEventAttendeesQueryKey(id) });
        toast({
          title: "You're in!",
          description: "Successfully joined the event.",
        });
      }
    }
  });

  const leaveEvent = useLeaveEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetEventAttendeesQueryKey(id) });
        toast({
          title: "Left event",
          description: "You are no longer attending this event.",
        });
      }
    }
  });

  const deleteEvent = useDeleteEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        toast({
          title: "Event deleted",
          description: "Your event has been successfully cancelled.",
        });
        setLocation("/");
      }
    }
  });

  if (loadingEvent) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-2xl font-bold mb-2">Event not found</h1>
          <Button variant="outline" onClick={() => setLocation("/")}>Go back home</Button>
        </div>
      </div>
    );
  }

  const isAttending = attendees?.some(a => a.id === CURRENT_USER_ID) || false;
  const isHost = event.hostId === CURRENT_USER_ID;
  const isFull = event.attendeeCount >= event.maxAttendees;

  const handleJoinLeave = () => {
    if (isAttending) {
      leaveEvent.mutate({ id, data: { userId: CURRENT_USER_ID } });
    } else {
      joinEvent.mutate({ id, data: { userId: CURRENT_USER_ID } });
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to cancel and delete this event? This action cannot be undone.")) {
      deleteEvent.mutate({ id });
    }
  };

  const image = event.imageUrl || `/images/${event.category.toLowerCase()}.png`;

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {isHost && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="rounded-full"
              onClick={handleDelete}
              disabled={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Cancel Event
            </Button>
          )}
        </div>

        <div className="bg-card rounded-3xl overflow-hidden shadow-sm border mb-8">
          <div className="h-64 md:h-96 relative">
            <img 
              src={image} 
              alt={event.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/social.png";
              }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-background/90 text-foreground backdrop-blur-md border-0 px-3 py-1 text-sm font-semibold">
                {event.category}
              </Badge>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 text-foreground">
                  {event.title}
                </h1>
                
                <div className="flex flex-wrap gap-4 text-muted-foreground font-medium">
                  <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-xl">
                    <Clock className="w-5 h-5 text-accent" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-xl">
                    <MapPin className="w-5 h-5 text-secondary" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto bg-muted/50 p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Spots left</p>
                    <p className="text-2xl font-bold font-display text-foreground">
                      {event.maxAttendees - event.attendeeCount} <span className="text-base text-muted-foreground font-normal">/ {event.maxAttendees}</span>
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary opacity-20" />
                </div>
                
                {isHost ? (
                  <Button className="w-full" variant="outline" disabled>
                    You are hosting
                  </Button>
                ) : (
                  <Button 
                    size="lg"
                    className={`w-full rounded-xl text-base transition-all ${
                      isAttending 
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover-elevate" 
                        : isFull 
                          ? "" 
                          : "hover-elevate shadow-md"
                    }`}
                    variant={isAttending ? "default" : isFull ? "secondary" : "default"}
                    disabled={(!isAttending && isFull) || joinEvent.isPending || leaveEvent.isPending}
                    onClick={handleJoinLeave}
                  >
                    {joinEvent.isPending || leaveEvent.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isAttending ? (
                      "You're Attending"
                    ) : isFull ? (
                      "Event Full"
                    ) : (
                      "Join Event"
                    )}
                  </Button>
                )}
              </div>
            </div>

            <Separator className="my-8" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h3 className="text-xl font-display font-bold mb-4">About this event</h3>
                  <div className="prose prose-slate dark:prose-invert">
                    <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-display font-bold mb-4">Hosted by</h3>
                  <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border">
                    <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                      <AvatarImage src={event.hostAvatar || ""} />
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                        {event.hostName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground">{event.hostName || "Community Member"}</p>
                      <p className="text-sm text-muted-foreground">Event Organizer</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-display font-bold">Attendees</h3>
                    <Badge variant="secondary" className="rounded-full">
                      {event.attendeeCount}
                    </Badge>
                  </div>
                  
                  {loadingAttendees ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : attendees && attendees.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {attendees.map(user => (
                        <Avatar key={user.id} className="w-10 h-10 border-2 border-background shadow-sm cursor-pointer hover:-translate-y-1 transition-transform" title={user.name}>
                          <AvatarImage src={user.avatarUrl || ""} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm bg-muted/30 p-4 rounded-xl text-center border border-dashed">
                      No one has joined yet. Be the first!
                    </p>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
