// 品牌板块演示数据（mock）—— 本文件是品牌 mock 数据的唯一来源，直接修改后重新应用即可生效：
//   手动应用：pnpm --filter @meos/api db:seed:brand（dev.sh 启动时也会自动应用一次）
// 重新应用会重建 id 以 `seed-brand-` 开头的行（这批 mock 行在页面上的改动会被覆盖）；
// 你自己在页面上新建的数据（uuid id）不受影响。
//
// 取值约定：
//   标注「来源」的取自你提供的品牌文档（docs/brand/DESIGN.md、docs/brand/ACCOUNT_LAUNCH.md），按原文取值；
//   标注「mock」的为演示用虚构数据（指标数值、章节进度、复盘结论、部分选题），可随意修改。

// ==================== 品牌档案（BrandProfile） ====================
// 字段取值来源：docs/brand/DESIGN.md §0「品牌档案速览」（用户输入）。
// slogan 按蓝本为「待定稿」，这里预填 §7.1 推荐候选「见真实，做极致」仅为让总览头图完整展示，定稿后直接改。
export const BRAND_MOCK_PROFILE = {
  mission: '用田野调查把各行各业最真实的反馈带进内容，用第一性原则与 maxing everything 把它们变成可照做的系统，并全程 build in public',
  positioning: '基于极致工程的田野调查者——把各行各业最真实的反馈带进内容，所有输出即本人，全程 build in public',
  slogan: '见真实，做极致',
  personaTags: '极致工程师、田野调查者、Build in Public 创作者、AI Agent 重度用户',
  toneOfVoice: '接近真实、接地气、有依据；第一人称口语，说人话、给证据、承认不知道；弃用「纪录片调调」「冷静」',
  targetAudience: '25–40 岁追求真实成长与效率升级的知识工作者/工程师/独立创作者；以及被访谈的各行业一线从业者',
  visualNotes: '实录优先、低修饰、稳定一致（草案，待定）',
};

// ==================== 内容支柱（BrandPillar） ====================
// 来源：DESIGN.md §6.1 四根内容支柱（用户输入）
export const BRAND_MOCK_PILLARS = [
  { key: 'methodology', name: '极致工程方法论', description: '第一性原则与 maxing everything 的框架和应用', order: 1 },
  { key: 'fieldwork', name: '田野调查实录', description: '各行各业真实反馈进视频（主线）', order: 2 },
  { key: 'selftuning', name: '自我调教日志', description: '身体/认知/AI Agent 的公开调教与数据', order: 3 },
  { key: 'buildinpublic', name: '公开构建', description: '出版物/App/小程序/Web App 的构建与发布', order: 4 },
];

