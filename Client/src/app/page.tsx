export const dynamic = 'force-dynamic';

import MainLayout from "@/components/layout/MainLayout";
import PostCardServer from "@/components/PostCardServer";
import { getServerPosts } from "@/lib/actions";
import Image from "next/image";

export default async function HomePage() {
  const posts = await getServerPosts();

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Latest Posts</h1>

        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCardServer key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Image
              src="https://placehold.co/300x200.png"
              alt="No posts found"
              width={300}
              height={200}
              className="mx-auto mb-4 rounded-lg shadow-md"
              data-ai-hint="empty state illustration"
            />
            <p className="text-muted-foreground">
              No posts found. Be the first to create a post!
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
