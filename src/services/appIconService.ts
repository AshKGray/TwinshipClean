import { NativeModules, Platform } from 'react-native';

interface AppIconManager {
  setAppIcon: (iconName: string) => Promise<boolean>;
  getCurrentIcon: () => Promise<string>;
}

const { AppIconManager } = NativeModules as { AppIconManager: AppIconManager };

export type IconName = 'default' | 'Pink' | 'Blue';

export const appIconService = {
  /**
   * Sets the app icon based on twin type
   * @param iconName - 'default' for mixed twins, 'Pink' for girl/girl, 'Blue' for boy/boy
   */
  setAppIcon: async (iconName: IconName): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      console.warn('App icon switching is only supported on iOS');
      return false;
    }

    if (!AppIconManager) {
      console.warn('AppIconManager native module not available');
      return false;
    }

    try {
      console.log(`Setting app icon to: ${iconName}`);
      await AppIconManager.setAppIcon(iconName);
      return true;
    } catch (error) {
      console.error('Failed to set app icon:', error);
      return false;
    }
  },

  /**
   * Gets the currently active app icon
   */
  getCurrentIcon: async (): Promise<IconName> => {
    if (Platform.OS !== 'ios' || !AppIconManager) {
      return 'default';
    }

    try {
      const currentIcon = await AppIconManager.getCurrentIcon();
      return currentIcon as IconName;
    } catch (error) {
      console.error('Failed to get current icon:', error);
      return 'default';
    }
  },

  /**
   * Sets app icon based on twin types
   * @param userGender - User's gender ('male' | 'female')
   * @param twinGender - Twin's gender ('male' | 'female')
   */
  setIconForTwinType: async (userGender: 'male' | 'female', twinGender: 'male' | 'female'): Promise<boolean> => {
    let iconName: IconName;

    if (userGender === 'female' && twinGender === 'female') {
      // Girl/Girl twins - Pink icon
      iconName = 'Pink';
    } else if (userGender === 'male' && twinGender === 'male') {
      // Boy/Boy twins - Blue icon
      iconName = 'Blue';
    } else {
      // Boy/Girl twins - Default mixed icon
      iconName = 'default';
    }

    return await this.setAppIcon(iconName);
  }
};