// ==================== 平台渠道（PlatformChannel） ====================
// 角色定位来源：DESIGN.md §6.9 渠道分级、§6.7 平台适配、ACCOUNT_LAUNCH.md §2 主阵地初判（用户输入）。
// handle/url：蓝本 §10 标注「各平台 handle 待统一」，除 X（暂用 GitHub 同名 allengaller）外留空。
// status 分配了 active/paused/dormant 三种，便于看全状态徽标（mock）。
export const BRAND_MOCK_CHANNELS = [
  {
    key: 'bilibili',
    platform: 'bilibili',
    name: 'B站',
    handle: '曹亚仑',
    url: null,
    positioning: '田野调查长视频主阵地——保留完整过程与弹幕互动点（ACCOUNT_LAUNCH §2：首选候选）',
    cadence: '每周 1 条精品长视频',
    status: 'active',
    order: 1,
  },
  {
    key: 'wechat-mp',
    platform: 'wechat-mp',
    name: '公众号',
    handle: null,
    url: null,
    positioning: '图文沉淀——完整方法论长文，结构完整、可收藏（DESIGN §6.9）',
    cadence: '每月 2–4 篇',
    status: 'active',
    order: 2,
  },
  {
    key: 'xiaohongshu',
    platform: 'xiaohongshu',
    name: '小红书',
    handle: null,
    url: null,
    positioning: '高频触达——原话金句 + 图文，少术语、视觉第一，导流回主阵地（DESIGN §6.7/§6.9）',
    cadence: '每周 1–2 条',
    status: 'active',
    order: 3,
  },
  {
    key: 'douyin',
    platform: 'douyin',
    name: '抖音',
    handle: null,
    url: null,
    positioning: '高频触达——长视频切片 + 强钩子，前 3 秒给结论，导流回主阵地（DESIGN §6.7/§6.9）',
    cadence: '每周 2–3 条切片',
    status: 'active',
    order: 4,
  },
  {
    key: 'x',
    platform: 'x',
    name: 'X',
    handle: 'allengaller',
    url: null,
    positioning: '国际延伸——build in public 过程帖与复盘片段，英文可（DESIGN §6.9；handle 暂用 GitHub 同名，待统一）',
    cadence: '随构建更新',
    status: 'active',
    order: 5,
  },
  {
    key: 'wechat-channels',
    platform: 'wechat-channels',
    name: '视频号',
    handle: null,
    url: null,
    positioning: '长视频第二阵地——微信生态分发（ACCOUNT_LAUNCH §2：第二候选，未激活）',
    cadence: '待定',
    status: 'paused',
    order: 6,
  },
  {
    key: 'youtube',
    platform: 'youtube',
    name: 'YouTube',
    handle: null,
    url: null,
    positioning: '国际延伸——田野长视频与 build in public（DESIGN §6.9：国际，规划中）',
    cadence: null,
    status: 'dormant',
    order: 7,
  },
];

// ==================== 渠道指标快照（MetricSnapshot） ====================
// 语义：followers 为当前累计值；views/likes/comments/shares 为「自上次快照以来」的本周期增量（mock）。
// 起号期量级：小基数正增长（ACCOUNT_LAUNCH：0→1 阶段，内容资产 > 粉丝数）。
// 视频号/YouTube 故意不留快照，演示「暂无数据」状态。
export const BRAND_MOCK_SNAPSHOTS: {
  channelKey: string;
  daysAgo: number;
  followers: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  revenue?: number;
  note?: string;
}[] = [
  // B站：8 周趋势
  { channelKey: 'bilibili', daysAgo: 49, followers: 180, views: 9800, likes: 620, comments: 140, shares: 90 },
  { channelKey: 'bilibili', daysAgo: 42, followers: 320, views: 15400, likes: 980, comments: 210, shares: 150 },
  { channelKey: 'bilibili', daysAgo: 35, followers: 510, views: 22600, likes: 1450, comments: 330, shares: 240 },
  { channelKey: 'bilibili', daysAgo: 28, followers: 760, views: 31200, likes: 2010, comments: 470, shares: 330 },
  { channelKey: 'bilibili', daysAgo: 21, followers: 980, views: 28400, likes: 1830, comments: 420, shares: 300 },
  { channelKey: 'bilibili', daysAgo: 14, followers: 1240, views: 36800, likes: 2410, comments: 560, shares: 410 },
  { channelKey: 'bilibili', daysAgo: 6, followers: 1530, views: 42100, likes: 2760, comments: 650, shares: 480 },
  { channelKey: 'bilibili', daysAgo: 0, followers: 1860, views: 52300, likes: 3420, comments: 830, shares: 600, note: '田野实录 EP1 发布后第 7 天' },
  // 公众号：6 周趋势
  { channelKey: 'wechat-mp', daysAgo: 35, followers: 260, views: 3800, likes: 180, comments: 30, shares: 90 },
  { channelKey: 'wechat-mp', daysAgo: 28, followers: 340, views: 4600, likes: 220, comments: 40, shares: 120 },
  { channelKey: 'wechat-mp', daysAgo: 21, followers: 430, views: 5400, likes: 270, comments: 50, shares: 150 },
  { channelKey: 'wechat-mp', daysAgo: 14, followers: 520, views: 6900, likes: 330, comments: 60, shares: 200 },
  { channelKey: 'wechat-mp', daysAgo: 6, followers: 610, views: 8100, likes: 400, comments: 75, shares: 260 },
  { channelKey: 'wechat-mp', daysAgo: 0, followers: 720, views: 9200, likes: 460, comments: 90, shares: 310 },
  // 小红书：4 周趋势
  { channelKey: 'xiaohongshu', daysAgo: 21, followers: 640, views: 12000, likes: 900, comments: 120, shares: 300 },
  { channelKey: 'xiaohongshu', daysAgo: 14, followers: 1120, views: 21000, likes: 1600, comments: 210, shares: 520 },
  { channelKey: 'xiaohongshu', daysAgo: 6, followers: 1660, views: 26000, likes: 2000, comments: 260, shares: 640 },
  { channelKey: 'xiaohongshu', daysAgo: 0, followers: 2140, views: 31000, likes: 2500, comments: 320, shares: 790 },
  // 抖音：3 周趋势
  { channelKey: 'douyin', daysAgo: 14, followers: 90, views: 62000, likes: 5200, comments: 700, shares: 1100 },
  { channelKey: 'douyin', daysAgo: 6, followers: 410, views: 98000, likes: 8300, comments: 1150, shares: 1900 },
  { channelKey: 'douyin', daysAgo: 0, followers: 780, views: 145000, likes: 12400, comments: 1700, shares: 2800, note: '切片爆款带来第一波关注' },
  // X：2 周趋势
  { channelKey: 'x', daysAgo: 6, followers: 130, views: 8200, likes: 160, comments: 30, shares: 50 },
  { channelKey: 'x', daysAgo: 0, followers: 210, views: 12600, likes: 240, comments: 45, shares: 80 },
];

