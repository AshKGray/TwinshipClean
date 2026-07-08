import { Router, Request, Response } from 'express';
import { messageService } from '../services/messageService';
import { messageQueueService } from '../services/messageQueueService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { query, param } from 'express-validator';

const router = Router();

// Apply authentication to all message routes
router.use(authenticateToken);

/**
 * GET /api/messages/:twinPairId/history
 * Get message history with pagination
 */
router.get('/:twinPairId/history',
  [
    param('twinPairId').isUUID().withMessage('Invalid twin pair ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('before').optional().isISO8601().withMessage('Before must be a valid ISO date'),
    query('after').optional().isISO8601().withMessage('After must be a valid ISO date'),
    query('messageType').optional().isIn(['text', 'image', 'voice', 'reaction']).withMessage('Invalid message type'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { twinPairId } = req.params;
      const { limit, offset, before, after, messageType } = req.query;

      // TODO: Verify user has access to this twin pair

      const history = await messageService.getMessageHistory({
        twinPairId,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        before: before ? new Date(before) : undefined,
        after: after ? new Date(after) : undefined,
        messageType: messageType,
      });

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('Error getting message history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve message history',
      });
    }
  }
);

/**
 * GET /api/messages/undelivered
 * Get undelivered messages for the authenticated user
 */
router.get('/undelivered',
  [
    query('twinPairId').optional().isUUID().withMessage('Invalid twin pair ID'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { twinPairId } = req.query;
      const userId = req.user.id; // From auth middleware

      const messages = await messageService.getUndeliveredMessages(userId, twinPairId);

      res.json({
        success: true,
        data: {
          messages,
          count: messages.length,
        },
      });
    } catch (error) {
      console.error('Error getting undelivered messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve undelivered messages',
      });
    }
  }
);

/**
 * POST /api/messages/:messageId/read
 * Mark message as read
 */
router.post('/:messageId/read',
  [
    param('messageId').isUUID().withMessage('Invalid message ID'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;

      // TODO: Verify user is the recipient of this message

      await messageService.markAsRead(messageId);

      res.json({
        success: true,
        message: 'Message marked as read',
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark message as read',
      });
    }
  }
);

/**
 * POST /api/messages/:messageId/delivered
 * Mark message as delivered
 */
router.post('/:messageId/delivered',
  [
    param('messageId').isUUID().withMessage('Invalid message ID'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;

      // TODO: Verify user is the recipient of this message

      await messageService.markAsDelivered(messageId);

      res.json({
        success: true,
        message: 'Message marked as delivered',
      });
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark message as delivered',
      });
    }
  }
);

/**
 * POST /api/messages/:messageId/reactions
 * Add reaction to message
 */
router.post('/:messageId/reactions',
  [
    param('messageId').isUUID().withMessage('Invalid message ID'),
    query('emoji').isLength({ min: 1, max: 10 }).withMessage('Emoji is required and must be 1-10 characters'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user.id;

      await messageService.addReaction(messageId, userId, emoji);

      res.json({
        success: true,
        message: 'Reaction added',
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add reaction',
      });
    }
  }
);

/**
 * DELETE /api/messages/:messageId/reactions
 * Remove reaction from message
 */
router.delete('/:messageId/reactions',
  [
    param('messageId').isUUID().withMessage('Invalid message ID'),
    query('emoji').isLength({ min: 1, max: 10 }).withMessage('Emoji is required and must be 1-10 characters'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.query;
      const userId = req.user.id;

      await messageService.removeReaction(messageId, userId, emoji as string);

      res.json({
        success: true,
        message: 'Reaction removed',
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove reaction',
      });
    }
  }
);

/**
 * GET /api/messages/queue/stats/:twinPairId
 * Get message queue statistics for a twin pair
 */
router.get('/queue/stats/:twinPairId',
  [
    param('twinPairId').isUUID().withMessage('Invalid twin pair ID'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { twinPairId } = req.params;

      // TODO: Verify user has access to this twin pair

      const stats = await messageQueueService.getQueueStats(twinPairId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting queue stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve queue statistics',
      });
    }
  }
);

export { router as messageRoutes };