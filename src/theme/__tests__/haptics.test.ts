/**
 * Haptic System Tests
 * Story 6.7: Haptic Feedback System
 */

import * as Haptics from 'expo-haptics';
import {
  triggerHaptic,
  isHapticsAvailable,
  setupHaptics,
  resetHaptics,
} from '../haptics';

jest.mock('expo-haptics');

describe('Haptics System', () => {
  beforeEach(() => {
    resetHaptics();
    jest.clearAllMocks();
  });

  describe('isHapticsAvailable', () => {
    it('returns true when haptics are supported', async () => {
      jest.spyOn(Haptics, 'selectionAsync').mockResolvedValue();

      const available = await isHapticsAvailable();
      expect(available).toBe(true);
    });

    it('returns false when haptics are not supported', async () => {
      jest.spyOn(Haptics, 'selectionAsync').mockRejectedValue(new Error());

      const available = await isHapticsAvailable();
      expect(available).toBe(false);
    });

    it('caches result for subsequent calls', async () => {
      const spy = jest.spyOn(Haptics, 'selectionAsync').mockResolvedValue();

      await isHapticsAvailable();
      await isHapticsAvailable();
      await isHapticsAvailable();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('triggerHaptic', () => {
    beforeEach(async () => {
      jest.spyOn(Haptics, 'selectionAsync').mockResolvedValue();
      await setupHaptics();
    });

    it('triggers light impact haptic', async () => {
      const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

      await triggerHaptic('light');
      expect(spy).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('triggers medium impact haptic', async () => {
      const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

      await triggerHaptic('medium');
      expect(spy).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('triggers heavy impact haptic', async () => {
      const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

      await triggerHaptic('heavy');
      expect(spy).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('triggers success notification haptic', async () => {
      const spy = jest.spyOn(Haptics, 'notificationAsync').mockResolvedValue();

      await triggerHaptic('success');
      expect(spy).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('triggers selection haptic', async () => {
      const spy = jest.spyOn(Haptics, 'selectionAsync').mockResolvedValue();

      await triggerHaptic('selection');
      expect(spy).toHaveBeenCalled();
    });

    it('debounces rapid haptic triggers', async () => {
      const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

      await triggerHaptic('medium');
      await triggerHaptic('medium');
      await triggerHaptic('medium');

      // Only first one triggers due to debounce
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('allows haptic after debounce period', async () => {
      const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

      await triggerHaptic('medium');
      await new Promise(resolve => setTimeout(resolve, 60));
      await triggerHaptic('medium');

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('handles errors gracefully', async () => {
      jest.spyOn(Haptics, 'impactAsync').mockRejectedValue(new Error('Haptic failed'));

      await expect(triggerHaptic('medium')).resolves.not.toThrow();
    });

    it('does not trigger haptic on unsupported device', async () => {
      resetHaptics();
      jest.spyOn(Haptics, 'selectionAsync').mockRejectedValue(new Error());
      await setupHaptics();

      const spy = jest.spyOn(Haptics, 'impactAsync');

      await triggerHaptic('medium');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