// ==================== 内容流水线（ContentItem） ====================
// 标题/支柱/类型：取自 DESIGN.md §6.1 示例选题、§5.5 口吻样本与 ACCOUNT_LAUNCH.md §3「前 3 条必做选题」（用户输入）。
// 大纲/核心观点/优先级细节、状态分布与日期（mock），覆盖 idea/drafting/ready/published/archived 全状态。
// publishedDaysAgo → publishedAt；publishDueInDays → publishDue。
export const BRAND_MOCK_CONTENTS = [
  {
    key: 'waimai',
    title: '田野实录·外卖行业：我把骑手的真实收入算了一遍',
    type: 'long-video',
    status: 'published',
    coreMessage: '去掉补贴与理想派单假设后，骑手的时薪结构比大多数人想象的更脆弱——真实账本比观点更有说服力',
    outline:
      '钩子：跑单第一天，带我熟路的骑手师傅第一句话就推翻了我的假设；\n现场：三天地面观察 + 5 位骑手深度访谈（同意清单 §8.5 已走完）；\n真实反馈：收入账本逐项上屏（单价/罚款/等待成本）；\n第一性拆解：时薪 = 接单密度 × 单价 − 等待成本，平台补贴只改分子；\n落地：普通人观察平台经济的三个动作；\n互动：评论区征集下一个田野行业（反馈本身也是田野）。',
    priority: 'high',
    tags: '田野调查,外卖,平台经济',
    pillarKey: 'fieldwork',
    publishedDaysAgo: 20,
    publishDueInDays: null,
    reviewNote:
      '有效：抖音切片把「账本数字」放前 3 秒，播放是长视频的 2.4 倍，验证了「结论前置」；\n待改进：长视频前 30 秒铺垫过长，完播率 31% 低于预期——下一期长视频也把结论前置，B站开头直接上账本表。',
    topicSeedId: 'seed-brand-topic-1',
    order: 1,
  },
  {
    key: 'xiufu',
    title: '跟修了十八年车的老师傅待了三天：他第一句话就推翻了我的假设',
    type: 'long-video',
    status: 'ready',
    coreMessage: '手艺行业的知识传递靠「看」不靠「说」——十八年老师傅的学徒制在 AI 时代反而更值钱',
    outline:
      '钩子：他跟我说的第一句话就推翻了我的假设（开场取自 DESIGN §5.5 口吻样本）；\n现场：修理厂三天跟场实录；\n真实反馈：报价单与工时原话上屏；\n第一性拆解：经验为什么无法被文档化；\n落地：普通人判断「靠谱师傅」的三个信号。',
    priority: 'high',
    tags: '田野调查,修理行业,学徒制',
    pillarKey: 'fieldwork',
    publishedDaysAgo: null,
    publishDueInDays: 3,
    reviewNote: null,
    topicSeedId: null,
    order: 2,
  },
  {
    key: 'xiaolv',
    title: '我把网上流行的「效率系统」全部拆了一遍，只剩两句话成立',
    type: 'article',
    status: 'drafting',
    coreMessage: '绝大多数「效率系统」在第一性原则下站不住：它们优化的是感觉，不是产出',
    outline:
      '拆解 5 个流行系统的共同假设；\n用两句话标准过滤：第一性原则、maxing everything；\n留下什么、扔掉什么。',
    priority: 'high',
    tags: '极致工程,第一性原则',
    pillarKey: 'methodology',
    publishedDaysAgo: null,
    publishDueInDays: 7,
    reviewNote: null,
    topicSeedId: null,
    order: 3,
  },
  {
    key: 'sleep',
    title: '30 天睡眠-训练-LLM 管线改造：数据、踩坑与结论',
    type: 'short-video',
    status: 'published',
    coreMessage: '把睡眠当成可调教的系统：固定起床点 + 训练负荷前置 + 用 LLM 管线自动汇总每日数据，30 天深睡时长提升约 18%（个人样本，非普遍结论）',
    outline: '数据基线：7 天手环记录；\n改造：三项干预逐周叠加；\n踩坑：咖啡因截断点、数据缺失处理；\n结论与下一步。',
    priority: 'medium',
    tags: '自我调教,睡眠,AI Agent',
    pillarKey: 'selftuning',
    publishedDaysAgo: 3,
    publishDueInDays: null,
    reviewNote: null,
    topicSeedId: null,
    order: 4,
  },
  {
    key: 'meos',
    title: 'build in public：我的个人操作系统 MeOS v0.3',
    type: 'article',
    status: 'published',
    coreMessage: 'MeOS v0.3 合并品牌板块：定位 → 创作 → 分发 → 复盘闭环，数据本地优先、AI 可读写',
    outline: '为什么做品牌板块；\n数据模型 7 张表；\n一鱼多吃的分发矩阵长什么样；\n下一步：MeLog 连接器打通田野素材。',
    priority: 'medium',
    tags: 'build in public,MeOS,独立开发',
    pillarKey: 'buildinpublic',
    publishedDaysAgo: 12,
    publishDueInDays: null,
    reviewNote: null,
    topicSeedId: null,
    order: 5,
  },
  {
    key: 'renzhi-perf',
    title: '如何给认知系统做性能测试',
    type: 'article',
    status: 'drafting',
    coreMessage: '认知也可以像系统一样做性能测试：输入质量、负载上限、回收率三个指标',
    outline: '类比来源与边界（哪里不像）；\n三个可测指标的定义；\n一周自测流程模板。',
    priority: 'medium',
    tags: '极致工程,认知,方法论',
    pillarKey: 'methodology',
    publishedDaysAgo: null,
    publishDueInDays: 10,
    reviewNote: null,
    topicSeedId: null,
    order: 6,
  },
  {
    key: 'renzhi-clean',
    title: '看完就能照做：给认知做一次「磁盘清理」的最小流程',
    type: 'short-video',
    status: 'idea',
    coreMessage: '信息噪音是认知系统的碎片文件——一个 30 分钟的最小清理流程',
    outline: null,
    priority: 'medium',
    tags: '自我调教,认知',
    pillarKey: 'methodology',
    publishedDaysAgo: null,
    publishDueInDays: null,
    reviewNote: null,
    topicSeedId: null,
    order: 7,
  },
  {
    key: 'zhan',
    title: '田野里挖到的第一个「想不到」：快递驿站的一天',
    type: 'long-video',
    status: 'idea',
    coreMessage: '快递驿站的一天是被算法压缩的时间表——先记录，再谈评价',
    outline: '跟站长的完整一天；\n三个反直觉时刻；\n留问题给评论区。',
    priority: 'medium',
    tags: '田野调查,快递驿站',
    pillarKey: 'fieldwork',
    publishedDaysAgo: null,
    publishDueInDays: null,
    reviewNote: null,
    topicSeedId: null,
    order: 8,
  },
  {
    key: 'shipai',
    title: '试拍：菜市场早市观察（未过选题四问，归档）',
    type: 'long-video',
    status: 'archived',
    coreMessage: '试拍素材：菜市场早市观察',
    outline: null,
    priority: 'low',
    tags: '田野调查,试拍',
    pillarKey: 'fieldwork',
    publishedDaysAgo: null,
    publishDueInDays: null,
    reviewNote: '未过选题四问（拆不到第一性，故事之外缺「理」），按 §6.6 归档保留素材；「真实感」的问题意识并入外卖一期。',
    topicSeedId: null,
    order: 9,
  },
];

