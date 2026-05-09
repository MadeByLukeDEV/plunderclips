// prisma/migrate_from_sql.ts
//
// Migrates data from old sot_clips DB into new modular plunderclips_v2 schema.
//
// Prerequisites:
//   1. Old DB (sot_clips) still accessible
//   2. New DB (plunderclips_v2) created and prisma db push run against it
//   3. Two env vars set:
//      OLD_DATABASE_URL=mysql://user:pass@host:3306/sot_clips
//      DATABASE_URL=mysql://user:pass@host:3306/plunderclips_v2
//
// Run with:
//   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/migrate_from_sql.ts
//
// Safe to re-run — uses upsert/INSERT IGNORE everywhere.

import { PrismaClient } from '@prisma/client';
import * as mysql from 'mysql2/promise';

// New DB — Prisma client
const newDb = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: ['warn', 'error'],
});

// Old DB — raw MySQL connection (reads only)
async function getOldDb() {
  const url = process.env.OLD_DATABASE_URL;
  if (!url) throw new Error('OLD_DATABASE_URL env var is required');

  // Parse mysql://user:pass@host:port/dbname
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Invalid OLD_DATABASE_URL format');

  return mysql.createConnection({
    host:     match[3],
    port:     parseInt(match[4]),
    user:     match[1],
    password: match[2],
    database: match[5],
  });
}

function log(msg: string)  { console.log(`[migrate] ${msg}`); }
function ok(msg: string)   { console.log(`[migrate] ✅ ${msg}`); }
function warn(msg: string) { console.warn(`[migrate] ⚠️  ${msg}`); }
function info(msg: string) { console.log(`[migrate] ℹ️  ${msg}`); }

// ── Step 1: Users ─────────────────────────────────────────────────────────────
async function migrateUsers(old: mysql.Connection) {
  log('Migrating users...');

  const [rows] = await old.execute<any[]>(`
    SELECT id, twitchId, twitchLogin, displayName, profileImage,
           email, role, createdAt, updatedAt
    FROM users
  `);

  let created = 0, skipped = 0;

  for (const row of rows) {
    try {
      await newDb.user.upsert({
        where: { id: row.id },
        create: {
          id:           row.id,
          twitchId:     row.twitchId,
          twitchLogin:  row.twitchLogin,
          displayName:  row.displayName,
          profileImage: row.profileImage ?? null,
          email:        row.email        ?? null,
          role:         row.role         ?? 'USER',
          createdAt:    new Date(row.createdAt),
          updatedAt:    new Date(row.updatedAt),
        },
        update: {
          displayName:  row.displayName,
          profileImage: row.profileImage ?? null,
          email:        row.email        ?? null,
          role:         row.role         ?? 'USER',
          updatedAt:    new Date(row.updatedAt),
        },
      });
      created++;
    } catch (err: any) {
      warn(`User ${row.twitchLogin}: ${err.message}`);
      skipped++;
    }
  }

  ok(`Users: ${created} migrated, ${skipped} failed`);
  return { created, skipped, total: rows.length };
}

// ── Step 2: UserLiveStatus ────────────────────────────────────────────────────
async function migrateLiveStatus(old: mysql.Connection) {
  log('Migrating live status...');

  const [rows] = await old.execute<any[]>(`
    SELECT id, isLive, streamTitle, viewerCount, streamGame, liveUpdatedAt
    FROM users
  `);

  let created = 0;

  for (const row of rows) {
    await newDb.userLiveStatus.upsert({
      where: { userId: row.id },
      create: {
        userId:        row.id,
        isLive:        row.isLive        === 1 || row.isLive === true,
        streamTitle:   row.streamTitle   ?? null,
        viewerCount:   row.viewerCount   ?? null,
        streamGame:    row.streamGame    ?? null,
        liveUpdatedAt: row.liveUpdatedAt ? new Date(row.liveUpdatedAt) : null,
      },
      update: {
        isLive:        row.isLive        === 1 || row.isLive === true,
        streamTitle:   row.streamTitle   ?? null,
        viewerCount:   row.viewerCount   ?? null,
        streamGame:    row.streamGame    ?? null,
        liveUpdatedAt: row.liveUpdatedAt ? new Date(row.liveUpdatedAt) : null,
      },
    });
    created++;
  }

  ok(`LiveStatus: ${created} rows migrated`);
  return { created };
}

// ── Step 3: UserLinkedAccount ─────────────────────────────────────────────────
async function migrateLinkedAccounts(old: mysql.Connection) {
  log('Migrating linked accounts...');

  // Old schema only has YouTube fields — no Medal columns in old DB
  const [rows] = await old.execute<any[]>(`
    SELECT id, youtubeChannelId, youtubeChannelName
    FROM users
    WHERE youtubeChannelId IS NOT NULL
       OR youtubeChannelName IS NOT NULL
  `);

  let created = 0, skipped = 0;

  for (const row of rows) {
    await newDb.userLinkedAccount.upsert({
      where: { userId: row.id },
      create: {
        userId:             row.id,
        youtubeChannelId:   row.youtubeChannelId   ?? null,
        youtubeChannelName: row.youtubeChannelName ?? null,
        medalUserId:        null,
        medalUsername:      null,
      },
      update: {
        youtubeChannelId:   row.youtubeChannelId   ?? null,
        youtubeChannelName: row.youtubeChannelName ?? null,
      },
    });
    created++;
  }

  info(`${rows.length} users had YouTube linked`);
  ok(`LinkedAccounts: ${created} migrated, ${skipped} skipped`);
  return { created };
}

