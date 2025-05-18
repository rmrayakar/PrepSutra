import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  study_plan_count: number;
  notes_count: number;
  quiz_count: number;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        // If profile doesn't exist, create a new one
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: user?.id,
              email: user?.email,
              full_name: "",
              avatar_url: "",
              created_at: new Date().toISOString(),
              study_plan_count: 0,
              notes_count: 0,
              quiz_count: 0,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
            throw createError;
          }
          setProfile(newProfile);
          setFormData({
            full_name: newProfile.full_name || "",
            bio: newProfile.bio || "",
          });
        } else {
          console.error("Error fetching profile:", error);
          throw error;
        }
      } else {
        // Fetch the count of files for this user
        const { count: filesCount, error: filesError } = await supabase
          .from("files")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id);

        if (filesError) {
          console.error("Error fetching files count:", filesError);
        }

        // Update the profile with the files count
        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({
            notes_count: filesCount || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user?.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating profile:", updateError);
        }

        setProfile(updatedProfile || profile);
        setFormData({
          full_name: (updatedProfile || profile).full_name || "",
          bio: (updatedProfile || profile).bio || "",
        });
      }
    } catch (error: any) {
      console.error("Error in fetchProfile:", error);
      toast.error("Error fetching profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast.error("Error updating profile: " + error.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: any) {
      toast.error("Error updating password: " + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete avatar from storage if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("avatars")
            .remove([`${user?.id}/${oldPath}`]);
        }
      }

      // Delete user's profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user?.id);

      if (profileError) throw profileError;

      // Delete user's auth account
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user?.id || ""
      );

      if (authError) throw authError;

      await signOut();
      toast.success("Account deleted successfully");
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast.error("Error deleting account: " + error.message);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/${Date.now()}.${fileExt}`;

      // Delete existing avatar if it exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("avatars")
            .remove([`${user?.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      toast.success("Avatar updated successfully");
      await fetchProfile();
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Error uploading avatar");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {user?.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    disabled={uploading}
                    onClick={() => {
                      const input = document.getElementById(
                        "avatar-upload"
                      ) as HTMLInputElement;
                      if (input) {
                        input.click();
                      }
                    }}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Change Avatar"}
                  </Button>
                </div>
              </div>

              {/* Profile Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Profile Information</h3>
                {editing ? (
                  <div className="space-y-4">
                    <Input
                      placeholder="Full Name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                    <Textarea
                      placeholder="Bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                    />
                    <div className="flex space-x-2">
                      <Button onClick={handleUpdateProfile}>Save</Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>
                      <strong>Full Name:</strong> {profile?.full_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {user?.email}
                    </p>
                    <p>
                      <strong>Join Date:</strong>{" "}
                      {format(new Date(profile?.created_at || ""), "PPP")}
                    </p>
                    <p>
                      <strong>Bio:</strong> {profile?.bio || "No bio yet"}
                    </p>
                    <Button onClick={() => setEditing(true)}>
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Your Progress</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-2xl font-bold">
                        {profile?.study_plan_count || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Study Plans
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-2xl font-bold">
                        {profile?.notes_count || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stored Files
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Change Password */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Change Password</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and your new password
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="password"
                        placeholder="Current Password"
                        value={passwordData.current_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            current_password: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="password"
                        placeholder="New Password"
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwordData.confirm_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirm_password: e.target.value,
                          })
                        }
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleUpdatePassword}>
                        Update Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Delete Account */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-red-500">
                  Danger Zone
                </h3>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount}>
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