// ==================== 分发记录（ContentDistribution，一鱼多吃） ====================
// 形态适配取自 DESIGN.md §6.7 平台适配原则（用户输入）；标题微调与单篇数据（mock）。
// url 留空：蓝本 §10「各平台 handle 待统一」，发布链接待补。
export const BRAND_MOCK_DISTRIBUTIONS = [
  // 外卖一期：长视频 → 切片 / 长文 / 短帖（§6.4 一鱼多吃转化链）
  {
    contentKey: 'waimai',
    channelKey: 'bilibili',
    status: 'published',
    adaptedTitle: '田野实录·外卖行业：我把骑手的真实收入算了一遍',
    publishedDaysAgo: 20,
    views: 86000,
    likes: 4200,
    comments: 890,
    shares: 610,
    note: '完整版 14 分钟，完播率 31%',
  },
  {
    contentKey: 'waimai',
    channelKey: 'wechat-mp',
    status: 'published',
    adaptedTitle: '外卖骑手的真实收入账本：跑了三天单，我把数字整理成了这张表',
    publishedDaysAgo: 19,
    views: 9200,
    likes: 310,
    comments: 150,
    shares: 420,
    note: '完整方法论长文，可收藏',
  },
  {
    contentKey: 'waimai',
    channelKey: 'douyin',
    status: 'published',
    adaptedTitle: '骑手师傅第一句话，就推翻了我的假设',
    publishedDaysAgo: 18,
    views: 210000,
    likes: 18000,
    comments: 2600,
    shares: 3900,
    note: '切片，前 3 秒直接上账本数字',
  },
  {
    contentKey: 'waimai',
    channelKey: 'x',
    status: 'published',
    adaptedTitle: 'I spent three days with delivery riders. Here is the real ledger.',
    publishedDaysAgo: 17,
    views: 12000,
    likes: 240,
    comments: 45,
    shares: 80,
    note: null,
  },
  {
    contentKey: 'waimai',
    channelKey: 'xiaohongshu',
    status: 'planned',
    adaptedTitle: '跟了 3 天外卖骑手，我把真实收入算明白了',
    publishedDaysAgo: null,
    views: null,
    likes: null,
    comments: null,
    shares: null,
    note: '金句图文版，待排期',
  },
  // 睡眠管线：短视频 + 图文
  {
    contentKey: 'sleep',
    channelKey: 'bilibili',
    status: 'published',
    adaptedTitle: '30 天睡眠-训练-LLM 管线改造',
    publishedDaysAgo: 3,
    views: 21000,
    likes: 1300,
    comments: 260,
    shares: 140,
    note: null,
  },
  {
    contentKey: 'sleep',
    channelKey: 'xiaohongshu',
    status: 'published',
    adaptedTitle: '30 天把睡眠当系统调：我的管线改造笔记',
    publishedDaysAgo: 2,
    views: 18000,
    likes: 2100,
    comments: 180,
    shares: 420,
    note: null,
  },
  {
    contentKey: 'sleep',
    channelKey: 'douyin',
    status: 'planned',
    adaptedTitle: '30 天实验：睡眠-训练-LLM 管线改造',
    publishedDaysAgo: null,
    views: null,
    likes: null,
    comments: null,
    shares: null,
    note: '切片待剪',
  },
  // MeOS build in public
  {
    contentKey: 'meos',
    channelKey: 'x',
    status: 'published',
    adaptedTitle: 'Building in public: MeOS v0.3 — my personal OS',
    publishedDaysAgo: 12,
    views: 8600,
    likes: 190,
    comments: 30,
    shares: 60,
    note: null,
  },
  {
    contentKey: 'meos',
    channelKey: 'wechat-mp',
    status: 'published',
    adaptedTitle: 'build in public：我的个人操作系统 v0.3',
    publishedDaysAgo: 11,
    views: 5400,
    likes: 210,
    comments: 90,
    shares: 180,
    note: null,
  },
  {
    contentKey: 'meos',
    channelKey: 'bilibili',
    status: 'planned',
    adaptedTitle: '我的个人操作系统 MeOS v0.3：开发全记录',
    publishedDaysAgo: null,
    views: null,
    likes: null,
    comments: null,
    shares: null,
    note: '演示视频待录',
  },
];

