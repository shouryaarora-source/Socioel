import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, X, Upload } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import type { User } from "@workspace/api-client-react";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onSave: (data: Partial<User> & { avatarUrl?: string }) => Promise<void>;
}

interface FormValues {
  name: string;
  bio: string;
  profession: string;
  age: string;
  city: string;
  interests: string;
  phone: string;
  website: string;
  instagram: string;
}

export function EditProfileModal({ open, onClose, user, onSave }: EditProfileModalProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
  const [avatarObjectPath, setAvatarObjectPath] = useState<string | null>(user.avatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUpload();

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: user.name || "",
      bio: user.bio || "",
      profession: user.profession || "",
      age: user.age?.toString() || "",
      city: user.city || "",
      interests: user.interests || "",
      phone: user.phone || "",
      website: user.website || "",
      instagram: user.instagram || "",
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    const result = await uploadFile(file);
    if (result) {
      setAvatarObjectPath(result.servingUrl);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      await onSave({
        name: values.name,
        bio: values.bio || undefined,
        avatarUrl: avatarObjectPath || undefined,
        profession: values.profession || undefined,
        age: values.age ? parseInt(values.age) : undefined,
        city: values.city || undefined,
        interests: values.interests || undefined,
        phone: values.phone || undefined,
        website: values.website || undefined,
        instagram: values.instagram || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-xl">Edit Profile</DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3 pb-4 border-b">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-card shadow-md">
                  <AvatarImage src={avatarPreview || ""} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground font-display font-bold">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-full text-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-1.5" />
                    Change Photo
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</Label>
                <Input {...register("name")} placeholder="Your name" className="rounded-xl" />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground mb-1.5 block">Bio</Label>
                <Textarea
                  {...register("bio")}
                  placeholder="Tell the community about yourself..."
                  className="rounded-xl resize-none min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-1.5 block">Profession</Label>
                  <Input {...register("profession")} placeholder="e.g. Teacher, Engineer" className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground mb-1.5 block">Age</Label>
                  <Input {...register("age")} type="number" min="13" max="120" placeholder="Your age" className="rounded-xl" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground mb-1.5 block">City</Label>
                <Input {...register("city")} placeholder="Where are you based?" className="rounded-xl" />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground mb-1.5 block">Interests</Label>
                <Input
                  {...register("interests")}
                  placeholder="e.g. trail running, yoga, cycling"
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
              </div>
            </div>

            {/* Contact */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Contact & Links</p>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Phone</Label>
                <Input {...register("phone")} placeholder="+1 (555) 000-0000" className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Website</Label>
                <Input {...register("website")} placeholder="https://yoursite.com" className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Instagram</Label>
                <Input {...register("instagram")} placeholder="@username" className="rounded-xl" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isUploading} className="flex-1 rounded-xl">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
