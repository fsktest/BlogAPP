"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  PenLine,
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Tag,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

// API base URL
const API_BASE_URL = "https://blogapp-62q1.onrender.com";

type PostFormData = {
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  coverImage?: string;
};

export default function CreatePostPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    content: "",
    summary: "",
    tags: [],
    coverImage: "",
  });

  const [currentTag, setCurrentTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Move the redirect logic to useEffect
  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      router.push("/login");
    }
  }, [user, router]);

  useEffect(() => {
    setCharCount(formData.content.length);
  }, [formData.content]);

  // If user is not authenticated, render nothing during the redirect
  if (!user) {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    if (formData.tags.includes(currentTag.trim())) {
      toast({
        title: "Tag exists",
        description: "This tag has already been added",
        variant: "default",
      });
      return;
    }
    if (formData.tags.length >= 5) {
      toast({
        title: "Tag limit reached",
        description: "You can add a maximum of 5 tags",
        variant: "default",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, currentTag.trim()],
    }));
    setCurrentTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const generatePreview = () => {
    const paragraphs = formData.content.split("\n").map((paragraph, i) =>
      paragraph ? (
        <p key={i} className="mb-4">
          {paragraph}
        </p>
      ) : (
        <br key={i} />
      )
    );

    return (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {formData.coverImage && (
          <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
            <img
              src={formData.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold mb-4">
          {formData.title || "Untitled Post"}
        </h1>
        {formData.summary && (
          <p className="text-lg text-muted-foreground mb-6">
            {formData.summary}
          </p>
        )}
        <div className="mb-6">
          {formData.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="mr-2 mb-2">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-8">{paragraphs}</div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Missing content",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content,
        summary: formData.summary?.trim() || formData.content.substring(0, 150),
        tags: formData.tags,
        coverImage: formData.coverImage || null,
        id: user?.id,
      };

      const response = await fetch(`${API_BASE_URL}/create-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create post");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: "Your post has been published",
        variant: "success",
      });

      // Navigate to the new post
      router.push(`/posts/${data.post._id}`);
    } catch (err) {
      console.error("Error creating post:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create New Post</h1>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            {previewMode ? (
              <>
                Edit
                <PenLine className="h-4 w-4" />
              </>
            ) : (
              <>
                Preview
                <ExternalLink className="h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2"
          >
            {submitting ? "Publishing..." : "Publish"}
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {previewMode ? (
          <Card className="p-6 bg-card/50 border shadow-sm">
            {generatePreview()}
          </Card>
        ) : (
          <>
            <TabsContent value="content">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Post Content</CardTitle>
                  <CardDescription>
                    Write your post content below
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base">
                      Title
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter an engaging title..."
                      className="text-lg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="content" className="text-base">
                        Content
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {charCount} characters
                      </span>
                    </div>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Share your thoughts, ideas, and insights..."
                      className="min-h-[300px] text-base resize-y"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Post Settings</CardTitle>
                  <CardDescription>
                    Configure additional options for your post
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      name="summary"
                      value={formData.summary}
                      onChange={handleChange}
                      placeholder="Brief summary of your post (optional)"
                      className="h-24 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      A short summary will appear in post previews. If left empty,
                      the beginning of your post will be used.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverImage">Cover Image</Label>
                    <div className="flex gap-2">
                      <Input
                        id="coverImage"
                        name="coverImage"
                        value={formData.coverImage}
                        onChange={handleChange}
                        placeholder="Paste an image URL (optional)"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="flex gap-1"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Upload
                      </Button>
                    </div>

                    {formData.coverImage && (
                      <div className="mt-2 relative rounded-md overflow-hidden border h-40">
                        <img
                          src={formData.coverImage}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/600x400?text=Image+Not+Found";
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, coverImage: "" }))
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Tags (up to 5)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tag-input"
                        placeholder="Add a tag"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddTag}
                        disabled={!currentTag.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="pl-2 flex items-center gap-1"
                        >
                          <Tag size={12} className="opacity-70" />
                          {tag}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 px-1"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <X size={14} />
                          </Button>
                        </Badge>
                      ))}
                      {formData.tags.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No tags added yet
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