// ==================== 作品库（Work） ====================
// MeOS / 《极致工程》/ 方法论课 / 田野实录栏目：名称与定位来自 DESIGN.md §2.5 品牌架构（用户输入）；
// 进度描述（mock）。品牌处于 0→1 阶段，不造「已发布」作品。
export const BRAND_MOCK_WORKS = [
  {
    key: 'meos',
    name: 'MeOS 个人操作系统',
    type: 'webapp',
    status: 'in_progress',
    description: '产品子品牌（DESIGN §2.5）：本地优先的个人生活数据操作系统，AI 可读写',
    progress: 'v0.3 · 品牌板块已合并',
    url: 'https://github.com/allengaller/me-os',
    launchedDaysAgo: null,
    order: 1,
  },
  {
    key: 'book',
    name: '《极致工程》',
    type: 'book',
    status: 'in_progress',
    description: '方法论子品牌旗帜概念（DESIGN §2.5）：第一性原则 × maxing everything 的系统方法书',
    progress: '大纲定稿，第 1–2 章草稿中（mock 进度，可直接改）',
    url: null,
    launchedDaysAgo: null,
    order: 2,
  },
  {
    key: 'course',
    name: '极致工程方法论课',
    type: 'course',
    status: 'concept',
    description: '拆解视频 → 系统课的转化路径；先立信任再卖课（DESIGN §2.4：李一舟为反面教材）',
    progress: null,
    url: null,
    launchedDaysAgo: null,
    order: 3,
  },
  {
    key: 'column',
    name: '「田野实录」栏目',
    type: 'other',
    status: 'concept',
    description: '视频主线栏目包装（栏目名待定，DESIGN §10）：固定片头、封面系统与系列命名',
    progress: null,
    url: null,
    launchedDaysAgo: null,
    order: 4,
  },
];

// 关联认知课题（ContentItem.topicId 软关联 Topic）：演示流水线详情里的课题下拉与关联。
export const BRAND_MOCK_TOPIC = {
  id: 'seed-brand-topic-1',
  title: '平台经济劳动者的真实处境',
  description: '从外卖骑手田野延伸出的认知课题：算法派单、收入结构与保障缺口的一手证据收集。',
  category: '社会观察',
  status: 'exploring',
  priority: 'high',
};
