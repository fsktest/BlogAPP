"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit } from "lucide-react";
import DeletePostButtonClient from "./DeletePostButtonClient";
import { deletePost as deletePostAction } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";


type PostAuthorControlsProps = {
  postId: string;
  authorId: string;
  postTitle: string;
};

export default function PostAuthorControls({ postId, authorId, postTitle }: PostAuthorControlsProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleDeletePost = async (id: string): Promise<boolean> => {
    try {
      const success = await deletePostAction(id);
      if (success) {
        router.push('/'); // Redirect to home after successful deletion
        router.refresh(); // Ensure client-side cache is updated
      }
      return success;
    } catch (error) {
      console.error("Deletion failed in client component:", error);
      toast({ title: "Error", description: "Failed to delete post due to an unexpected error.", variant: "destructive" });
      return false;
    }
  };

  if (loading) {
    return (
      <div className="mt-8 pt-8 border-t border-border flex gap-4">
        <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
        <div className="h-10 w-28 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (user && user.id === authorId) {
    return (
      <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/posts/${postId}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit Post
          </Link>
        </Button>
        <DeletePostButtonClient
          postId={postId}
          postTitle={postTitle}
          onDelete={handleDeletePost}
        />
      </div>
    );
  }

  return null;
}
