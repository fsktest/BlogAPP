"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  User,
  FileEdit,
  Grid,
  List,
  Settings,
  BookOpen,
  PenSquare,
  Calendar,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
} from "lucide-react";

// API base URL
const API_BASE_URL = "https://blogapp-62q1.onrender.com";

type Post = {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
};

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  bio: z.string().optional(),
  role: z.enum(["User", "Admin"]),
});

const passwordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(6, { message: "Current password must be at least 6 characters." }),
    newPassword: z
      .string()
      .min(6, { message: "New password must be at least 6 characters." }),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, token, logout, setUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [bookmarkPosts, setBookmarkPosts] = useState<Post[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);

  // Profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: "",
      role: (user?.role as "User" | "Admin") || "User",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      // Initialize form with user data when available
      form.reset({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        role: (user.role as "User" | "Admin") || "User",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Fetch user's posts
      fetchUserPosts();
      fetchBookmarks();
    }
  }, [user, router, form]);

  const fetchUserPosts = async () => {
    if (!token || !user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/getmypost/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserPosts(data.posts || []);
      } else {
        console.error("Failed to fetch user posts");
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    // /bookmarked-posts/:userId
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookmarked-posts/${user.id}`,
        {
          headers: {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched bookmarked posts:", data);
        setBookmarkPosts(data.posts || []);
      } else {
        console.error("Failed to fetch bookmarked posts");
      }
    } catch (error) {
      console.error("Error fetching bookmarked posts:", error);
    } finally {
      setBookmarksLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (values: PasswordFormValues) => {
    if (!user || !token) return;
    setPasswordLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: user.id,
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your password has been updated successfully.",
          variant: "success",
        });

        // Reset form and close dialog
        passwordForm.reset();
        setIsChangePasswordOpen(false);
      } else {
        toast({
          title: "Password change failed",
          description: data.message || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle profile update (remove password logic)
  const handleSubmit = async (values: ProfileFormValues) => {
    if (!user || !token) return;
    setLoading(true);

    try {
      // Prepare the update data
      const updateData = {
        name: values.name,
        email: values.email,
        bio: values.bio,
      };

      const response = await fetch(`${API_BASE_URL}/update-user/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (response.ok) {
          // Update the user in context - fixed implementation
          if (user) {
            setUser({
              ...user,
              name: values.name,
              email: values.email,
              bio: values.bio || "",
            });
          }

          toast({
            title: "Profile updated",
            description: "Your profile has been updated successfully.",
            variant: "success",
          });

          setIsEditProfileOpen(false);
        } else {
          toast({
            title: "Update failed",
            description: data.message || "Failed to update profile",
            variant: "destructive",
          });
        }
      } else {
        // Handle non-JSON response
        const text = await response.text();
        console.error("Non-JSON response:", text);
        toast({
          title: "Update failed",
          description: `Server error (${response.status}): The server endpoint may not exist`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Profile Header - Instagram Style */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-10">
        <Avatar className="w-24 h-24 md:w-32 md:h-32 border-2 border-primary/20">
          <AvatarImage src="" alt={user.name} />
          <AvatarFallback className="text-xl md:text-3xl font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold">{user.name}</h1>

            <Dialog
              open={isEditProfileOpen}
              onOpenChange={setIsEditProfileOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="h-8 text-sm">
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile information here.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Write a short bio about yourself"
                              className="resize-none"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Add a button to open password change dialog */}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Password</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsChangePasswordOpen(true);
                            setIsEditProfileOpen(false);
                          }}
                        >
                          Change Password
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditProfileOpen(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Separate dialog for password change */}
            <Dialog
              open={isChangePasswordOpen}
              onOpenChange={setIsChangePasswordOpen}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Update your password to keep your account secure.
                  </DialogDescription>
                </DialogHeader>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="oldPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChangePasswordOpen(false);
                          setIsEditProfileOpen(true);
                        }}
                        disabled={passwordLoading}
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={passwordLoading}>
                        {passwordLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Badge variant="outline" className="ml-0 md:ml-2 h-6 px-2">
              {user.role}
            </Badge>
          </div>

          {/* Profile Stats - Instagram Style */}
          <div className="flex space-x-6 mb-4">
            <div className="text-center">
              <span className="font-semibold">{userPosts.length}</span>
              <p className="text-sm text-muted-foreground">posts</p>
            </div>
            <div className="text-center">
              <span className="font-semibold">0</span>
              <p className="text-sm text-muted-foreground">followers</p>
            </div>
            <div className="text-center">
              <span className="font-semibold">0</span>
              <p className="text-sm text-muted-foreground">following</p>
            </div>
          </div>

          {/* Bio */}
          <div className="text-sm">
            <p className="font-semibold">{user.email}</p>
            <p className="mt-1">{user.bio || "No bio yet."}</p>
          </div>
        </div>
      </div>

      {/* Content Tabs - Instagram Style */}
      <Tabs defaultValue="posts" className="w-full">
        <div className="border-t">
          <TabsList className="grid grid-cols-3 bg-transparent h-14">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:rounded-none h-full"
            >
              <Grid size={16} className="mr-2" /> POSTS
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:rounded-none h-full"
            >
              <Bookmark size={16} className="mr-2" /> SAVED
            </TabsTrigger>
            <TabsTrigger
              value="tagged"
              className="data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:rounded-none h-full"
            >
              <User size={16} className="mr-2" /> TAGGED
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Posts Tab Content */}
        <TabsContent value="posts" className="mt-6">
          {/* Toggle View - Grid or List */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
              >
                <Grid size={16} />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                <List size={16} />
              </Button>
            </div>
            <Button size="sm" asChild>
              <Link href="/create-post" className="flex items-center gap-1">
                <PenSquare size={16} /> New Post
              </Link>
            </Button>
          </div>

          {postsLoading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            )
          ) : userPosts.length > 0 ? (
            viewMode === "grid" ? (
              // Grid View - Instagram Style
              <div className="grid grid-cols-3 gap-1">
                {userPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/posts/${post._id}`}
                    className="relative aspect-square bg-muted hover:opacity-90 transition-opacity group"
                  >
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="font-medium line-clamp-3 text-sm text-center">
                        {post.title}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Heart size={18} className="mr-1" />
                          <span className="text-sm font-semibold">0</span>
                        </div>
                        <div className="flex items-center">
                          <MessageCircle size={18} className="mr-1" />
                          <span className="text-sm font-semibold">0</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <Card key={post._id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={user.avatar || ""}
                            alt={user.name}
                          />
                          <AvatarFallback>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      <Link href={`/posts/${post._id}`}>
                        <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-muted-foreground line-clamp-2 mb-3">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground"
                          >
                            <Heart size={18} className="mr-1" /> 0
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground"
                          >
                            <MessageCircle size={18} className="mr-1" /> 0
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground"
                          >
                            <Share2 size={18} />
                          </Button>
                        </div>

                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/posts/${post._id}`}>View</Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/edit-post/${post._id}`}>
                              <FileEdit size={14} className="mr-1" /> Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            // Empty state
            <div className="text-center py-16 border rounded-md bg-muted/30">
              <BookOpen className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Share your thoughts with the world.
              </p>
              <Button asChild>
                <Link href="/create-post">Create Your First Post</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Saved Posts Tab */}
        <TabsContent value="saved">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
              >
                <Grid size={16} />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                <List size={16} />
              </Button>
            </div>
            {/* <h2 className="text-lg font-semibold">Saved Posts</h2> */}
          </div>

          {bookmarksLoading ? (
            viewMode === "grid" ? (
              // Loading State: Grid View
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            ) : (
              // Loading State: List View
              <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            )
          ) : bookmarkPosts.length > 0 ? (
            viewMode === "grid" ? (
              // Grid View
              <div className="grid grid-cols-3 gap-1">
                {bookmarkPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/posts/${post._id}`}
                    className="relative aspect-square bg-muted hover:opacity-90 transition-opacity group"
                  >
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="font-medium line-clamp-3 text-sm text-center">
                        {post.title}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Heart size={18} className="mr-1" />
                          <span className="text-sm font-semibold">
                            {post.likes?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MessageCircle size={18} className="mr-1" />
                          <span className="text-sm font-semibold">
                            {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {bookmarkPosts.map((post) => (
                  <Card key={post._id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={user.avatar || ""}
                            alt={user.name}
                          />
                          <AvatarFallback>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium">{post.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {post.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Heart size={14} />
                          <span>{post.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            // Empty state
            <div className="text-center py-16 border rounded-md bg-muted/30">
              <Bookmark className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No saved posts</h3>
              <p className="text-muted-foreground mb-4">
                Save posts you like to view them later.
              </p>
              <Button asChild>
                <Link href="/">Browse Posts</Link>
              </Button>
            </div>
          )}

          {/* Footer Tip */}
          <div className="border-t">
            <div className="p-4 text-sm text-muted-foreground">
              <p>
                You can save posts by clicking the{" "}
                <Bookmark className="inline h-4 w-4" /> icon on any post.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tagged Posts Tab */}
        <TabsContent value="tagged">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-16 w-16 mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">Tagged Posts</h3>
            <p className="text-muted-foreground max-w-sm">
              When people tag you in posts, they'll appear here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
