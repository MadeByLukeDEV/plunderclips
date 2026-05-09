// prisma/migrate.ts
// Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/migrate.ts
//
// Safe order:
//   1. Creates new tables (prisma db push already did this)
//   2. Migrates data from old columns into new tables
//   3. Verifies row counts match
//   4. Reports anything that failed
//
// This script is IDEMPOTENT — safe to run multiple times.
// It uses upsert everywhere so re-running won't duplicate data.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[migrate] ${msg}`);
}

function warn(msg: string) {
  console.warn(`[migrate] ⚠️  ${msg}`);
}

function ok(msg: string) {
  console.log(`[migrate] ✅ ${msg}`);
}

// ── Step 1: UserLinkedAccount ─────────────────────────────────────────────────
// Move youtubeChannelId/Name + medalUserId/Username from users → user_linked_accounts

async function migrateLinkedAccounts() {
  log('Migrating linked accounts...');

  // Read directly from DB using raw query since old columns may still exist
  const users = await prisma.$queryRaw<any[]>`
    SELECT id, youtubeChannelId, youtubeChannelName
    FROM users
  `;

  let created = 0, skipped = 0;

  for (const user of users) {
    const hasAny = user.youtubeChannelId || user.youtubeChannelName ||
                   user.medalUserId || user.medalUsername;

    if (!hasAny) { skipped++; continue; }

    await prisma.userLinkedAccount.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        youtubeChannelId:   user.youtubeChannelId   || null,
        youtubeChannelName: user.youtubeChannelName || null,
        medalUserId:        user.medalUserId        || null,
        medalUsername:      user.medalUsername      || null,
      },
      update: {
        youtubeChannelId:   user.youtubeChannelId   || null,
        youtubeChannelName: user.youtubeChannelName || null,
        medalUserId:        user.medalUserId        || null,
        medalUsername:      user.medalUsername      || null,
      },
    });
    created++;
  }

  ok(`LinkedAccounts: ${created} migrated, ${skipped} skipped (no linked accounts)`);
  return { created, skipped };
}

// ── Step 2: UserLiveStatus ────────────────────────────────────────────────────
// Move isLive, streamTitle, viewerCount, streamGame, liveUpdatedAt
// from users → user_live_status

async function migrateLiveStatus() {
  log('Migrating live status...');

  const users = await prisma.$queryRaw<any[]>`
    SELECT id, isLive, streamTitle, viewerCount, streamGame, liveUpdatedAt
    FROM users
  `;

  let created = 0;

  for (const user of users) {
    await prisma.userLiveStatus.upsert({
      where: { userId: user.id },
      create: {
        userId:        user.id,
        isLive:        user.isLive        ?? false,
        streamTitle:   user.streamTitle   ?? null,
        viewerCount:   user.viewerCount   ?? null,
        streamGame:    user.streamGame    ?? null,
        liveUpdatedAt: user.liveUpdatedAt ?? null,
      },
      update: {
        isLive:        user.isLive        ?? false,
        streamTitle:   user.streamTitle   ?? null,
        viewerCount:   user.viewerCount   ?? null,
        streamGame:    user.streamGame    ?? null,
        liveUpdatedAt: user.liveUpdatedAt ?? null,
      },
    });
    created++;
  }

  ok(`LiveStatus: ${created} rows migrated`);
  return { created };
}

// ── Step 3: ClipStats ─────────────────────────────────────────────────────────
// Move viewCount from clips → clip_stats

async function migrateClipStats() {
  log('Migrating clip stats...');

  const clips = await prisma.$queryRaw<any[]>`
    SELECT id, viewCount FROM clips
  `;

  let created = 0;

  for (const clip of clips) {
    await prisma.clipStats.upsert({
      where: { clipId: clip.id },
      create: {
        clipId:    clip.id,
        viewCount: clip.viewCount ?? 0,
      },
      update: {
        viewCount: clip.viewCount ?? 0,
      },
    });
    created++;
  }

  ok(`ClipStats: ${created} rows migrated`);
  return { created };
}

