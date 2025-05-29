"use client";

import type { Post } from "@/lib/types";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  UserCircle,
  CalendarDays,
  Tag,
  MessageSquare,
  Heart,
  Bookmark,
  Users,
  Share,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = "http://localhost:5555"; // Adjust based on your API URL

type BlogPostCardProps = {
  post: Post;
  refreshPosts?: () => void; // Optional callback to refresh post list after actions
};

export default function BlogPostCard({
  post,
  refreshPosts,
}: BlogPostCardProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(() => {
    // // Add some debug logging
    // console.log("User ID:", user?.id);
    // console.log("Post likes:", post.likes);

    // Check if the user's ID is in the likes array
    return (
      Array.isArray(post.likes) &&
      user?.id &&
      post.likes.some(
        (id) =>
          // Convert both to strings to ensure proper comparison
          String(id) === String(user.id)
      )
    );
  });
  const [isBookmarked, setIsBookmarked] = useState(
    post.bookmarks?.includes(user?.id || "") || false
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isProcessing, setIsProcessing] = useState(false);

  // console.log("Post data:", post);

  // Add this useEffect to update like state when user or post changes
  useEffect(() => {
    if (user && post.likes) {
      // Update like state when user or post changes
      const userLiked = post.likes.some((likeId) =>
        String(likeId) === String(user.id)
      );
      setIsLiked(userLiked);
      setLikesCount(post.likes.length);
    }

    if (user && post.bookmarks) {
      // Update bookmark state when user or post changes
      const userBookmarked = post.bookmarks.some((bookmarkId) =>
        String(bookmarkId) === String(user.id)
      );
      setIsBookmarked(userBookmarked);
    }
  }, [user, post.likes, post.bookmarks]);

  // Handle like/unlike action
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !token) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }

    if (isProcessing) return; // Prevent multiple clicks
    setIsProcessing(true);

    try {
      const endpoint = isLiked ? "unlike-post" : "like-post";

      const response = await fetch(`${API_BASE_URL}/${endpoint}/${post.id}`, {
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

      // Refresh posts list if callback provided
      if (refreshPosts) {
        refreshPosts();
      }
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
  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !token) {
      toast({
        title: "Authentication required",
        description: "Please log in to bookmark posts",
        variant: "destructive",
      });
      return;
    }

    if (isProcessing) return; // Prevent multiple clicks
    setIsProcessing(true);

    try {
      const endpoint = isBookmarked ? "unbookmark-post" : "bookmark-post";

      const response = await fetch(`${API_BASE_URL}/${endpoint}/${post.id}`, {
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

      // Update UI state
      setIsBookmarked(!isBookmarked);

      // Refresh posts list if callback provided
      if (refreshPosts) {
        refreshPosts();
      }
    } catch (error) {
      console.error("Failed to process bookmark:", error);
      toast({
        title: "Action failed",
        description:
          error instanceof Error ? error.message : "Failed to bookmark post",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle share
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.summary || post.content.substring(0, 100),
          url: `${window.location.origin}/posts/${post.id}`,
        });
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigator.clipboard.writeText(
          `${window.location.origin}/posts/${post.id}`
        );
        toast({
          title: "Link copied",
          description: "Post link copied to clipboard!",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-2xl hover:text-primary transition-colors">
            <Link href={`/posts/${post.id}`}>{post.title}</Link>
          </CardTitle>

          {/* Social Actions (Mobile) */}
          <div className="flex md:hidden items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleLike}
              disabled={isProcessing}
            >
              <Heart
                size={18}
                className={cn(
                  "transition-colors",
                  isProcessing && "opacity-50",
                  isLiked
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleBookmark}
              disabled={isProcessing}
            >
              <Bookmark
                size={18}
                className={cn(
                  "transition-colors",
                  isProcessing && "opacity-50",
                  isBookmarked
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                )}
              />
            </Button>
          </div>
        </div>

        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <UserCircle size={16} />{" "}
            {post.authorName ? post.authorName : "Unknown Author"}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays size={16} />{" "}
            {format(new Date(post.createdAt), "MMM d, yyyy")}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground line-clamp-3">
          {post.summary || post.content.substring(0, 150) + "..."}
        </p>

        {/* Tagged Users */}
        {post.tagged && post.tagged.length > 0 && (
          <div className="flex items-center gap-1 mt-4">
            <Users size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">With:</span>
            <div className="flex -space-x-2">
              {/* Display tagged users (adjust according to your User model structure) */}
              {/* This will need to be populated data with names and avatars */}
              {post.tagged.slice(0, 3).map((taggedId, index) => (
                <TooltipProvider key={taggedId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6 border border-background hover:translate-y-[-2px] transition-transform">
                        <AvatarFallback className="text-[10px]">
                          {`T${index + 1}`}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>Tagged User</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}

              {post.tagged.length > 3 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6 border border-background bg-muted">
                        <AvatarFallback className="text-[10px]">
                          +{post.tagged.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>More tagged users</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {/* Social Stats */}
        {/* <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
          <div className="flex space-x-4">
            <span className="flex items-center gap-1">
              <MessageSquare size={14} /> {post.comments?.length || 0} comments
            </span>
            <span className="flex items-center gap-1">
              <Heart size={14} /> {likesCount} likes
            </span>
          </div> */}

        {/* Social Actions (Desktop) */}

        {/* </div> */}

        <div className="flex flex-wrap justify-between items-center w-full">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags &&
              post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <Tag size={12} /> {tag}
                </Badge>
              ))}
            {post.tags && post.tags.length > 3 && (
              <Badge variant="outline">+{post.tags.length - 3} more</Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="hidden md:flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex gap-1 text-xs"
                onClick={handleLike}
                disabled={isProcessing}
              >
                <Heart
                  size={14}
                  className={cn(
                    "transition-colors",
                    isProcessing && "opacity-50",
                    isLiked ? "fill-red-500 text-red-500" : ""
                  )}
                />
                {isLiked ? "Liked" : "Like"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex gap-1 text-xs"
                onClick={handleBookmark}
                disabled={isProcessing}
              >
                <Bookmark
                  size={14}
                  className={cn(
                    "transition-colors",
                    isProcessing && "opacity-50",
                    isBookmarked ? "fill-primary text-primary" : ""
                  )}
                />
                {isBookmarked ? "Saved" : "Save"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex gap-1 text-xs"
                onClick={handleShare}
              >
                <Share size={14} />
                Share
              </Button>
            </div>
            <Button
              asChild
              variant="link"
              className="text-accent hover:text-accent-foreground p-0 h-auto"
            >
              <Link href={`/posts/${post.id}`}>Read More &rarr;</Link>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
