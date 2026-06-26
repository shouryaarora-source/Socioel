import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetEvent,
  useGetEventAttendees,
  useJoinEvent,
  useLeaveEvent,
  useDeleteEvent,
  useGetEventComments,
  useCreateComment,
  useDeleteComment,
  useGetEventJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
  getGetEventQueryKey,
  getGetEventAttendeesQueryKey,
  getListEventsQueryKey,
  getGetEventCommentsQueryKey,
  getGetEventJoinRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Loader2,
  Trash2,
  MessageSquare,
  Send,
  Lock,
  Globe,
  CheckCircle,
  XCircle,
  ClipboardList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EventDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [commentBody, setCommentBody] = useState("");
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? null;

  const { data: event, isLoading: loadingEvent } = useGetEvent(id, {
    query: { queryKey: getGetEventQueryKey(id), enabled: !!id },
  });

  const { data: attendees, isLoading: loadingAttendees } = useGetEventAttendees(id, {
    query: { queryKey: getGetEventAttendeesQueryKey(id), enabled: !!id },
  });

  const { data: comments, isLoading: loadingComments } = useGetEventComments(id, {
    query: { queryKey: getGetEventCommentsQueryKey(id), enabled: !!id },
  });

  const { data: joinRequests, isLoading: loadingRequests } = useGetEventJoinRequests(id, {
    query: { queryKey: getGetEventJoinRequestsQueryKey(id), enabled: !!id },
  });

  const joinEvent = useJoinEvent({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetEventAttendeesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetEventJoinRequestsQueryKey(id) });
        if (data.status === "pending") {
          toast({ title: "Request sent!", description: "The organizer will review your request." });
        } else {
          toast({ title: "You're in!", description: "Successfully joined the event." });
        }
      },
      onError: () => {
        toast({ title: "Already requested", description: "You've already submitted a request for this event.", variant: "destructive" });
      },
    },
  });

  const leaveEvent = useLeaveEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetEventAttendeesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetEventJoinRequestsQueryKey(id) });
        toast({ title: "Left event", description: "You are no longer attending this event." });
      },
    },
  });

  const deleteEvent = useDeleteEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        toast({ title: "Event deleted", description: "Your event has been successfully cancelled." });
        setLocation("/");
      },
    },
  });

  const createComment = useCreateComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEventCommentsQueryKey(id) });
        setCommentBody("");
      },
      onError: () => {
        toast({ title: "Error", description: "Could not post comment. Try again.", variant: "destructive" });
      },
    },
  });

  const deleteComment = useDeleteComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEventCommentsQueryKey(id) });
      },
    },
  });

  const approveRequest = useApproveJoinRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEventJoinRequestsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetEventAttendeesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(id) });
        toast({ title: "Request approved" });
      },
    },
  });

  const rejectRequest = useRejectJoinRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEventJoinRequestsQueryKey(id) });
        toast({ title: "Request declined" });
      },
    },
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

  const isAttending = currentUserId ? (attendees?.some((a) => a.id === currentUserId) || false) : false;
  const isHost = currentUserId ? event.hostId === currentUserId : false;
  const isFull = event.attendeeCount >= event.maxAttendees;
  const isApprovalRequired = event.joinMode === "approval_required";
  const myRequest = currentUserId ? joinRequests?.find((r) => r.userId === currentUserId) : null;
  const hasPendingRequest = myRequest?.status === "pending";

  const handleJoinLeave = () => {
    if (!currentUserId) {
      setLocation("/login");
      return;
    }
    if (isAttending || hasPendingRequest) {
      leaveEvent.mutate({ id, data: { userId: currentUserId } });
    } else {
      joinEvent.mutate({ id, data: { userId: currentUserId } });
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to cancel and delete this event? This action cannot be undone.")) {
      deleteEvent.mutate({ id });
    }
  };

  const handlePostComment = () => {
    if (!commentBody.trim() || !currentUserId) return;
    createComment.mutate({ id, data: { userId: currentUserId, body: commentBody.trim() } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handlePostComment();
    }
  };

  const image = event.imageUrl || `/images/${event.category.toLowerCase()}.png`;

  let joinLabel: string;
  let joinVariant: "default" | "secondary" | "outline" = "default";
  let joinDisabled = false;

  if (!currentUserId) {
    joinLabel = "Sign in to Join";
  } else if (isAttending) {
    joinLabel = "You're Attending ✓";
    joinVariant = "secondary";
  } else if (hasPendingRequest) {
    joinLabel = "Request Pending…";
    joinVariant = "outline";
  } else if (isFull) {
    joinLabel = "Event Full";
    joinDisabled = true;
  } else if (isApprovalRequired) {
    joinLabel = "Request to Join";
  } else {
    joinLabel = "Join Event";
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {isHost && (
            <Button variant="destructive" size="sm" className="rounded-full" onClick={handleDelete} disabled={deleteEvent.isPending}>
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
              onError={(e) => { (e.target as HTMLImageElement).src = "/images/social.png"; }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-background/90 text-foreground backdrop-blur-md border-0 px-3 py-1 text-sm font-semibold">
                {event.category}
              </Badge>
              {isApprovalRequired ? (
                <Badge className="bg-background/90 text-foreground backdrop-blur-md border-0 px-3 py-1 text-sm font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Approval Required
                </Badge>
              ) : (
                <Badge className="bg-background/90 text-foreground backdrop-blur-md border-0 px-3 py-1 text-sm font-semibold flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Open
                </Badge>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 text-foreground">{event.title}</h1>
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
                    {event.distanceKm != null && (
                      <span className="ml-1 text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {event.distanceKm < 1 ? `${Math.round(event.distanceKm * 1000)} m away` : `${event.distanceKm.toFixed(1)} km away`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto bg-muted/50 p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Spots left</p>
                    <p className="text-2xl font-bold font-display text-foreground">
                      {event.maxAttendees - event.attendeeCount}{" "}
                      <span className="text-base text-muted-foreground font-normal">/ {event.maxAttendees}</span>
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary opacity-20" />
                </div>

                {isHost ? (
                  <Button className="w-full" variant="outline" disabled>You are hosting</Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className={`w-full rounded-xl text-base transition-all ${
                        isAttending || hasPendingRequest ? "" : isFull ? "" : "hover-elevate shadow-md"
                      }`}
                      variant={joinVariant}
                      disabled={joinDisabled || joinEvent.isPending || leaveEvent.isPending}
                      onClick={handleJoinLeave}
                    >
                      {joinEvent.isPending || leaveEvent.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : joinLabel}
                    </Button>
                    {hasPendingRequest && (
                      <p className="text-xs text-center text-muted-foreground -mt-1">
                        Waiting for the organizer's approval
                      </p>
                    )}
                    {(isAttending || hasPendingRequest) && (
                      <button
                        onClick={handleJoinLeave}
                        disabled={leaveEvent.isPending}
                        className="text-xs text-center text-muted-foreground hover:text-destructive transition-colors"
                      >
                        {hasPendingRequest ? "Cancel request" : "Leave event"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Organizer requests panel */}
            {isHost && isApprovalRequired && (
              <>
                <Separator className="my-6" />
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-display font-bold">Join Requests</h3>
                    {joinRequests && joinRequests.length > 0 && (
                      <Badge variant="secondary" className="rounded-full bg-primary text-primary-foreground">{joinRequests.length}</Badge>
                    )}
                  </div>
                  {loadingRequests ? (
                    <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : joinRequests && joinRequests.length > 0 ? (
                    <div className="space-y-3">
                      {joinRequests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-2xl border">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                              <AvatarImage src={req.userAvatar || ""} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                                {req.userName?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{req.userName || "Unknown"}</p>
                              {req.userPhone && <p className="text-xs text-muted-foreground">{req.userPhone}</p>}
                              <p className="text-xs text-muted-foreground">
                                Requested {formatDistanceToNow(new Date(req.joinedAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => rejectRequest.mutate({ id, userId: req.userId })}
                              disabled={rejectRequest.isPending || approveRequest.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Decline
                            </button>
                            <button
                              onClick={() => approveRequest.mutate({ id, userId: req.userId })}
                              disabled={approveRequest.isPending || rejectRequest.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/20 rounded-2xl border border-dashed">
                      <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No pending requests</p>
                    </div>
                  )}
                </section>
              </>
            )}

            <Separator className="my-8" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h3 className="text-xl font-display font-bold mb-4">About this event</h3>
                  <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-display font-bold">Discussion</h3>
                    {comments && <Badge variant="secondary" className="rounded-full">{comments.length}</Badge>}
                  </div>

                  {currentUserId ? (
                    <div className="flex gap-3 mb-6">
                      <Avatar className="w-9 h-9 shrink-0 mt-1">
                        <AvatarImage src={currentUser?.avatarUrl || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {currentUser?.name?.charAt(0) || "Y"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Share logistics, ask a question, or just say hi..."
                          value={commentBody}
                          onChange={(e) => setCommentBody(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="resize-none min-h-[80px] rounded-2xl border-muted bg-muted/30 focus:bg-background transition-colors text-sm"
                          disabled={createComment.isPending}
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">Cmd+Enter to post</p>
                          <Button size="sm" className="rounded-full px-4" onClick={handlePostComment} disabled={!commentBody.trim() || createComment.isPending}>
                            {createComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-1.5" />Post</>}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-muted/30 rounded-2xl text-center text-sm text-muted-foreground border border-dashed">
                      <button onClick={() => setLocation("/login")} className="text-primary font-medium hover:underline">Sign in</button> to join the discussion
                    </div>
                  )}

                  {loadingComments ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : comments && comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <Avatar className="w-9 h-9 shrink-0 mt-0.5">
                            <AvatarImage src={comment.userAvatar || ""} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                              {comment.userName?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-muted/40 rounded-2xl rounded-tl-sm px-4 py-3 border border-border/50">
                              <div className="flex items-baseline justify-between gap-2 mb-1">
                                <span className="text-sm font-semibold text-foreground">{comment.userName || "Community Member"}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
                            </div>
                            {currentUserId && comment.userId === currentUserId && (
                              <button
                                onClick={() => deleteComment.mutate({ id, commentId: comment.id })}
                                className="mt-1 ml-2 text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed">
                      <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium text-sm">No messages yet</p>
                      <p className="text-muted-foreground/60 text-xs mt-1">Be the first to start the conversation</p>
                    </div>
                  )}
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
                    <Badge variant="secondary" className="rounded-full">{event.attendeeCount}</Badge>
                  </div>
                  {loadingAttendees ? (
                    <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : attendees && attendees.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {attendees.map((user) => (
                        <Avatar key={user.id} className="w-10 h-10 border-2 border-background shadow-sm cursor-pointer hover:-translate-y-1 transition-transform" title={user.name}>
                          <AvatarImage src={user.avatarUrl || ""} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">{user.name?.charAt(0) || "U"}</AvatarFallback>
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
