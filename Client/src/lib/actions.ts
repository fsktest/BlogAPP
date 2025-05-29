import type { Post, PostFormData } from "./types";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PROD_API_URL || "";

export function getAuthToken(): string | null {
  // Server environment
  if (typeof window === "undefined") {
    try {
      const cookieStore = cookies();
      return cookieStore.get("midnight-musings-token")?.value || null;
    } catch (e) {
      console.warn("Could not access cookies on server:", e);
      return null;
    }
  }
  // Client environment
  else {
    return (
      localStorage.getItem("midnight-musings-token") ||
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("midnight-musings-token="))
        ?.split("=")[1] ||
      null
    );
  }
}

// export async function getServerPosts() {
//   try {
//     // Get token from server-side cookies
//     let token = null;
//     try {
//       const cookieStore = cookies();
//       token = cookieStore.get("midnight-musings-token")?.value || null;
//     } catch (e) {
//       console.error("Could not access cookies on server:", e);
//     }

//     // Create headers
//     const headers: HeadersInit = {};
//     if (token) {
//       headers["Authorization"] = `Bearer ${token}`;
//     }

//     // Use absolute URL for server components
//     const API_BASE_URL =
//       process.env.NEXT_PROD_API_URL || "https://blogapp-62q1.onrender.com";

//     // Make the request
//     const response = await fetch(`${API_BASE_URL}/allpost`, {
//       headers,
//       cache: "no-store",
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch posts: ${response.status}`);
//     }

//     const data = await response.json();
//     const posts = data.allPost || [];

//     return posts.map((post: any) => ({
//       id: post._id,
//       title: post.title || "Untitled",
//       content: post.content || "",
//       summary: post.summary || post.content?.substring(0, 150) || "",
//       authorId:
//         typeof post.author === "object" ? post.author?._id : post.author,
//       authorName:
//         typeof post.author === "object" ? post.author?.name : "Unknown Author",
//       tags: post.tags || [],
//       likes: post.likes || [],
//       bookmarks: post.bookmarks || [],
//       comments: post.comments || [],
//       createdAt: post.createdAt,
//       updatedAt: post.updatedAt,
//     }));
//   } catch (error) {
//     console.error("Error fetching posts:", error);
//     return [];
//   }
// }

// Fetch all posts
// export async function fetchPosts(): Promise<Post[]> {
//   try {
//     const response = await fetch(`${API_BASE_URL}/allpost`);
//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || "Failed to fetch posts");
//     }

//     const postsRaw: any[] = data.allPost;
//     const uniqueAuthorIds = [...new Set(postsRaw.map((post) => post.author))];

//     const authorNameById = new Map<string, string>();

//     // Fetch all author names in parallel using /get-user/:id
//     await Promise.all(
//       uniqueAuthorIds.map(async (authorId) => {
//         try {
//           const res = await fetch(`${API_BASE_URL}/get-user/${authorId}`);
//           if (!res.ok) throw new Error("Failed to fetch user");

//           const userData = await res.json();
//           authorNameById.set(authorId, userData.user?.name ?? "Unknown Author");
//         } catch (err) {
//           console.error(`Error fetching user ${authorId}:`, err);
//           authorNameById.set(authorId, "Unknown Author");
//         }
//       })
//     );

//     // Map posts with author names
//     return postsRaw.map((post) => ({
//       id: post._id,
//       title: post.title,
//       content: post.content,
//       summary: post.content.substring(0, 150),
//       authorId: post.author,
//       authorName: authorNameById.get(post.author) || "Unknown Author",
//       tags: post.tags || [],
//       likes: post.likes || [],
//       bookmarks: post.bookmarks || [],
//       comments: post.comments || [],
//       taggedUsers: post.taggedUsers || [],
//       createdAt: post.createdAt,
//       updatedAt: post.updatedAt,
//     }));
//   } catch (error) {
//     console.error("Error fetching posts:", error);
//     return [];
//   }
// }

// Update the function to be async and properly await cookies()
export async function getServerPosts() {
  let token = null;
  
  // Server-side: Get token from cookies
  if (typeof window === 'undefined') {
    try {
      const cookieStore = cookies();
      // Make sure to await cookies() before using get()
      token = (await cookieStore).get("midnight-musings-token")?.value || null;
    } catch (e) {
      console.error("Could not access cookies on server:", e);
    }
  }
  // Client-side: Get token from localStorage
  else {
    token = localStorage.getItem("midnight-musings-token") || null;
  }

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://blogapp-62q1.onrender.com";
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/allpost`, {
      headers,
      cache: 'no-store', // Ensure we get fresh data each time
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching posts: ${response.status}`);
    }
    
    const data = await response.json();
    return data.allPost || [];
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}

export async function fetchPosts(): Promise<Post[]> {
  try {
    const token = getAuthToken();

    // Create headers object
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Ensure we have an absolute URL for server-side fetching
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL;
    const url = new URL("/allpost", apiBaseUrl).toString();

    const response = await fetch(url, {
      headers,
      cache: "no-store",
      // For Next.js 13+ server components
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch posts:", errorData);
      throw new Error(errorData.message || "Failed to fetch posts");
    }

    const data = await response.json();
    const postsRaw: any[] = data.allPost || [];

    // Process posts as before, but with better error handling
    return postsRaw.map((post) => {
      try {
        // Extract author info
        const authorId =
          typeof post.author === "object" && post.author?._id
            ? post.author._id
            : post.author;

        const authorName =
          typeof post.author === "object" && post.author?.name
            ? post.author.name
            : "Unknown Author";

        // Rest of your mapping logic...
        return {
          id: post._id,
          title: post.title,
          content: post.content,
          summary: post.summary || post.content?.substring(0, 150) || "",
          authorId,
          authorName,
          tags: post.tags || [],
          likes: post.likes || [],
          bookmarks: post.bookmarks || [],
          comments: post.comments || [],
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      } catch (err) {
        console.error("Error processing post:", err, post);
        // Return a minimal valid post object to prevent rendering errors
        return {
          id: post._id || "unknown",
          title: post.title || "Error loading post",
          content: post.content || "",
          summary: "Error loading post details",
          authorId: "",
          authorName: "Unknown",
          tags: [],
          likes: [],
          bookmarks: [],
          comments: [],
          createdAt: post.createdAt || new Date().toISOString(),
          updatedAt: post.updatedAt || new Date().toISOString(),
        };
      }
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// Fetch a single post by ID
export async function fetchPostById(id: string): Promise<Post | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/post/${id}`);

    if (!response.ok) {
      return null;
    }

    const post = await response.json();
    return {
      id: post._id,
      title: post.title,
      content: post.content,
      summary: post.content.substring(0, 150),
      authorId: post.author,
      authorName: post.authorName || "Unknown Author",
      tags: post.tags || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    return null;
  }
}