// ── Step 4: Sessions ──────────────────────────────────────────────────────────
async function migrateSessions(old: mysql.Connection) {
  log('Migrating sessions...');

  // Only migrate non-expired sessions — no point copying stale ones
  const [rows] = await old.execute<any[]>(`
    SELECT id, userId, token, expiresAt, createdAt
    FROM sessions
    WHERE expiresAt > NOW()
  `);

  let created = 0, skipped = 0;

  for (const row of rows) {
    try {
      await newDb.session.upsert({
        where: { id: row.id },
        create: {
          id:        row.id,
          userId:    row.userId,
          token:     row.token,
          expiresAt: new Date(row.expiresAt),
          createdAt: new Date(row.createdAt),
        },
        update: {
          expiresAt: new Date(row.expiresAt),
        },
      });
      created++;
    } catch (err: any) {
      // Skip if userId doesn't exist in new DB yet
      warn(`Session ${row.id}: ${err.message}`);
      skipped++;
    }
  }

  ok(`Sessions: ${created} active sessions migrated, ${skipped} skipped`);
  return { created, skipped };
}

// ── Step 5: Clips (core) ──────────────────────────────────────────────────────
async function migrateClips(old: mysql.Connection) {
  log('Migrating clips...');

  const [rows] = await old.execute<any[]>(`
    SELECT id, twitchClipId, twitchUrl, embedUrl, title, thumbnailUrl,
           duration, submittedBy, submittedByName, game, broadcasterId,
           broadcasterName, platform, platformVerified, createdAt, updatedAt
    FROM clips
  `);

  let created = 0, skipped = 0;

  for (const row of rows) {
    try {
      await newDb.clip.upsert({
        where: { id: row.id },
        create: {
          id:              row.id,
          // Rename: twitchClipId → platformClipId, twitchUrl → sourceUrl
          platformClipId:  row.twitchClipId,
          sourceUrl:       row.twitchUrl,
          embedUrl:        row.embedUrl,
          title:           row.title,
          thumbnailUrl:    row.thumbnailUrl    ?? null,
          duration:        row.duration        ?? null,
          submittedBy:     row.submittedBy,
          submittedByName: row.submittedByName,
          game:            row.game            ?? 'Sea of Thieves',
          broadcasterId:   row.broadcasterId,
          broadcasterName: row.broadcasterName,
          platform:        row.platform        ?? 'TWITCH',
          platformVerified: row.platformVerified === 1 || row.platformVerified === true,
          createdAt:       new Date(row.createdAt),
          updatedAt:       new Date(row.updatedAt),
        },
        update: {
          title:           row.title,
          thumbnailUrl:    row.thumbnailUrl ?? null,
          updatedAt:       new Date(row.updatedAt),
        },
      });
      created++;
    } catch (err: any) {
      warn(`Clip ${row.id} (${row.title?.slice(0, 30)}): ${err.message}`);
      skipped++;
    }
  }

  ok(`Clips: ${created} migrated, ${skipped} failed`);
  return { created, skipped, total: rows.length };
}

// ── Step 6: ClipStats ─────────────────────────────────────────────────────────
async function migrateClipStats(old: mysql.Connection) {
  log('Migrating clip stats...');

  const [rows] = await old.execute<any[]>(`
    SELECT id, viewCount FROM clips
  `);

  let created = 0;

  for (const row of rows) {
    await newDb.clipStats.upsert({
      where: { clipId: row.id },
      create: { clipId: row.id, viewCount: row.viewCount ?? 0 },
      update: { viewCount: row.viewCount ?? 0 },
    });
    created++;
  }

  ok(`ClipStats: ${created} rows migrated`);
  return { created };
}

// ── Step 7: ClipModeration ────────────────────────────────────────────────────
async function migrateClipModeration(old: mysql.Connection) {
  log('Migrating clip moderation...');

  const [rows] = await old.execute<any[]>(`
    SELECT id, status, reviewedBy, reviewNotes, reviewedAt FROM clips
  `);

  let created = 0;

  for (const row of rows) {
    await newDb.clipModeration.upsert({
      where: { clipId: row.id },
      create: {
        clipId:      row.id,
        status:      row.status      ?? 'PENDING',
        reviewedBy:  row.reviewedBy  ?? null,
        reviewNotes: row.reviewNotes ?? null,
        reviewedAt:  row.reviewedAt  ? new Date(row.reviewedAt) : null,
      },
      update: {
        status:      row.status      ?? 'PENDING',
        reviewedBy:  row.reviewedBy  ?? null,
        reviewNotes: row.reviewNotes ?? null,
        reviewedAt:  row.reviewedAt  ? new Date(row.reviewedAt) : null,
      },
    });
    created++;
  }

  ok(`ClipModeration: ${created} rows migrated`);
  return { created };
}

