"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagInput from "./TagInput";
import type { Post, PostFormData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Save, Loader2 } from "lucide-react";

const blogPostSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }).max(100, { message: "Title must be 100 characters or less."}),
  content: z.string().min(20, { message: "Content must be at least 20 characters." }),
  tags: z.array(z.string()).min(1, { message: "At least one tag is required." }),
});

type BlogPostFormProps = {
  onSubmit: (values: PostFormData) => Promise<void>;
  initialData?: Post;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
};

export default function BlogPostForm({ onSubmit, initialData, isSubmitting, mode }: BlogPostFormProps) {
  const form = useForm<PostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      tags: initialData?.tags || [],
    },
  });

  const getBlogContentForAISuggestion = () => {
    return form.getValues("content");
  };

  const handleSubmit = (values: PostFormData) => {
    onSubmit(values);
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl text-primary">
          {mode === 'create' ? 'Craft a New Musing' : 'Refine Your Musing'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="The title of your masterpiece..." {...field} className="text-base"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Pour your thoughts here..."
                      {...field}
                      rows={15}
                      className="text-base min-h-[300px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Tags</FormLabel>
                  <FormControl>
                    <TagInput 
                      value={field.value} 
                      onChange={field.onChange} 
                      getBlogContentForAISuggestion={getBlogContentForAISuggestion}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  {mode === 'create' ? 'Publish Musing' : 'Save Changes'}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
