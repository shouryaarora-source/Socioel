import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { CameraVerification } from "@/components/CameraVerification";
import { EditProfileModal } from "@/components/EditProfileModal";
import {
  useGetUser,
  useGetUserHostedEvents,
  useGetUserJoinedEvents,
  useUpdateUser,
  useVerifyUser,
  getGetUserQueryKey,
  getGetUserHostedEventsQueryKey,
  getGetUserJoinedEventsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Loader2,
  Award,
  Users,
  ShieldCheck,
  Pencil,
  MapPin,
  Briefcase,
  Globe,
  Instagram,
  Phone,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";

const CURRENT_USER_ID = 1;

export default function Profile() {
  const params = useParams();
  const id = parseInt(params.id || "1");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCamera, setShowCamera] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { uploadDataUrl } = useUpload();

  const { data: user, isLoading: loadingUser } = useGetUser(id, {
    query: { queryKey: getGetUserQueryKey(id), enabled: !!id },
  });

  const { data: hostedEvents, isLoading: loadingHosted } = useGetUserHostedEvents(id, {
    query: { queryKey: getGetUserHostedEventsQueryKey(id), enabled: !!id },
  });

  const { data: joinedEvents, isLoading: loadingJoined } = useGetUserJoinedEvents(id, {
    query: { queryKey: getGetUserJoinedEventsQueryKey(id), enabled: !!id },
  });

  const updateUser = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(id) });
        toast({ title: "Profile updated", description: "Your changes have been saved." });
      },
    },
  });

  const verifyUser = useVerifyUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(id) });
        toast({ title: "Verified!", description: "Your profile now has a verified badge." });
      },
    },
  });

  const handleSaveProfile = async (data: Record<string, unknown>) => {
    await updateUser.mutateAsync({ id, data: data as Parameters<typeof updateUser.mutate>[0]["data"] });
  };

  const handleVerified = async (selfieDataUrl: string) => {
    const result = await uploadDataUrl(selfieDataUrl, "verification-selfie.jpg");
    if (result) {
      verifyUser.mutate({ id, data: { selfieObjectPath: result.servingUrl } });
    } else {
      verifyUser.mutate({ id, data: { selfieObjectPath: "selfie-verified" } });
    }
  };

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
          <Button variant="outline" onClick={() => setLocation("/")}>
            Go back home
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = id === CURRENT_USER_ID;
  const joinCount = user.eventsJoined ?? 0;
  const hostCount = user.eventsHosted ?? 0;
  const interestList = user.interests
    ? user.interests.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background/50">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-5xl">

        {/* Profile Header Card */}
        <div className="bg-card rounded-3xl border shadow-sm mb-10 relative overflow-hidden">
          {/* Banner */}
          <div className="h-36 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30" />

          <div className="px-6 md:px-8 pb-8">
            {/* Avatar row */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 mb-6">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <Avatar className="w-28 h-28 border-4 border-card shadow-lg">
                    <AvatarImage src={user.avatarUrl || ""} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-display font-bold">
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user.verified && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card flex items-center justify-center shadow">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-display font-bold text-foreground">{user.name}</h1>
                    {user.verified && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full text-xs font-semibold px-2 py-0.5">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {user.profession && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {user.profession}
                      {user.age && <span className="text-muted-foreground/60"> · {user.age} yrs</span>}
                    </p>
                  )}
                  {user.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {user.city}
                    </p>
                  )}
                </div>
              </div>

              {isOwnProfile && (
                <div className="flex gap-2 self-end md:self-auto">
                  {!user.verified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCamera(true)}
                      className="rounded-full text-xs"
                    >
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      Get Verified
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEdit(true)}
                    className="rounded-full text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-foreground/80 max-w-2xl text-sm leading-relaxed mb-6">{user.bio}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-8 mb-6">
              <div className="text-center md:text-left">
                <span className="text-2xl font-display font-bold text-foreground block">{joinCount}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Events Joined
                </span>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center md:text-left">
                <span className="text-2xl font-display font-bold text-foreground block">{hostCount}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Events Hosted
                </span>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center md:text-left">
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {format(new Date(user.createdAt), "MMM yyyy")}
                </span>
              </div>
            </div>

            {/* Interests */}
            {interestList.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {interestList.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="rounded-full text-xs px-3 py-1 capitalize"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            )}

            {/* Contact links */}
            {(user.website || user.instagram || user.phone) && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-4">
                {user.website && (
                  <a
                    href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {user.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {user.instagram && (
                  <span className="flex items-center gap-1.5">
                    <Instagram className="w-4 h-4" />
                    {user.instagram}
                  </span>
                )}
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="joined" className="w-full">
          <TabsList className="w-full max-w-md mb-8 grid grid-cols-2 p-1 bg-muted/50 rounded-2xl h-auto">
            <TabsTrigger
              value="joined"
              className="rounded-xl py-3 text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Joined ({joinedEvents?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="hosted"
              className="rounded-xl py-3 text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
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
                {joinedEvents.map((event) => (
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
                {hostedEvents.map((event) => (
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

      {/* Camera Verification Dialog */}
      <CameraVerification
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onVerified={handleVerified}
      />

      {/* Edit Profile Dialog */}
      {user && (
        <EditProfileModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          user={user}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
