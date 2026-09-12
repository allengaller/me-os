import { prisma } from '../../lib/prisma.js';

/**
 * 品牌总览聚合：流水线漏斗、发布节奏、渠道健康（粉丝增量）与支柱覆盖。
 * 快照语义：followers 累计、views 等为周期增量，增量对比取相邻两次快照。
 */
export async function getBrandOverview(userId: string) {
  const now = new Date();
  const dayMs = 24 * 3600 * 1000;
  const weekAgo = new Date(now.getTime() - 7 * dayMs);
  const monthAgo = new Date(now.getTime() - 30 * dayMs);
  const monthAgo2 = new Date(now.getTime() - 60 * dayMs);
  const trendAgo = new Date(now.getTime() - 90 * dayMs);

  const [
    profile,
    statusGroups,
    publishedThisWeek,
    publishedThisMonth,
    channels,
    pillars,
    recentSnapshots,
    recentPublished,
    previousPublishedCount,
  ] = await Promise.all([
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
      where: { userId, recordedAt: { gte: trendAgo } },
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
    prisma.contentItem.findMany({
      where: { userId, publishedAt: { gte: monthAgo } },
      select: { type: true, pillarId: true, pillar: { select: { name: true } } },
    }),
    prisma.contentItem.count({ where: { userId, publishedAt: { gte: monthAgo2, lt: monthAgo } } }),
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

  // 90 天窗口按渠道聚合：views/likes/comments/shares 求和、followers 取首末差；
  // 周/月窗口从同一份数据里筛，另按 7 天一桶切出最近 12 周趋势。
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
  const weeklyByIndex = new Map<number, Bucket>();
  for (const snap of recentSnapshots) {
    const fill = (b: Bucket) => {
      if (snap.views) b.views += snap.views;
      if (snap.likes) b.likes += snap.likes;
      if (snap.comments) b.comments += snap.comments;
      if (snap.shares) b.shares += snap.shares;
      if (snap.followers < b.followersFirst) b.followersFirst = snap.followers;
      if (snap.followers > b.followersLast) b.followersLast = snap.followers;
    };
    if (snap.recordedAt >= monthAgo) {
      const inMonth = monthByChannel.get(snap.channelId) ?? emptyBucket();
      fill(inMonth);
      monthByChannel.set(snap.channelId, inMonth);
      if (snap.recordedAt >= weekAgo) {
        const inWeek = weekByChannel.get(snap.channelId) ?? emptyBucket();
        fill(inWeek);
        weekByChannel.set(snap.channelId, inWeek);
      }
    }
    const weekIndex = Math.floor((now.getTime() - snap.recordedAt.getTime()) / (7 * dayMs));
    if (weekIndex >= 0 && weekIndex < 12) {
      const inWeekBucket = weeklyByIndex.get(weekIndex) ?? emptyBucket();
      fill(inWeekBucket);
      weeklyByIndex.set(weekIndex, inWeekBucket);
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
  const weeklyTrend = Array.from({ length: 12 }, (_, i) => {
    const b = weeklyByIndex.get(i);
    const end = new Date(now.getTime() - i * 7 * dayMs);
    const start = new Date(now.getTime() - (i + 1) * 7 * dayMs);
    const label = `${start.getMonth() + 1}/${start.getDate()}–${end.getMonth() + 1}/${end.getDate()}`;
    return {
      label,
      ...(b ? finalize(b) : emptyTotals()),
    };
  });

  // 近 30 天内容产出摘要：类型分布 + 支柱分布 + 与上一周期环比
  const byType: Record<string, number> = {};
  const pillarCounts = new Map<string, { id: string; name: string; count: number }>();
  for (const item of recentPublished) {
    byType[item.type] = (byType[item.type] ?? 0) + 1;
    if (item.pillarId && item.pillar?.name) {
      const entry = pillarCounts.get(item.pillarId) ?? { id: item.pillarId, name: item.pillar.name, count: 0 };
      entry.count += 1;
      pillarCounts.set(item.pillarId, entry);
    }
  }
  const contentDigest = {
    total: recentPublished.length,
    previousTotal: previousPublishedCount,
    delta: recentPublished.length - previousPublishedCount,
    byType,
    byPillar: [...pillarCounts.values()].sort((a, b) => b.count - a.count),
  }

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
    weeklyTrend,
    contentDigest,
  };
}