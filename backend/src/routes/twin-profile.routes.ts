import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { twinProfileService } from '../services/twin-profile.service';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/twin-profile/create
 * @desc    Create a new twin profile
 * @access  Private
 */
router.post(
  '/create',
  [
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
    body('gender').isString().notEmpty().withMessage('Gender is required'),
    body('twinType').isIn(['identical', 'fraternal', 'other']).withMessage('Valid twin type is required'),
    body('birthDate').isString().notEmpty().withMessage('Birth date is required'),
    body('accentColor').optional().isString(),
    body('sexualOrientation').optional().isString(),
    body('showSexualOrientation').optional().isBoolean(),
    body('otherTwinTypeDescription').optional().isString(),
    body('twinDeceased').optional().isBoolean(),
    body('zodiacSign').optional().isString(),
    body('placeOfBirth').optional().isString(),
    body('timeOfBirth').optional().isString(),
    body('profilePicture').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Verify user is creating their own profile
      if (req.user!.userId !== req.body.userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only create your own profile',
        });
      }

      const profile = await twinProfileService.createProfile(req.body);

      res.status(201).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error('Error in create twin profile route:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create twin profile',
      });
    }
  }
);

/**
 * @route   GET /api/twin-profile/:userId
 * @desc    Get twin profile by user ID
 * @access  Private
 */
router.get(
  '/:userId',
  [param('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const profile = await twinProfileService.getProfile(req.params.userId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error('Error in get twin profile route:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Twin profile not found',
      });
    }
  }
);

/**
 * @route   PUT /api/twin-profile/:userId
 * @desc    Update twin profile
 * @access  Private
 */
router.put(
  '/:userId',
  [
    param('userId').isString().notEmpty().withMessage('User ID is required'),
    body('name').optional().isString(),
    body('age').optional().isInt({ min: 0, max: 150 }),
    body('gender').optional().isString(),
    body('twinType').optional().isIn(['identical', 'fraternal', 'other']),
    body('birthDate').optional().isString(),
    body('accentColor').optional().isString(),
    body('sexualOrientation').optional().isString(),
    body('showSexualOrientation').optional().isBoolean(),
    body('otherTwinTypeDescription').optional().isString(),
    body('twinDeceased').optional().isBoolean(),
    body('zodiacSign').optional().isString(),
    body('placeOfBirth').optional().isString(),
    body('timeOfBirth').optional().isString(),
    body('profilePicture').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Verify user is updating their own profile
      if (req.user!.userId !== req.params.userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only update your own profile',
        });
      }

      const profile = await twinProfileService.updateProfile(
        req.params.userId,
        req.body
      );

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error('Error in update twin profile route:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update twin profile',
      });
    }
  }
);

/**
 * @route   DELETE /api/twin-profile/:userId
 * @desc    Delete twin profile
 * @access  Private
 */
router.delete(
  '/:userId',
  [param('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Verify user is deleting their own profile
      if (req.user!.userId !== req.params.userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own profile',
        });
      }

      await twinProfileService.deleteProfile(req.params.userId);

      res.json({
        success: true,
        message: 'Twin profile deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error in delete twin profile route:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete twin profile',
      });
    }
  }
);

/**
 * @route   GET /api/twin-profile/twin/:twinPairId
 * @desc    Get twin's profile by twin pair ID
 * @access  Private
 */
router.get(
  '/twin/:twinPairId',
  [param('twinPairId').isString().notEmpty().withMessage('Twin pair ID is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const twinProfile = await twinProfileService.getTwinProfileByPairId(
        req.params.twinPairId,
        req.user!.userId
      );

      res.json({
        success: true,
        data: twinProfile,
      });
    } catch (error: any) {
      logger.error('Error in get twin profile by pair ID route:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Twin profile not found',
      });
    }
  }
);

export const twinProfileRoutes = router;
