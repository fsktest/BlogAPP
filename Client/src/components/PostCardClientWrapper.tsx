"use client";

import { Post } from "@/lib/types";
import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PostCardSkeleton } from "./PostCardServer";

// Dynamically import the client component
const PostCard = dynamic(() => import("./PostCard"), {
  loading: () => <PostCardSkeleton />
});

export default function PostCardClientWrapper({ post }: { post: Post }) {
  const [isClient, setIsClient] = useState(false);

  // This ensures hydration completes before rendering the dynamic component
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <PostCardSkeleton />;
  }

  return (
    <Suspense fallback={<PostCardSkeleton />}>
      <PostCard post={post} />
    </Suspense>
  );
}