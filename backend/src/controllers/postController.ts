// src/controllers/postController.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export const getAllPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true }, // Only fetch published posts for public view
      include: { author: { select: { username: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getPostById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { username: true, email: true } },
        comments: {
          include: { author: { select: { username: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post || (!post.published && req.user?.role !== 'AUTHOR')) {
      return res.status(404).json({ message: 'Post not found or not published.' });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  const { title, content, published } = req.body;
  const authorId = req.user?.id; // Get author ID from authenticated user

  if (!authorId) {
    return res.status(401).json({ message: 'Unauthorized: User not found.' });
  }
  if (req.user?.role !== 'AUTHOR') {
    return res.status(403).json({ message: 'Forbidden: Only authors can create posts.' });
  }
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published: published ?? false, // Default to false if not provided
        authorId,
      },
    });
    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, published } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User not found.' });
  }
  if (req.user?.role !== 'AUTHOR') {
    return res.status(403).json({ message: 'Forbidden: Only authors can update posts.' });
  }

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Ensure only the author can update their own post
    if (existingPost.authorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own posts.' });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: title ?? existingPost.title,
        content: content ?? existingPost.content,
        published: published ?? existingPost.published,
      },
    });
    res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User not found.' });
  }
  if (req.user?.role !== 'AUTHOR') {
    return res.status(403).json({ message: 'Forbidden: Only authors can delete posts.' });
  }

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Ensure only the author can delete their own post
    if (existingPost.authorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own posts.' });
    }

    await prisma.post.delete({
      where: { id },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};