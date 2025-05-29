import type { User, Post } from './types';

export const mockUsers: User[] = [
  { id: '1', name: 'Alice Wonderland', email: 'alice@example.com' },
  { id: '2', name: 'Bob The Builder', email: 'bob@example.com' },
];

export let mockPosts: Post[] = [
  {
    id: 'post1',
    title: 'My First Midnight Musing',
    content: 'This is the full content of my first post. It explores the depths of midnight thoughts and the creative process that unfolds in the quiet hours. We delve into various ideas and inspirations that come alive when the world is asleep.',
    summary: 'An exploration of creative thoughts during quiet midnight hours.',
    authorId: '1',
    authorName: 'Alice Wonderland',
    tags: ['creativity', 'midnight', 'thoughts'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post2',
    title: 'The Art of Coding in Darkness',
    content: 'Discover the unique advantages and challenges of coding late into the night. This post covers focus, environment setup, and tips for staying productive. It also touches upon the tools and techniques that can enhance the nocturnal coding experience.',
    summary: 'Tips and tricks for productive late-night coding sessions.',
    authorId: '2',
    authorName: 'Bob The Builder',
    tags: ['coding', 'productivity', 'darkmode'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post3',
    title: 'Navigating the Next.js Universe',
    content: 'A comprehensive guide to Next.js, covering its core features, app router, server components, and best practices for building modern web applications. This includes examples and practical advice for developers of all levels.',
    summary: 'A deep dive into Next.js features and best practices.',
    authorId: '1',
    authorName: 'Alice Wonderland',
    tags: ['nextjs', 'webdev', 'react'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
