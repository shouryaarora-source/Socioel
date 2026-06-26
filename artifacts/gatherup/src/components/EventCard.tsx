import { Link } from "wouter";
import { format } from "date-fns";
import { MapPin, Users, Calendar, Clock } from "lucide-react";
import { Event } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DEFAULT_IMAGES: Record<string, string> = {
  running: "/images/running.png",
  hiking: "/images/hiking.png",
  cycling: "/images/cycling.png",
  sports: "/images/sports.png",
  yoga: "/images/yoga.png",
  social: "/images/social.png",
  fitness: "/images/sports.png"
};

export function EventCard({ event, featured = false }: { event: Event; featured?: boolean }) {
  const categoryImage = DEFAULT_IMAGES[event.category.toLowerCase()] || DEFAULT_IMAGES.social;
  const image = event.imageUrl || categoryImage;

  return (
    <Link href={`/events/${event.id}`}>
      <Card className={`group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 bg-card/50 backdrop-blur-sm ${featured ? 'md:col-span-2' : ''}`}>
        <div className={`relative ${featured ? 'h-64' : 'h-48'} overflow-hidden`}>
          <img 
            src={image} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge className="bg-background/90 text-foreground backdrop-blur-md hover:bg-background border-0 shadow-sm font-semibold">
              {event.category}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className={`font-display font-bold ${featured ? 'text-3xl' : 'text-xl'} mb-1 line-clamp-1`}>
              {event.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-white/90">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(event.date), "MMM d")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{event.time}</span>
              </div>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6 border-2 border-background">
                <AvatarImage src={event.hostAvatar || ""} />
                <AvatarFallback className="text-[10px]">{event.hostName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-muted-foreground truncate max-w-[120px]">
                {event.hostName || "Community Member"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary/70" />
                <span className="truncate max-w-[100px]">{event.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-secondary/70" />
                <span>{event.attendeeCount}/{event.maxAttendees}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
