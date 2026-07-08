import { prisma } from '../server';
import { logger } from '../utils/logger';

export interface CreateTwinProfileData {
  userId: string;
  name: string;
  age: number;
  gender: string;
  sexualOrientation?: string;
  showSexualOrientation?: boolean;
  twinType: 'identical' | 'fraternal' | 'other';
  otherTwinTypeDescription?: string;
  twinDeceased?: boolean;
  birthDate: string;
  zodiacSign?: string;
  placeOfBirth?: string;
  timeOfBirth?: string;
  profilePicture?: string;
  accentColor?: string;
}

export interface UpdateTwinProfileData {
  name?: string;
  age?: number;
  gender?: string;
  sexualOrientation?: string;
  showSexualOrientation?: boolean;
  twinType?: 'identical' | 'fraternal' | 'other';
  otherTwinTypeDescription?: string;
  twinDeceased?: boolean;
  birthDate?: string;
  zodiacSign?: string;
  placeOfBirth?: string;
  timeOfBirth?: string;
  profilePicture?: string;
  accentColor?: string;
}

class TwinProfileService {
  async createProfile(data: CreateTwinProfileData) {
    try {
      // Check if profile already exists
      const existingProfile = await prisma.twinProfile.findUnique({
        where: { userId: data.userId },
      });

      if (existingProfile) {
        throw new Error('Twin profile already exists for this user');
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create twin profile
      const profile = await prisma.twinProfile.create({
        data: {
          userId: data.userId,
          name: data.name,
          age: data.age,
          gender: data.gender,
          sexualOrientation: data.sexualOrientation,
          showSexualOrientation: data.showSexualOrientation ?? false,
          twinType: data.twinType,
          otherTwinTypeDescription: data.otherTwinTypeDescription,
          twinDeceased: data.twinDeceased ?? false,
          birthDate: data.birthDate,
          zodiacSign: data.zodiacSign,
          placeOfBirth: data.placeOfBirth,
          timeOfBirth: data.timeOfBirth,
          profilePicture: data.profilePicture,
          accentColor: data.accentColor || 'neon-purple',
        },
      });

      logger.info(`Twin profile created for user: ${data.userId}`);
      return profile;
    } catch (error) {
      logger.error('Error creating twin profile:', error);
      throw error;
    }
  }

  async getProfile(userId: string) {
    try {
      const profile = await prisma.twinProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new Error('Twin profile not found');
      }

      return profile;
    } catch (error) {
      logger.error('Error fetching twin profile:', error);
      throw error;
    }
  }

  async getProfileById(profileId: string) {
    try {
      const profile = await prisma.twinProfile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error('Twin profile not found');
      }

      return profile;
    } catch (error) {
      logger.error('Error fetching twin profile by ID:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, data: UpdateTwinProfileData) {
    try {
      // Check if profile exists
      const existingProfile = await prisma.twinProfile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        throw new Error('Twin profile not found');
      }

      // Update profile
      const updatedProfile = await prisma.twinProfile.update({
        where: { userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.age && { age: data.age }),
          ...(data.gender && { gender: data.gender }),
          ...(data.sexualOrientation !== undefined && { sexualOrientation: data.sexualOrientation }),
          ...(data.showSexualOrientation !== undefined && { showSexualOrientation: data.showSexualOrientation }),
          ...(data.twinType && { twinType: data.twinType }),
          ...(data.otherTwinTypeDescription !== undefined && { otherTwinTypeDescription: data.otherTwinTypeDescription }),
          ...(data.twinDeceased !== undefined && { twinDeceased: data.twinDeceased }),
          ...(data.birthDate && { birthDate: data.birthDate }),
          ...(data.zodiacSign !== undefined && { zodiacSign: data.zodiacSign }),
          ...(data.placeOfBirth !== undefined && { placeOfBirth: data.placeOfBirth }),
          ...(data.timeOfBirth !== undefined && { timeOfBirth: data.timeOfBirth }),
          ...(data.profilePicture !== undefined && { profilePicture: data.profilePicture }),
          ...(data.accentColor && { accentColor: data.accentColor }),
        },
      });

      logger.info(`Twin profile updated for user: ${userId}`);
      return updatedProfile;
    } catch (error) {
      logger.error('Error updating twin profile:', error);
      throw error;
    }
  }

  async deleteProfile(userId: string) {
    try {
      await prisma.twinProfile.delete({
        where: { userId },
      });

      logger.info(`Twin profile deleted for user: ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting twin profile:', error);
      throw error;
    }
  }

  async getTwinProfileByPairId(twinPairId: string, currentUserId: string) {
    try {
      // Get the twin pair to find the twin's user ID
      const twinPair = await prisma.twinPair.findUnique({
        where: { id: twinPairId },
      });

      if (!twinPair) {
        throw new Error('Twin pair not found');
      }

      // Determine which user is the twin (not the current user)
      const twinUserId = twinPair.user1Id === currentUserId
        ? twinPair.user2Id
        : twinPair.user1Id;

      // Get the twin's profile
      const twinProfile = await prisma.twinProfile.findUnique({
        where: { userId: twinUserId },
      });

      if (!twinProfile) {
        throw new Error('Twin profile not found');
      }

      return twinProfile;
    } catch (error) {
      logger.error('Error fetching twin profile by pair ID:', error);
      throw error;
    }
  }
}

export const twinProfileService = new TwinProfileService();
