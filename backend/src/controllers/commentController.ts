// src/controllers/commentController.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export const createComment = async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;
  const { content } = req.body;
  const authorId = req.user?.id; // Get author ID from authenticated user

  if (!authorId) {
    return res.status(401).json({ message: 'Unauthorized: User not found.' });
  }
  if (!content) {
    return res.status(400).json({ message: 'Comment content is required.' });
  }

  try {
    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId,
      },
    });
    res.status(201).json({ message: 'Comment created successfully', comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getCommentsForPost = async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { username: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments for post:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params; // Comment ID
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User not found.' });
  }

  try {
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Only the comment author or an "AUTHOR" role can delete a comment
    if (existingComment.authorId !== userId && req.user?.role !== 'AUTHOR') {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own comments or you need to be an author.' });
    }

    await prisma.comment.delete({
      where: { id },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};