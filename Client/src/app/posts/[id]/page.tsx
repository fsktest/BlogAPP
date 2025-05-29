"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Send,
  MessageSquare,
  Heart,
  Bookmark,
  Share,
  ThumbsUp,
  BookmarkIcon,
  ArrowLeft,
} from "lucide-react";

// API base URL
const API_BASE_URL = "http://localhost:5555";

type Comment = {
  _id: string;
  post: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName?: string; // For display purposes
};

type Post = {
  _id: string;
  title: string;
  content: string;
  author: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  likes?: string[];
  bookmarks?: string[];
};

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>("Unknown Author");
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const { toast } = useToast();

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentAuthors, setCommentAuthors] = useState<Record<string, string>>(
    {}
  );
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Social action states
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameFromProfile, setCameFromProfile] = useState(false);
  const searchParams = useSearchParams();
  const cameFrom = searchParams.get("ref");

  useEffect(() => {
    if (typeof document !== "undefined") {
      // Check if the previous page was the profile page
      setCameFromProfile(document.referrer.includes("/profile"));
    }
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      console.log("Fetching post with ID:", id);
      try {
        // First try to fetch all posts by the current user (since you have this endpoint)
        const allPostsResponse = await fetch(`${API_BASE_URL}/allpost`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!allPostsResponse.ok) {
          throw new Error("Failed to load posts");
        }

        const allPostsData = await allPostsResponse.json();
        // console.log("All posts response:", allPostsResponse);

        // Find the post with the matching ID
        const foundPost = allPostsData.allPost.find((p: any) => p._id === id);

        console.log("Found post comments:", foundPost.comments);
        if (!foundPost) {
          throw new Error("Post not found");
        }

        setPost(foundPost);

        // Set likes count
        setLikesCount(foundPost.likes?.length || 0);

        // Check if user has liked this post
        if (user && foundPost.likes) {
          const userLiked = foundPost.likes.some(
            (likeId: string) => String(likeId) === String(user.id)
          );
          setIsLiked(userLiked);
        }

        // Check if user has bookmarked this post
        if (user && foundPost.bookmarks) {
          const userBookmarked = foundPost.bookmarks.some(
            (bookmarkId: string) => String(bookmarkId) === String(user.id)
          );
          setIsBookmarked(userBookmarked);
        }

        // Fetch author details if available
        if (foundPost.author) {
          try {
            // Check if you have a user details endpoint
            setAuthorName(foundPost.author.name);
          } catch (err) {
            console.error("Failed to fetch author details:", err);
          }
        }

        // Fetch comment authors if there are comments
        if (foundPost.comments && foundPost.comments.length > 0) {
          await fetchCommentAuthors(foundPost.comments);
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(
          "Failed to load the post. It might have been deleted or you don't have permission to view it."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, token, user]);

  // Fetch names of comment authors
  const fetchCommentAuthors = async (comments: Comment[]) => {
    console.log("Fetching comment authors for comments:", comments);

    // Filter out comments with undefined or null author IDs
    const uniqueAuthorIds = [
      ...new Set(
        comments
          .filter((comment) => comment.author) // Filter out undefined/null authors
          .map((comment) => comment.author)
      ),
    ];

    if (uniqueAuthorIds) {
      setCommentAuthors((prev) => ({
        ...prev,
        ...comments.reduce((acc, comment) => {
          if (comment.author && !acc[comment.author]) {
            acc[comment.author] = comment.authorName || "Unknown User";
          }
          return acc;
        }, {}),
      }));
    }
    console.log("Unique author IDs to fetch:", uniqueAuthorIds);
    console.log("UserID:", user);
    const authors: Record<string, string> = {};

    // Try to get current user details first (for efficiency)
    if (user && uniqueAuthorIds.includes(user.id)) {
      authors[user.id] = user.name || "Me";
    }

    // Use a more reliable endpoint that you know works
    try {
      // Get all users in one call if possible - this is more efficient
      const response = await fetch(`${API_BASE_URL}/get-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          userIds: uniqueAuthorIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Map all users to their IDs
        if (data.users && Array.isArray(data.users)) {
          data.users.forEach((user: any) => {
            authors[user._id] = user.name || "User";
          });
        }
        console.log("Successfully fetched multiple users:", data);
      } else {
        console.warn(
          "Failed to fetch users in bulk, falling back to individual requests"
        );

        // Fall back to individual requests
        for (const authorId of uniqueAuthorIds) {
          try {
            // Skip if we already have this user (current user)
            if (authors[authorId]) continue;

            // Skip undefined authorIds
            if (!authorId) {
              console.warn("Skipping undefined author ID");
              continue;
            }

            // Try to use the API endpoint that works in your app
            const userResponse = await fetch(
              `${API_BASE_URL}/get-currentuser-details`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "X-User-ID": authorId, // Some APIs might support this pattern
                },
              }
            );

            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log("User data received:", userData);
              authors[authorId] = userData?.user?.name || "Unknown User";
            } else {
              // Try the get-user/:id endpoint as originally implemented
              const directResponse = await fetch(
                `${API_BASE_URL}/get-user/${authorId}`,
                {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
              );

              if (directResponse.ok) {
                const data = await directResponse.json();
                authors[authorId] = data.user.name || "Unknown User";
                console.log(
                  `Successfully fetched user ${authorId}:`,
                  data.user.name
                );
              } else {
                console.warn(
                  `Failed to fetch author with ID ${authorId}: ${directResponse.status}`
                );
                authors[authorId] = "Unknown User";
              }
            }
          } catch (err) {
            console.error(
              `Failed to fetch author details for ${authorId}:`,
              err
            );
            authors[authorId] = "Unknown User";
          }
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }

    console.log("Final author mapping:", authors);
    setCommentAuthors(authors);
    return authors;
  };

  // Handle commenting on the post
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!user || !token) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment on posts",
        variant: "destructive",
      });
      return;
    }

    setSubmittingComment(true);

    try {
      const response = await fetch(`${API_BASE_URL}/comment-post/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          comment: commentText.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        console.log("Comment added successfully:", data);

        // Update the post state with the new comment
        setPost(data.post);
        setCommentText("");

        // Update comment authors
        if (data.post.comments) {
          await fetchCommentAuthors(data.post.comments);
        }

        toast({
          title: "Success",
          description: "Comment added successfully",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to add comment",
          description: errorData.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      toast({
        title: "Error",
        description: "An error occurred while adding your comment",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Add the handleReply function
  const handleReply = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim()) {
      toast({
        title: "Empty reply",
        description: "Please enter a reply before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!user || !token) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply to comments",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReply(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/comment-reply/${commentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            content: replyText.trim(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Reply added successfully:", data);

        // Update the post state with the updated comment
        if (post && post.comments) {
          const updatedComments = post.comments.map((c) =>
            c._id === commentId ? data.comment : c
          );
          setPost({ ...post, comments: updatedComments });
        }

        // Clear reply state
        setReplyText("");
        setReplyingTo(null);

        toast({
          title: "Success",
          description: "Reply added successfully",
          variant: "default",
        });

        // Update comment authors if needed
        if (data.comment.replies) {
          const replyUsers = data.comment.replies
            .filter(
              (reply: any) => reply.user && typeof reply.user === "string"
            )
            .map((reply: any) => reply.user);

          if (replyUsers.length > 0) {
            const uniqueUserIds = [...new Set(replyUsers)];
            await fetchCommentAuthors(
              uniqueUserIds.map((id) => ({ author: id, _id: "" } as any))
            );
          }
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to add reply",
          description: errorData.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error adding reply:", err);
      toast({
        title: "Error",
        description: "An error occurred while adding your reply",
        variant: "destructive",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle like/unlike action
  const handleLike = async () => {
    if (!user || !token) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }

    if (isProcessing || !post) return; // Prevent multiple clicks
    setIsProcessing(true);

    try {
      const endpoint = isLiked ? "unlike-post" : "like-post";

      const response = await fetch(`${API_BASE_URL}/${endpoint}/${post._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process like");
      }

      const data = await response.json();

      // Update UI state
      setIsLiked(!isLiked);
      setLikesCount(data.post.likes.length);

      // Update post state
      setPost(data.post);

      toast({
        title: isLiked ? "Post unliked" : "Post liked",
        description: isLiked
          ? "You have unliked this post"
          : "You have liked this post",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to process like:", error);
      toast({
        title: "Action failed",
        description:
          error instanceof Error ? error.message : "Failed to like post",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bookmark/unbookmark action
  const handleBookmark = async () => {
    if (!user || !token) {
      toast({
        title: "Authentication required",
        description: "Please log in to bookmark posts",
        variant: "destructive",
      });
      return;
    }

    if (isProcessing || !post) return; // Prevent multiple clicks
    setIsProcessing(true);

    try {
      const endpoint = isBookmarked ? "unbookmark-post" : "bookmark-post";

      const response = await fetch(`${API_BASE_URL}/${endpoint}/${post._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process bookmark");
      }

      const data = await response.json();

      // Update UI state
      setIsBookmarked(!isBookmarked);

      // Update post state
      setPost(data.post);

      toast({
        title: isBookmarked ? "Post unsaved" : "Post saved",
        description: isBookmarked
          ? "Post removed from your bookmarks"
          : "Post saved to your bookmarks",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to process bookmark:", error);
      toast({
        title: "Action failed",
        description:
          error instanceof Error ? error.message : "Failed to save post",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title || "Shared Post",
          text: post?.content?.substring(0, 100) || "Check out this post!",
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Post link copied to clipboard!",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Share failed",
        description: "Failed to share post",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    setDeleteInProgress(true);
    toast({
      title: "Deleting post...",
      description: "Please wait while we delete your post.",
      variant: "destructive",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/delete-post/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
          variant: "default",
        });
        router.push("/"); // Use router for navigation instead of direct window location
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete post");
        toast({
          title: "Error",
          description: data.message || "Failed to delete post",
          variant: "destructive",
        });
        setDeleteInProgress(false);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("An error occurred while trying to delete the post");
      toast({
        title: "Error",
        description: "An error occurred while trying to delete the post",
        variant: "destructive",
      });
      setDeleteInProgress(false);
    }
  };

  // Helper function to get initials from a name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // const handleBack = () => {
  //   // if the previous page was profile, redirect to profile
  //   if (!document.referrer) {
  //     router.push("/");
  //     return;
  //   }
  //   // Check if the referrer is the profile page
  //   if (cameFromProfile) {
  //     // Redirect to profile page
  //     router.push("/profile");
  //     return;
  //   }
  //   // Otherwise, go back to the previous page
  //   router.back();
  // };

  const handleBack = () => {
    if (cameFrom === "profile") {
      router.push("/profile");
    } else {
      router.back(); // or router.push("/") as fallback
    }
  };

  // Helper function to format date with time
  const formatDateWithTime = (dateString: string | undefined) => {
    if (!dateString) return "Unknown date";

    try {
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) return "Invalid date";

      // Format: May 28, 2023 at 2:30 PM
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Date error";
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Link href="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Post Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The post you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // router.push('/profile') if the previous page was profile
  // or handle back navigation

  const isAuthor = user?.id === post.author;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button variant="default" onClick={handleBack} className="mb-4 w-fit">
        {/* side Arrow lucide react icons  */}
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{post.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            <span>By {authorName} • </span>
            <span>
              {post.createdAt ? formatDate(post.createdAt) : "Unknown date"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {post.content.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </CardContent>

        {/* Social Actions */}
        <CardFooter className="flex flex-col gap-4 pt-6 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="flex items-center text-sm text-muted-foreground">
                <ThumbsUp className="h-4 w-4 mr-1" /> {likesCount} likes
              </span>
              <span className="flex items-center text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4 mr-1" />{" "}
                {post.comments?.length || 0} comments
              </span>
            </div>

            {isAuthor && (
              <Link href={`/edit-post/${post._id}`}>
                <Button variant="ghost" size="sm">
                  Edit Post
                </Button>
              </Link>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center w-full">
            <Button
              variant="ghost"
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                isLiked && "text-primary"
              )}
              onClick={handleLike}
              disabled={isProcessing}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  isProcessing && "opacity-50",
                  isLiked && "fill-primary text-primary"
                )}
              />
              {isLiked ? "Liked" : "Like"}
            </Button>

            <Dialog
              open={commentsDialogOpen}
              onOpenChange={setCommentsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  Comments
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg flex flex-col max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>
                    Comments ({post.comments?.length || 0})
                  </DialogTitle>
                  <DialogDescription>
                    Join the conversation about this post.
                  </DialogDescription>
                </DialogHeader>
                {/* Scrollable comments area */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Existing Comments */}
                  {post.comments && post.comments.length > 0 ? (
                    <div className="space-y-6 mb-6">
                      {post.comments.map((comment) => (
                        <div
                          key={comment._id}
                          className="flex gap-4 pb-6 border-b last:border-0"
                        >
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback>
                              {getInitials(
                                typeof comment.author === "object" &&
                                  comment.author?.name
                                  ? comment.author.name
                                  : commentAuthors[
                                      typeof comment.author === "string"
                                        ? comment.author
                                        : ""
                                    ] || "User"
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <p className="text-sm font-semibold">
                                  {typeof comment.author === "object" &&
                                  comment.author?.name
                                    ? comment.author.name
                                    : commentAuthors[
                                        typeof comment.author === "string"
                                          ? comment.author
                                          : ""
                                      ] || "Unknown User"}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDateWithTime(comment.createdAt)}
                              </p>
                            </div>
                            <div className="text-sm mt-1 text-foreground/90 whitespace-pre-wrap break-words">
                              {comment.content}
                            </div>

                            {/* Reply button */}
                            <div className="mt-2 flex items-center">
                              <Button
                                variant="line"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground"
                                onClick={() =>
                                  setReplyingTo(
                                    replyingTo === comment._id
                                      ? null
                                      : comment._id
                                  )
                                }
                              >
                                {replyingTo === comment._id
                                  ? "Cancel"
                                  : "Reply"}
                              </Button>
                            </div>

                            {/* Reply form */}
                            {replyingTo === comment._id && (
                              <form
                                className="mt-3 pl-4 border-l-2 border-muted"
                                onSubmit={(e) => handleReply(comment._id, e)}
                              >
                                <div className="flex gap-3 items-start">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarFallback className="text-[10px]">
                                      {user?.name
                                        ? getInitials(user.name)
                                        : "ME"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-2">
                                    <Textarea
                                      placeholder="Write a reply..."
                                      className="resize-none text-sm min-h-[80px]"
                                      value={replyText}
                                      onChange={(e) =>
                                        setReplyText(e.target.value)
                                      }
                                      disabled={submittingReply}
                                    />
                                    <div className="flex justify-end">
                                      <Button
                                        type="submit"
                                        size="sm"
                                        disabled={
                                          submittingReply || !replyText.trim()
                                        }
                                        className="text-xs h-8"
                                      >
                                        {submittingReply
                                          ? "Posting..."
                                          : "Reply"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </form>
                            )}

                            {/* Existing replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-muted space-y-4">
                                {comment.replies.map((reply, index) => {
                                  const username =
                                    typeof reply.user === "object" &&
                                    reply.user?.name
                                      ? reply.user.name
                                      : reply.username ||
                                        commentAuthors[reply.user] ||
                                        "Unknown User";

                                  return (
                                    <div
                                      key={reply._id || index}
                                      className="flex gap-3"
                                    >
                                      <Avatar className="h-6 w-6 flex-shrink-0">
                                        <AvatarFallback className="text-[10px]">
                                          {getInitials(username)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <p className="text-xs font-semibold">
                                            {username}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {formatDateWithTime(
                                              reply.createdAt
                                            )}
                                          </p>
                                        </div>
                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                                          {reply.content}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
                {/* Fixed comment form at the bottom */}
                <div className="mt-4 pt-4 border-t border-border">
                  {/* Add Comment Form */}
                  {user ? (
                    <form onSubmit={handleAddComment}>
                      <div className="flex gap-4">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback>
                            {user.name ? getInitials(user.name) : "ME"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <Textarea
                            placeholder="Write a comment..."
                            className="resize-none"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            disabled={submittingComment}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={
                                submittingComment || !commentText.trim()
                              }
                              className="flex items-center gap-2"
                            >
                              {submittingComment
                                ? "Posting..."
                                : "Post Comment"}
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 border border-dashed rounded-lg text-center">
                      <p className="text-muted-foreground">
                        Please{" "}
                        <Link
                          href="/login"
                          className="text-primary font-medium"
                        >
                          log in
                        </Link>{" "}
                        to comment on this post.
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                isBookmarked && "text-primary"
              )}
              onClick={handleBookmark}
              disabled={isProcessing}
            >
              <Bookmark
                className={cn(
                  "h-5 w-5",
                  isProcessing && "opacity-50",
                  isBookmarked && "fill-primary text-primary"
                )}
              />
              {isBookmarked ? "Saved" : "Save"}
            </Button>

            <Button
              variant="ghost"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleShare}
            >
              <Share className="h-5 w-5" />
              Share
            </Button>
          </div>

          {/* Delete Post Button - Only for author */}
          {isAuthor && (
            <>
              <Separator className="my-2" />
              <div className="w-full flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteInProgress}
                    >
                      {deleteInProgress ? "Deleting..." : "Delete Post"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your post and remove it from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Comments Section - Direct on page */}
      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({post.comments?.length || 0})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommentsDialogOpen(true)}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {/* Preview of Recent Comments */}
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-6">
                {post.comments.slice(0, 3).map((comment) => (
                  <div
                    key={comment._id}
                    className="flex gap-4 pb-6 border-b last:border-0"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(comment.author?.name || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-semibold">
                            {comment.author?.name || "Unknown User"}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateWithTime(comment.createdAt)}
                        </p>
                      </div>
                      <div className="text-sm mt-1 text-foreground/90 whitespace-pre-wrap">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))}

                {post.comments.length > 3 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCommentsDialogOpen(true)}
                    >
                      Show {post.comments.length - 3} more comments...
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
