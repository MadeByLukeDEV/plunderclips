// prisma/cleanup.ts
// Run ONLY after:
//   1. migrate.ts completed successfully
//   2. All API routes updated to use new schema
//   3. App tested and working in production
//
// This drops the old columns that were migrated to new tables.
// There is NO undo — make sure you have a DB backup first.
//
// Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/cleanup.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function confirm() {
  // Safety check — verify new tables have data before dropping old columns
  const [liveCount, statsCount, modCount] = await Promise.all([
    prisma.userLiveStatus.count(),
    prisma.clipStats.count(),
    prisma.clipModeration.count(),
  ]);

  if (liveCount === 0 || statsCount === 0 || modCount === 0) {
    console.error('❌ New tables appear empty. Run migrate.ts first.');
    process.exit(1);
  }

  console.log(`✅ New tables have data — safe to clean up old columns`);
  console.log(`   user_live_status: ${liveCount} rows`);
  console.log(`   clip_stats: ${statsCount} rows`);
  console.log(`   clip_moderation: ${modCount} rows\n`);
}

async function dropOldUserColumns() {
  console.log('Dropping old user columns...');
  await prisma.$executeRaw`
    ALTER TABLE users
      DROP COLUMN IF EXISTS isLive,
      DROP COLUMN IF EXISTS streamTitle,
      DROP COLUMN IF EXISTS viewerCount,
      DROP COLUMN IF EXISTS streamGame,
      DROP COLUMN IF EXISTS liveUpdatedAt,
      DROP COLUMN IF EXISTS youtubeChannelId,
      DROP COLUMN IF EXISTS youtubeChannelName,
      DROP COLUMN IF EXISTS medalUserId,
      DROP COLUMN IF EXISTS medalUsername
  `;
  console.log('✅ Old user columns dropped');
}

async function dropOldClipColumns() {
  console.log('Dropping old clip columns...');
  await prisma.$executeRaw`
    ALTER TABLE clips
      DROP COLUMN IF EXISTS status,
      DROP COLUMN IF EXISTS reviewedAt,
      DROP COLUMN IF EXISTS reviewedBy,
      DROP COLUMN IF EXISTS reviewNotes,
      DROP COLUMN IF EXISTS viewCount
  `;
  console.log('✅ Old clip columns dropped');
}

async function main() {
  console.log('\n🏴‍☠️  PlunderClips — Post-Migration Cleanup\n');
  console.log('⚠️  This will permanently drop old columns.');
  console.log('⚠️  Ensure you have a DB backup before proceeding.\n');

  await confirm();
  await dropOldUserColumns();
  await dropOldClipColumns();

  console.log('\n✅ Cleanup complete. Run prisma db push to sync the schema.\n');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('❌ Cleanup failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});