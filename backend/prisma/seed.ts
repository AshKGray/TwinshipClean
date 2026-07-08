import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Comprehensive seed script for Twinship backend
 *
 * Environments:
 * - development: Full test data with multiple users and pairs
 * - staging: Realistic production-like data for testing
 * - production: Minimal essential data only
 */

const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Clear all data (development/staging only)
async function clearDatabase() {
  if (ENVIRONMENT === 'production') {
    console.log('⚠️  Skipping database clear in production');
    return;
  }

  console.log('🗑️  Clearing existing data...');

  // Delete in correct order to respect foreign key constraints
  await prisma.messageReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageQueue.deleteMany();
  await prisma.twintuitionAlert.deleteMany();
  await prisma.gameResult.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.twincidence.deleteMany();
  await prisma.twincidenceConsent.deleteMany();
  await prisma.twinProfile.deleteMany();
  await prisma.twinPair.deleteMany();
  await prisma.userPresence.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.researchParticipation.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.loginHistory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.eventTypeCatalog.deleteMany();

  console.log('✅ Database cleared');
}

// Seed event type catalog (all environments)
async function seedEventTypeCatalog() {
  console.log('📋 Seeding event type catalog...');

  const eventTypes = [
    {
      eventType: 'simultaneous_twintuition',
      displayName: 'Twintuition Button Press',
      description: 'Both twins pressed the twintuition button within a close time window',
      icon: 'zap',
      category: 'twintuition',
      detectionEnabled: true,
      requiresHealthKit: false,
      requiresLocation: false,
      thresholds: JSON.stringify({ maxTimeDifferenceMs: 5000 }),
      researchEnabled: true,
      minimumDataPoints: 1,
      isActive: true,
      sortOrder: 1
    },
    {
      eventType: 'hr_sync',
      displayName: 'Heart Rate Synchronization',
      description: 'Heart rates aligned within threshold',
      icon: 'heart',
      category: 'health',
      detectionEnabled: true,
      requiresHealthKit: true,
      requiresLocation: false,
      thresholds: JSON.stringify({ maxBpmDifference: 5, minDurationSeconds: 60 }),
      researchEnabled: true,
      minimumDataPoints: 60,
      isActive: true,
      sortOrder: 2
    },
    {
      eventType: 'sleep_sync',
      displayName: 'Sleep Pattern Synchronization',
      description: 'Sleep start/end times aligned',
      icon: 'moon',
      category: 'health',
      detectionEnabled: true,
      requiresHealthKit: true,
      requiresLocation: false,
      thresholds: JSON.stringify({ maxTimeDifferenceMinutes: 15 }),
      researchEnabled: true,
      minimumDataPoints: 1,
      isActive: true,
      sortOrder: 3
    },
    {
      eventType: 'same_location',
      displayName: 'Same Location Visit',
      description: 'Twins visited the same location at different times',
      icon: 'map-pin',
      category: 'location',
      detectionEnabled: true,
      requiresHealthKit: false,
      requiresLocation: true,
      thresholds: JSON.stringify({ radiusMeters: 100 }),
      researchEnabled: true,
      minimumDataPoints: 1,
      isActive: true,
      sortOrder: 4
    },
    {
      eventType: 'same_song',
      displayName: 'Same Song Playing',
      description: 'Both twins listening to the same song',
      icon: 'music',
      category: 'media',
      detectionEnabled: true,
      requiresHealthKit: false,
      requiresLocation: false,
      thresholds: JSON.stringify({ maxTimeDifferenceHours: 24 }),
      researchEnabled: true,
      minimumDataPoints: 1,
      isActive: true,
      sortOrder: 5
    },
    {
      eventType: 'mood_sync',
      displayName: 'Mood Synchronization',
      description: 'Similar emotional states detected',
      icon: 'smile',
      category: 'emotional',
      detectionEnabled: true,
      requiresHealthKit: false,
      requiresLocation: false,
      thresholds: JSON.stringify({ minSimilarityScore: 0.8 }),
      researchEnabled: true,
      minimumDataPoints: 1,
      isActive: true,
      sortOrder: 6
    },
    {
      eventType: 'manual',
      displayName: 'Manual Entry',
      description: 'User-reported twin moment',
      icon: 'edit',
      category: 'user_reported',
      detectionEnabled: false,
      requiresHealthKit: false,
      requiresLocation: false,
      thresholds: null,
      researchEnabled: true,
      minimumDataPoints: 1,
      isActive: true,
      sortOrder: 10
    }
  ];

  for (const eventType of eventTypes) {
    await prisma.eventTypeCatalog.upsert({
      where: { eventType: eventType.eventType },
      update: eventType,
      create: eventType
    });
  }

  console.log(`✅ Seeded ${eventTypes.length} event types`);
}

