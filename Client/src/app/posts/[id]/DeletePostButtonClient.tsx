"use client";

// This is a wrapper component to ensure DeletePostButton (which uses useState) can be used in a server component tree.
// The actual DeletePostButton itself is already a client component.
// This specific wrapper allows passing server actions or client-side handlers as props.

import DeletePostButton from "@/components/blog/DeletePostButton";

type DeletePostButtonClientProps = {
  postId: string;
  postTitle: string;
  onDelete: (postId: string) => Promise<boolean>;
};

export default function DeletePostButtonClient(props: DeletePostButtonClientProps) {
  return <DeletePostButton {...props} />;
}
