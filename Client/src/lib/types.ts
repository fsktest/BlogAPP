// Update or add to your existing types

export type User = {
  id: string;
  name: string;
  avatar?: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  summary?: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  likes?: string[]; // Array of user IDs who liked the post
  bookmarks?: string[]; // Array of user IDs who bookmarked the post
  comments?: Comment[];
  taggedUsers?: User[]; // Users tagged in the post
};

// Update your Comment type definition
export type CommentReply = {
  _id: string;
  user: string | { _id: string; name: string; avatar?: string };
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  _id: string;
  post: string;
  author: string | { _id: string; name: string; avatar?: string };
  content: string;
  replies: CommentReply[];
  createdAt: string;
  updatedAt: string;
  authorName?: string; // For display purposes
};