// Development seed data
async function seedDevelopment() {
  console.log('🌱 Seeding development data...');

  // Create test twin pair #1: Jordan and Alex (identical twins)
  const passwordHash = await hashPassword('password123');

  const user1 = await prisma.user.create({
    data: {
      email: 'jordan@twinship.test',
      emailNormalized: 'jordan@twinship.test',
      passwordHash,
      emailVerified: true,
      displayName: 'Jordan Rivers',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      createdAt: new Date('2024-01-15T10:00:00Z')
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'alex@twinship.test',
      emailNormalized: 'alex@twinship.test',
      passwordHash,
      emailVerified: true,
      displayName: 'Alex Rivers',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      createdAt: new Date('2024-01-15T10:05:00Z')
    }
  });

  // Create twin pair
  const twinPair1 = await prisma.twinPair.create({
    data: {
      user1Id: user1.id,
      user2Id: user2.id,
      pairingCode: 'TEST123',
      pairedAt: new Date('2024-01-15T11:00:00Z'),
      pairType: 'identical',
      status: 'active'
    }
  });

  // Create twin profiles
  await prisma.twinProfile.create({
    data: {
      userId: user1.id,
      name: 'Jordan',
      age: 28,
      gender: 'non-binary',
      sexualOrientation: 'pansexual',
      showSexualOrientation: true,
      twinType: 'identical',
      birthDate: '1996-03-15',
      zodiacSign: 'Pisces',
      accentColor: 'neon-purple',
      profilePicture: 'https://i.pravatar.cc/300?img=1'
    }
  });

  await prisma.twinProfile.create({
    data: {
      userId: user2.id,
      name: 'Alex',
      age: 28,
      gender: 'male',
      sexualOrientation: 'heterosexual',
      showSexualOrientation: false,
      twinType: 'identical',
      birthDate: '1996-03-15',
      zodiacSign: 'Pisces',
      accentColor: 'neon-cyan',
      profilePicture: 'https://i.pravatar.cc/300?img=2'
    }
  });

  // Create user presence
  await prisma.userPresence.create({
    data: {
      userId: user1.id,
      status: 'online',
      lastSeenAt: new Date()
    }
  });

  await prisma.userPresence.create({
    data: {
      userId: user2.id,
      status: 'online',
      lastSeenAt: new Date()
    }
  });

  // Create research participation
  await prisma.researchParticipation.create({
    data: {
      userId: user1.id,
      hasConsented: true,
      consentedAt: new Date('2024-01-15T11:30:00Z'),
      consentVersion: '1.0',
      hasActiveStudies: true,
      contributionsCount: 5
    }
  });

  // Create sample messages
  const messages = [
    {
      twinPairId: twinPair1.id,
      senderId: user1.id,
      recipientId: user2.id,
      content: 'Hey twin! How are you feeling today?',
      messageType: 'text',
      accentColor: 'neon-purple',
      deliveredAt: new Date('2024-01-20T14:01:00Z'),
      readAt: new Date('2024-01-20T14:02:00Z'),
      createdAt: new Date('2024-01-20T14:00:00Z')
    },
    {
      twinPairId: twinPair1.id,
      senderId: user2.id,
      recipientId: user1.id,
      content: 'Pretty good! Just had the weirdest déjà vu moment...',
      messageType: 'text',
      accentColor: 'neon-cyan',
      deliveredAt: new Date('2024-01-20T14:03:00Z'),
      readAt: new Date('2024-01-20T14:03:30Z'),
      createdAt: new Date('2024-01-20T14:02:30Z')
    },
    {
      twinPairId: twinPair1.id,
      senderId: user1.id,
      recipientId: user2.id,
      content: 'OMG me too! I was literally about to text you about that!',
      messageType: 'text',
      accentColor: 'neon-purple',
      deliveredAt: new Date('2024-01-20T14:04:00Z'),
      readAt: new Date('2024-01-20T14:04:15Z'),
      createdAt: new Date('2024-01-20T14:03:45Z')
    }
  ];

  for (const msgData of messages) {
    await prisma.message.create({ data: msgData });
  }

  // Create sample Twincidences
  await prisma.twincidence.create({
    data: {
      twinPairId: twinPair1.id,
      createdBy: user1.id,
      title: 'Simultaneous Twintuition Alert',
      description: 'We both felt something at the exact same moment!',
      eventType: 'simultaneous_twintuition',
      detectionMethod: 'user_reported',
      user1EventTime: new Date('2024-01-18T15:23:45Z'),
      user2EventTime: new Date('2024-01-18T15:23:47Z'),
      timeDifference: 2000,
      eventData: JSON.stringify({
        intensity: 'high',
        emotion: 'excitement'
      }),
      sharedWithTwin: true,
      user1Consented: true,
      user2Consented: true,
      includedInResearch: true,
      isSpecial: true,
      severity: 'high'
    }
  });

  // Create twincidence consents
  const consentTypes = ['simultaneous_twintuition', 'hr_sync', 'sleep_sync', 'manual'];

  for (const eventType of consentTypes) {
    await prisma.twincidenceConsent.create({
      data: {
        userId: user1.id,
        eventType,
        consentLevel: 'B' // Share with twin
      }
    });

    await prisma.twincidenceConsent.create({
      data: {
        userId: user2.id,
        eventType,
        consentLevel: 'A' // Anonymous research only
      }
    });
  }

  // Create game results
  await prisma.gameResult.create({
    data: {
      userId: user1.id,
      twinPairId: twinPair1.id,
      gameType: 'cognitive_sync_maze',
      score: 85,
      twinScore: 82,
      cognitiveData: JSON.stringify({
        completionTime: 145,
        pathEfficiency: 0.92,
        mistakeCount: 3
      }),
      insights: JSON.stringify([
        'High cognitive synchronization detected',
        'Similar problem-solving approaches'
      ])
    }
  });

  // Create assessment
  await prisma.assessment.create({
    data: {
      userId: user1.id,
      twinPairId: twinPair1.id,
      assessmentType: 'twin_connection',
      responses: JSON.stringify({
        q1: 5,
        q2: 4,
        q3: 5,
        q4: 4
      }),
      results: JSON.stringify({
        overallScore: 92,
        connectionStrength: 'very_strong',
        insights: ['Deep emotional bond', 'Strong telepathic connection']
      }),
      status: 'completed',
      completedAt: new Date('2024-01-16T16:00:00Z')
    }
  });

  // Create test twin pair #2: Sam and Chris (fraternal twins)
  const user3 = await prisma.user.create({
    data: {
      email: 'sam@twinship.test',
      emailNormalized: 'sam@twinship.test',
      passwordHash,
      emailVerified: true,
      displayName: 'Sam Taylor',
      avatarUrl: 'https://i.pravatar.cc/150?img=5'
    }
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'chris@twinship.test',
      emailNormalized: 'chris@twinship.test',
      passwordHash,
      emailVerified: false,
      displayName: 'Chris Taylor',
      avatarUrl: 'https://i.pravatar.cc/150?img=6'
    }
  });

  const twinPair2 = await prisma.twinPair.create({
    data: {
      user1Id: user3.id,
      user2Id: user4.id,
      pairingCode: 'TEST456',
      pairedAt: new Date(),
      pairType: 'fraternal',
      status: 'active'
    }
  });

  // Create pending invitation
  await prisma.invitation.create({
    data: {
      senderId: user1.id,
      invitationCode: 'INVITE789',
      recipientEmail: 'newtwin@example.com',
      recipientName: 'Future Twin',
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  });

  console.log('✅ Development data seeded successfully');
  console.log('\n📊 Test Accounts:');
  console.log('  Jordan: jordan@twinship.test / password123');
  console.log('  Alex:   alex@twinship.test / password123');
  console.log('  Sam:    sam@twinship.test / password123');
  console.log('  Chris:  chris@twinship.test / password123');
}

// Staging seed data
async function seedStaging() {
  console.log('🌱 Seeding staging data...');

  // In staging, use production-like data but with test accounts
  // Reuse development seed but with staging-specific configurations
  await seedDevelopment();

  console.log('✅ Staging data seeded');
}

// Production seed data
async function seedProduction() {
  console.log('🌱 Seeding production data...');

  // Only seed essential configuration data, NO test users
  console.log('⚠️  Production seeding: Only event type catalog');

  // Event types are already seeded by seedEventTypeCatalog()

  console.log('✅ Production data seeded (minimal)');
}

// Main seed function
async function main() {
  console.log(`\n🚀 Starting seed for environment: ${ENVIRONMENT}\n`);

  try {
    // Always seed event type catalog
    await seedEventTypeCatalog();

    // Clear database if not production
    if (ENVIRONMENT !== 'production') {
      await clearDatabase();
    }

    // Seed based on environment
    switch (ENVIRONMENT) {
      case 'production':
        await seedProduction();
        break;
      case 'staging':
        await seedStaging();
        break;
      case 'development':
      default:
        await seedDevelopment();
        break;
    }

    console.log('\n✅ Seed completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
