// src/routes.ts
import { Router } from 'express';
import * as userController from './controllers/userController';
import * as postController from './controllers/postController';
import * as commentController from './controllers/commentController';
import { authenticateToken } from './middleware/authMiddleware';

const router = Router();

// User routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Post routes
router.get('/posts', postController.getAllPosts);
router.get('/posts/:id', postController.getPostById);
router.post('/posts', authenticateToken, postController.createPost); // Protected
router.put('/posts/:id', authenticateToken, postController.updatePost); // Protected
router.delete('/posts/:id', authenticateToken, postController.deletePost); // Protected

// Comment routes
router.post('/posts/:postId/comments', authenticateToken, commentController.createComment); // Protected
router.get('/posts/:postId/comments', commentController.getCommentsForPost);
router.delete('/comments/:id', authenticateToken, commentController.deleteComment); // Protected

export default router;