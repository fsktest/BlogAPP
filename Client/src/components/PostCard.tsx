"use client";

import { useState } from "react";
import type { Post } from "@/lib/types";
import Link from "next/link";
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
import {
  CalendarDays,
  Tag,
  MessageSquare,
  Heart,
  UserCircle,
  Bookmark,
  Share,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://blogapp-62q1.onrender.com";

interface PostCardProps {
  post: Post;
  refreshPosts?: () => void;
}

export default function PostCard({ post, refreshPosts }: PostCardProps) {
  const { toast } = useToast();
  const { user, token } = useAuth();

  // console.log("Rendering PostCard for post:", post);

  // States for like and bookmark
  const [isLiked, setIsLiked] = useState(
    user ? post.likes.includes(user.id) : false
  );
  const [isBookmarked, setIsBookmarked] = useState(
    user ? post.bookmarks.includes(user.id) : false
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isProcessing, setIsProcessing] = useState(false);

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

      console.log("Like response data:", data);

      // Update UI state
      setIsLiked(!isLiked);
      setLikesCount(data.post.likes.length);

      // Refresh posts list if callback provided
      if (refreshPosts) {
        refreshPosts();
      }

      toast({
        title: isLiked ? "Post unliked" : "Post liked",
        description: isLiked ? "You removed your like" : "You liked this post",
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

      toast({
        title: isBookmarked ? "Post unsaved" : "Post saved",
        description: isBookmarked
          ? "Post removed from your bookmarks"
          : "Post saved to your bookmarks",
        variant: "default",
      });

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
          url: `${window.location.origin}/posts/${post._id}`,
        });
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigator.clipboard.writeText(
          `${window.location.origin}/posts/${post._id}`
        );
        toast({
          title: "Link copied",
          description: "Post link copied to clipboard!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Share failed",
        description: "Could not share this post",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl hover:text-primary transition-colors">
            <Link href={`/posts/${post._id}`}>{post.title}</Link>
          </CardTitle>

          {/* Bookmark button - positioned at the top right */}
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
            <span className="sr-only">
              {isBookmarked ? "Unsave" : "Save"} post
            </span>
          </Button>
        </div>

        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <UserCircle size={16} /> {post.author.name || "Unknown Author"}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays size={16} /> {formatDate(post.createdAt)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground line-clamp-3 min-h-20">
          {post.summary || post.content.substring(0, 150) + "..."}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                <Tag size={12} /> {tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline">+{post.tags.length - 3} more</Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="flex items-center gap-2">
          {/* Like Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex items-center gap-1 px-2"
            onClick={handleLike}
            disabled={isProcessing}
          >
            <Heart
              size={16}
              className={cn(
                "transition-colors",
                isProcessing && "opacity-50",
                isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )}
            />
            <span className={cn(
              "text-sm",
              isLiked && "text-red-500"
            )}>
              {likesCount}
            </span>
          </Button>

          {/* Comment count */}
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare size={16} /> {post.comments?.length || 0}
          </span>

          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex items-center gap-1 px-2"
            onClick={handleShare}
          >
            <Share size={16} className="text-muted-foreground" />
            <span className="text-sm">Share</span>
          </Button>
        </div>

        <Button
          asChild
          variant="link"
          className="p-0 h-auto"
        >
          <Link href={`/posts/${post._id}`}>Read More →</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}