// ── Step 4: ClipModeration ────────────────────────────────────────────────────
// Move status, reviewedBy, reviewNotes, reviewedAt from clips → clip_moderation

async function migrateClipModeration() {
  log('Migrating clip moderation...');

  const clips = await prisma.$queryRaw<any[]>`
    SELECT id, status, reviewedBy, reviewNotes, reviewedAt FROM clips
  `;

  let created = 0;

  for (const clip of clips) {
    await prisma.clipModeration.upsert({
      where: { clipId: clip.id },
      create: {
        clipId:      clip.id,
        status:      clip.status      ?? 'PENDING',
        reviewedBy:  clip.reviewedBy  ?? null,
        reviewNotes: clip.reviewNotes ?? null,
        reviewedAt:  clip.reviewedAt  ?? null,
      },
      update: {
        status:      clip.status      ?? 'PENDING',
        reviewedBy:  clip.reviewedBy  ?? null,
        reviewNotes: clip.reviewNotes ?? null,
        reviewedAt:  clip.reviewedAt  ?? null,
      },
    });
    created++;
  }

  ok(`ClipModeration: ${created} rows migrated`);
  return { created };
}

// ── Step 5: Rename platformClipId + sourceUrl ─────────────────────────────────
// twitchClipId → platformClipId
// twitchUrl    → sourceUrl
// These are column renames — handled by prisma db push if you renamed in schema
// This step verifies the data is intact after the rename

async function verifyRenamedColumns() {
  log('Verifying renamed columns (platformClipId, sourceUrl)...');

  const count = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*) as total FROM clips WHERE platformClipId IS NOT NULL
  `;

  const total = Number(count[0]?.total ?? 0);
  if (total > 0) {
    ok(`Renamed columns verified: ${total} clips have platformClipId`);
  } else {
    warn('platformClipId appears empty — check if prisma db push ran before migration');
  }

  return { total };
}

// ── Step 6: Verify row counts ─────────────────────────────────────────────────

async function verifyAll() {
  log('Running verification...');

  const [
    userCount,
    linkedCount,
    liveCount,
    clipCount,
    statsCount,
    moderationCount,
    tagCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userLinkedAccount.count(),
    prisma.userLiveStatus.count(),
    prisma.clip.count(),
    prisma.clipStats.count(),
    prisma.clipModeration.count(),
    prisma.clipTag.count(),
  ]);

  console.log('\n── Verification Summary ─────────────────────────────');
  console.log(`  users:                ${userCount}`);
  console.log(`  user_linked_accounts: ${linkedCount} (subset of users with linked accounts)`);
  console.log(`  user_live_status:     ${liveCount} (should equal ${userCount})`);
  console.log(`  clips:                ${clipCount}`);
  console.log(`  clip_stats:           ${statsCount} (should equal ${clipCount})`);
  console.log(`  clip_moderation:      ${moderationCount} (should equal ${clipCount})`);
  console.log(`  clip_tags:            ${tagCount}`);
  console.log('─────────────────────────────────────────────────────\n');

  const issues: string[] = [];
  if (liveCount !== userCount)       issues.push(`user_live_status count (${liveCount}) ≠ users (${userCount})`);
  if (statsCount !== clipCount)      issues.push(`clip_stats count (${statsCount}) ≠ clips (${clipCount})`);
  if (moderationCount !== clipCount) issues.push(`clip_moderation count (${moderationCount}) ≠ clips (${clipCount})`);

  if (issues.length > 0) {
    issues.forEach(i => warn(i));
  } else {
    ok('All row counts match — migration successful');
  }

  return { issues };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏴‍☠️  PlunderClips — Modular Monolith Migration\n');
  console.log('This script is idempotent — safe to run multiple times.\n');

  try {
    await migrateLinkedAccounts();
    await migrateLiveStatus();
    await migrateClipStats();
    await migrateClipModeration();
    await verifyRenamedColumns();
    await verifyAll();

    console.log('\n✅ Migration complete.\n');
    console.log('Next steps:');
    console.log('  1. Update API routes to use new table structure');
    console.log('  2. Remove old columns from users and clips tables');
    console.log('  3. Deploy and test\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();