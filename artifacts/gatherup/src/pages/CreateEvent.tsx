import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Navbar } from "@/components/Navbar";
import { useCreateEvent, getListEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Compass, Type, AlignLeft, Image as ImageIcon } from "lucide-react";

const CURRENT_USER_ID = 1;

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  category: z.string().min(1, "Please select a category"),
  location: z.string().min(5, "Location must be at least 5 characters"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Please enter a valid time (HH:MM)"),
  maxAttendees: z.coerce.number().min(2, "Must allow at least 2 attendees").max(1000),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const CATEGORIES = [
  "Running",
  "Hiking",
  "Cycling",
  "Sports",
  "Yoga",
  "Fitness",
  "Social",
];

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      location: "",
      date: new Date().toISOString().split('T')[0],
      time: "10:00",
      maxAttendees: 10,
      imageUrl: "",
    },
  });

  const createEvent = useCreateEvent({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        toast({
          title: "Event created!",
          description: "Your community event is now live.",
        });
        setLocation(`/events/${data.id}`);
      },
      onError: () => {
        toast({
          title: "Uh oh",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createEvent.mutate({
      data: {
        ...values,
        hostId: CURRENT_USER_ID,
      }
    });
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background/50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-extrabold text-foreground tracking-tight mb-3">
            Host an Event
          </h1>
          <p className="text-lg text-muted-foreground">
            Bring people together. Create your community gathering.
          </p>
        </div>

        <Card className="p-6 md:p-8 rounded-3xl border shadow-sm bg-card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Type className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-display font-bold">The Basics</h2>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Morning 5k Run at Golden Gate Park" className="h-12 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What will you be doing? What should people bring?" 
                          className="min-h-[120px] rounded-xl resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-display font-bold">When & Where</h2>
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="Park entrance, Cafe, etc." className="h-12 rounded-xl pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="date" className="h-12 rounded-xl pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="time" className="h-12 rounded-xl pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-display font-bold">Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="maxAttendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Attendees</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="number" min="2" max="1000" className="h-12 rounded-xl pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>Limit the group size if needed</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="https://..." className="h-12 rounded-xl pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 rounded-xl text-lg font-medium hover-elevate shadow-md"
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