// Create a new post
export async function createPost(
  data: PostFormData,
  authorId: string,
  authorName: string
): Promise<Post> {
  const token = localStorage.getItem("midnight-musings-token");

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/create-post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: data.title,
        content: data.content,
        id: authorId,
        tags: data.tags, // If your API supports tags
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create post");
    }

    const result = await response.json();
    return {
      id: result.post._id,
      title: result.post.title,
      content: result.post.content,
      summary: result.post.content.substring(0, 150),
      authorId: result.post.author,
      authorName: authorName,
      tags: data.tags || [],
      createdAt: result.post.createdAt,
      updatedAt: result.post.updatedAt,
    };
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

// Update an existing post
export async function updatePost(
  postId: string,
  data: PostFormData
): Promise<Post | null> {
  const token = localStorage.getItem("midnight-musings-token");

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/update-post/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: data.title,
        content: data.content,
        // tags: data.tags // If your API supports tags
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update post");
    }

    const result = await response.json();
    return {
      id: result.post._id,
      title: result.post.title,
      content: result.post.content,
      summary: result.post.content.substring(0, 150),
      authorId: result.post.author,
      authorName: "", // You may need to fetch author name separately
      tags: data.tags || [],
      createdAt: result.post.createdAt,
      updatedAt: result.post.updatedAt,
    };
  } catch (error) {
    console.error("Error updating post:", error);
    return null;
  }
}

// Delete a post
export async function deletePost(postId: string): Promise<boolean> {
  const token = localStorage.getItem("midnight-musings-token");

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/delete-post/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete post");
    }

    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}

// Fetch posts by user ID
export async function fetchUserPosts(userId: string): Promise<Post[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/getmypost/${userId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch user posts");
    }

    return data.posts.map((post: any) => ({
      id: post._id,
      title: post.title,
      content: post.content,
      summary: post.content.substring(0, 150),
      authorId: post.author,
      authorName: post.authorName || "Unknown Author",
      tags: post.tags || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
}
