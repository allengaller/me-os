import { prisma } from '../../lib/prisma.js';

/**
 * 品牌总览聚合：流水线漏斗、发布节奏、渠道健康（粉丝增量）与支柱覆盖。
 * 快照语义：followers 累计、views 等为周期增量，增量对比取相邻两次快照。
 */
export async function getBrandOverview(userId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [profile, statusGroups, publishedThisWeek, publishedThisMonth, channels, pillars] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { userId } }),
    prisma.contentItem.groupBy({ by: ['status'], where: { userId }, _count: { _all: true } }),
    prisma.contentItem.count({ where: { userId, publishedAt: { gte: weekAgo } } }),
    prisma.contentItem.count({ where: { userId, publishedAt: { gte: monthAgo } } }),
    prisma.platformChannel.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { snapshots: { orderBy: { recordedAt: 'desc' }, take: 8 } },
    }),
    prisma.brandPillar.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { contents: true } } },
    }),
  ]);

  const pipeline: Record<string, number> = { idea: 0, drafting: 0, ready: 0, published: 0, archived: 0 };
  for (const row of statusGroups) {
    pipeline[row.status] = row._count._all;
  }

  const channelSummaries = channels.map((channel) => {
    const latest = channel.snapshots[0] ?? null;
    const previous = channel.snapshots[1] ?? null;
    return {
      id: channel.id,
      name: channel.name,
      platform: channel.platform,
      status: channel.status,
      latest: latest
        ? { followers: latest.followers, views: latest.views, recordedAt: latest.recordedAt }
        : null,
      followerDelta: latest && previous ? latest.followers - previous.followers : null,
      snapshotCount: channel.snapshots.length,
    };
  });

  const trends = channels
    .filter((c) => c.snapshots.length > 0)
    .map((c) => ({
      channelId: c.id,
      name: c.name,
      series: [...c.snapshots].reverse().map((s) => ({ recordedAt: s.recordedAt, followers: s.followers })),
    }));

  return {
    profile: profile ? { slogan: profile.slogan, mission: profile.mission } : null,
    pipeline,
    publishedThisWeek,
    publishedThisMonth,
    channels: channelSummaries,
    trends,
    pillars: pillars.map((p) => ({ id: p.id, name: p.name, contentCount: p._count.contents })),
  };
}