// ── Step 8: ClipTags ──────────────────────────────────────────────────────────
async function migrateClipTags(old: mysql.Connection) {
  log('Migrating clip tags...');

  // Old schema has surrogate id column — new schema uses composite PK
  const [rows] = await old.execute<any[]>(`
    SELECT clipId, tag FROM clip_tags
  `);

  // Old schema is missing SIREN and BOSS_FIGHT tags — add them to enum check
  const validTags = new Set([
    'FUNNY','KILL','TUCK','HIGHLIGHT','PVP','PVE',
    'SAILING','TREASURE','KEG','KRAKEN','MEGALODON',
    'EPIC_FAIL','TEAM_PLAY','SOLO','SIREN','BOSS_FIGHT',
  ]);

  let created = 0, skipped = 0;

  for (const row of rows) {
    if (!validTags.has(row.tag)) {
      warn(`Unknown tag "${row.tag}" on clip ${row.clipId} — skipping`);
      skipped++;
      continue;
    }

    try {
      // Upsert using composite key
      await newDb.clipTag.upsert({
        where: { clipId_tag: { clipId: row.clipId, tag: row.tag } },
        create: { clipId: row.clipId, tag: row.tag },
        update: {},
      });
      created++;
    } catch (err: any) {
      warn(`ClipTag ${row.clipId}/${row.tag}: ${err.message}`);
      skipped++;
    }
  }

  ok(`ClipTags: ${created} migrated, ${skipped} skipped`);
  return { created, skipped };
}

// ── Step 9: Verification ──────────────────────────────────────────────────────
async function verify(old: mysql.Connection) {
  log('Verifying row counts...');

  const [[oldUsers]]     = await old.execute<any[]>('SELECT COUNT(*) as c FROM users');
  const [[oldClips]]     = await old.execute<any[]>('SELECT COUNT(*) as c FROM clips');
  const [[oldSessions]]  = await old.execute<any[]>('SELECT COUNT(*) as c FROM sessions WHERE expiresAt > NOW()');
  const [[oldTags]]      = await old.execute<any[]>('SELECT COUNT(*) as c FROM clip_tags');

  const [newUsers]       = await Promise.all([newDb.user.count()]);
  const newClips         = await newDb.clip.count();
  const newSessions      = await newDb.session.count();
  const newTags          = await newDb.clipTag.count();
  const newStats         = await newDb.clipStats.count();
  const newModeration    = await newDb.clipModeration.count();
  const newLive          = await newDb.userLiveStatus.count();

  console.log('\n── Migration Verification ───────────────────────────────────');
  console.log(`  users:            old=${oldUsers.c}  →  new=${newUsers}  ${newUsers == oldUsers.c ? '✅' : '❌'}`);
  console.log(`  user_live_status: —            →  new=${newLive}  ${newLive == oldUsers.c ? '✅' : '❌'} (should = users)`);
  console.log(`  clips:            old=${oldClips.c}  →  new=${newClips}  ${newClips == oldClips.c ? '✅' : '❌'}`);
  console.log(`  clip_stats:       —            →  new=${newStats}  ${newStats == oldClips.c ? '✅' : '❌'} (should = clips)`);
  console.log(`  clip_moderation:  —            →  new=${newModeration}  ${newModeration == oldClips.c ? '✅' : '❌'} (should = clips)`);
  console.log(`  sessions (active):old=${oldSessions.c}  →  new=${newSessions}  ${newSessions == oldSessions.c ? '✅' : '❌'}`);
  console.log(`  clip_tags:        old=${oldTags.c}  →  new=${newTags}  ${newTags == oldTags.c ? '✅' : '❌'}`);
  console.log('─────────────────────────────────────────────────────────────\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏴‍☠️  PlunderClips — SQL to Modular Schema Migration\n');

  if (!process.env.OLD_DATABASE_URL) {
    console.error('❌ OLD_DATABASE_URL is required');
    console.error('   Example: OLD_DATABASE_URL=mysql://user:pass@host:3306/sot_clips npx ts-node ...');
    process.exit(1);
  }

  const old = await getOldDb();
  console.log('✅ Connected to old DB\n');

  try {
    // Order matters — respect foreign key dependencies
    // users must exist before sessions, live_status, linked_accounts
    // clips must exist before clip_stats, clip_moderation, clip_tags
    await migrateUsers(old);
    await migrateLiveStatus(old);
    await migrateLinkedAccounts(old);
    await migrateSessions(old);
    await migrateClips(old);
    await migrateClipStats(old);
    await migrateClipModeration(old);
    await migrateClipTags(old);
    await verify(old);

    console.log('✅ Migration complete.\n');
    console.log('Next steps:');
    console.log('  1. Check verification — all rows should be ✅');
    console.log('  2. Update API routes to use new schema');
    console.log('  3. Test the app against plunderclips_v2');
    console.log('  4. When ready — switch DATABASE_URL to plunderclips_v2\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await old.end();
    await newDb.$disconnect();
  }
}

main(); 