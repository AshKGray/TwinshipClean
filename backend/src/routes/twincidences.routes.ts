import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { twincidencesService } from '../services/twincidences.service';
import { consentService } from '../services/consent.service';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/twincidences/create
 * @desc    Create a new twincidence (manual entry)
 * @access  Private
 */
router.post(
  '/create',
  [
    body('twinPairId').isString().notEmpty(),
    body('title').isString().notEmpty().trim(),
    body('description').isString().notEmpty().trim(),
    body('photos').optional().isArray(),
    body('isSpecial').optional().isBoolean(),
    body('severity').optional().isIn(['low', 'medium', 'high']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const twincidence = await twincidencesService.createTwincidence({
        twinPairId: req.body.twinPairId,
        createdBy: req.user!.userId,
        title: req.body.title,
        description: req.body.description,
        photos: req.body.photos,
        eventType: 'manual',
        detectionMethod: 'user_reported',
        isSpecial: req.body.isSpecial,
        severity: req.body.severity,
      });

      res.status(201).json({ success: true, data: twincidence });
    } catch (error: any) {
      logger.error('Error creating twincidence:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   GET /api/twincidences/:twinPairId
 * @desc    Get all twincidences for a twin pair
 * @access  Private
 */
router.get(
  '/:twinPairId',
  [param('twinPairId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const twincidences = await twincidencesService.getTwincidences(
        req.params.twinPairId,
        req.user!.userId
      );

      res.json({ success: true, data: twincidences });
    } catch (error: any) {
      logger.error('Error fetching twincidences:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   GET /api/twincidences/detail/:id
 * @desc    Get a specific twincidence
 * @access  Private
 */
router.get(
  '/detail/:id',
  [param('id').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const twincidence = await twincidencesService.getTwincidence(
        req.params.id,
        req.user!.userId
      );

      res.json({ success: true, data: twincidence });
    } catch (error: any) {
      logger.error('Error fetching twincidence:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   PUT /api/twincidences/:id
 * @desc    Update a twincidence
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isString().notEmpty(),
    body('title').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('photos').optional().isArray(),
    body('isSpecial').optional().isBoolean(),
    body('severity').optional().isIn(['low', 'medium', 'high']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const updated = await twincidencesService.updateTwincidence(
        req.params.id,
        req.user!.userId,
        req.body
      );

      res.json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Error updating twincidence:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/twincidences/:id
 * @desc    Delete a twincidence (soft delete)
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      await twincidencesService.deleteTwincidence(
        req.params.id,
        req.user!.userId
      );

      res.json({ success: true, message: 'Twincidence deleted' });
    } catch (error: any) {
      logger.error('Error deleting twincidence:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   POST /api/twincidences/detect/twintuition
 * @desc    Record a twintuition button press
 * @access  Private
 */
router.post(
  '/detect/twintuition',
  [
    body('twinPairId').isString().notEmpty(),
    body('pressTime').isISO8601().toDate(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const result = await twincidencesService.recordTwintuitionPress({
        userId: req.user!.userId,
        twinPairId: req.body.twinPairId,
        pressTime: req.body.pressTime,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Error recording twintuition press:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   GET /api/twincidences/export/:userId
 * @desc    Export all twincidences for a user as JSON
 * @access  Private
 */
router.get(
  '/export/:userId',
  [param('userId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Verify user is exporting their own data
      if (req.user!.userId !== req.params.userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only export your own data',
        });
      }

      const data = await twincidencesService.exportTwincidences(
        req.params.userId
      );

      res.json({ success: true, data, exportedAt: new Date() });
    } catch (error: any) {
      logger.error('Error exporting twincidences:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/twincidences/delete-all/:userId
 * @desc    Delete all twincidences for a user
 * @access  Private
 */
router.delete(
  '/delete-all/:userId',
  [param('userId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Verify user is deleting their own data
      if (req.user!.userId !== req.params.userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own data',
        });
      }

      const result = await twincidencesService.deleteAllTwincidences(
        req.params.userId
      );

      res.json({
        success: true,
        message: `Deleted ${result.count} twincidences`,
        count: result.count,
      });
    } catch (error: any) {
      logger.error('Error deleting all twincidences:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ============================================
// CONSENT ROUTES
// ============================================

/**
 * @route   GET /api/twincidences/consent/:userId
 * @desc    Get all consent preferences for a user
 * @access  Private
 */
router.get(
  '/consent/:userId',
  [param('userId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Verify user is accessing their own consent
      if (req.user!.userId !== req.params.userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only access your own consent preferences',
        });
      }

      const consents = await consentService.getUserConsents(req.params.userId);

      res.json({ success: true, data: consents });
    } catch (error: any) {
      logger.error('Error fetching consents:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   POST /api/twincidences/consent
 * @desc    Set or update consent for an event type
 * @access  Private
 */
router.post(
  '/consent',
  [
    body('eventType').isString().notEmpty(),
    body('consentLevel').isIn(['A', 'B', 'C']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const consent = await consentService.setConsent({
        userId: req.user!.userId,
        eventType: req.body.eventType,
        consentLevel: req.body.consentLevel,
      });

      res.json({ success: true, data: consent });
    } catch (error: any) {
      logger.error('Error setting consent:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/twincidences/consent/:eventType
 * @desc    Revoke consent for an event type
 * @access  Private
 */
router.delete(
  '/consent/:eventType',
  [param('eventType').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      await consentService.revokeConsent(
        req.user!.userId,
        req.params.eventType
      );

      res.json({ success: true, message: 'Consent revoked' });
    } catch (error: any) {
      logger.error('Error revoking consent:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   POST /api/twincidences/consent/pause-all
 * @desc    Pause all detection (set all consents to C)
 * @access  Private
 */
router.post('/consent/pause-all', async (req: Request, res: Response) => {
  try {
    const result = await consentService.pauseAllDetection(req.user!.userId);

    res.json({
      success: true,
      message: 'All detection paused',
      pausedCount: result.pausedCount,
    });
  } catch (error: any) {
    logger.error('Error pausing detection:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/twincidences/consent/resume
 * @desc    Resume detection (restore previous consent levels)
 * @access  Private
 */
router.post('/consent/resume', async (req: Request, res: Response) => {
  try {
    const result = await consentService.resumeDetection(req.user!.userId);

    res.json({
      success: true,
      message: 'Detection resumed',
      resumedCount: result.resumedCount,
    });
  } catch (error: any) {
    logger.error('Error resuming detection:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/twincidences/consent/stats
 * @desc    Get consent statistics for the user
 * @access  Private
 */
router.get('/consent/stats', async (req: Request, res: Response) => {
  try {
    const stats = await consentService.getConsentStats(req.user!.userId);

    res.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('Error fetching consent stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/twincidences/consent/history
 * @desc    Export consent history for audit/transparency
 * @access  Private
 */
router.get('/consent/history', async (req: Request, res: Response) => {
  try {
    const history = await consentService.exportConsentHistory(req.user!.userId);

    res.json({ success: true, data: history });
  } catch (error: any) {
    logger.error('Error exporting consent history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export const twincidencesRoutes = router;
