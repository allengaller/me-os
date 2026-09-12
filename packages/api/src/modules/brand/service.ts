import { prisma } from '../../lib/prisma.js';

/**
 * 品牌总览聚合：流水线漏斗、发布节奏、渠道健康（粉丝增量）与支柱覆盖。
 * 快照语义：followers 累计、views 等为周期增量，增量对比取相邻两次快照。
 */
export async function getBrandOverview(userId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [profile, statusGroups, publishedThisWeek, publishedThisMonth, channels, pillars, recentSnapshots] =
    await Promise.all([
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
      prisma.metricSnapshot.findMany({
        where: { userId, recordedAt: { gte: monthAgo } },
        orderBy: { recordedAt: 'asc' },
        select: {
          channelId: true,
          recordedAt: true,
          followers: true,
          views: true,
          likes: true,
          comments: true,
          shares: true,
        },
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

  // 30 天窗口内按渠道聚合：views/likes/comments/shares 求和、followers 取首末差
  type Bucket = { views: number; likes: number; comments: number; shares: number; followersFirst: number; followersLast: number };
  const emptyBucket = (): Bucket => ({
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    followersFirst: Number.POSITIVE_INFINITY,
    followersLast: -1,
  });
  const monthByChannel = new Map<string, Bucket>();
  const weekByChannel = new Map<string, Bucket>();
  for (const s of recentSnapshots) {
    const inMonth = monthByChannel.get(s.channelId) ?? emptyBucket();
    const inWeek = s.recordedAt >= weekAgo ? (weekByChannel.get(s.channelId) ?? emptyBucket()) : null;
    const fill = (b: Bucket) => {
      if (s.views) b.views += s.views;
      if (s.likes) b.likes += s.likes;
      if (s.comments) b.comments += s.comments;
      if (s.shares) b.shares += s.shares;
      if (s.followers < b.followersFirst) b.followersFirst = s.followers;
      if (s.followers > b.followersLast) b.followersLast = s.followers;
    };
    fill(inMonth);
    monthByChannel.set(s.channelId, inMonth);
    if (inWeek) {
      fill(inWeek);
      weekByChannel.set(s.channelId, inWeek);
    }
  }
  const finalize = (b: Bucket) =>
 ({
    followersDelta: b.followersLast >= 0 && b.followersFirst !== Number.POSITIVE_INFINITY ? b.followersLast - b.followersFirst : 0,
    views: b.views,
    likes: b.likes,
    comments: b.comments,
    shares: b.shares,
  });
  const emptyTotals = () => ({ followersDelta: 0, views: 0, likes: 0, comments: 0, shares: 0 });
  const sumBuckets = (m: Map<string, Bucket>) => {
    const total = emptyTotals();
    for (const b of m.values()) {
      const f = finalize(b);
      total.followersDelta += f.followersDelta;
      total.views += f.views;
      total.likes += f.likes;
      total.comments += f.comments;
      total.shares += f.shares;
    }
    return total;
  };

  return {
    profile: profile ? { slogan: profile.slogan, mission: profile.mission } : null,
    pipeline,
    publishedThisWeek,
    publishedThisMonth,
    channels: channelSummaries,
    trends,
    pillars: pillars.map((p) => ({ id: p.id, name: p.name, contentCount: p._count.contents })),
    totals: {
      week: sumBuckets(weekByChannel),
      month: sumBuckets(monthByChannel),
    },
  };
}