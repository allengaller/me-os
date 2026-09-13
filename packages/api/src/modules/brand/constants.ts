// 品牌档案蓝本默认值：取值来源 docs/实践/品牌/蓝本.md §0「品牌档案速览」。
// 首次进入品牌板块（尚未保存档案）时预填这些值，用户可直接在此基础上修改；
// 仅随 PUT 保存才落库（配合「空壳 profile 不写库」约定）。slogan 未定稿（DESIGN.md §7.1），保持 null。
export const BRAND_PROFILE_DEFAULTS = {
  mission:
    '用田野调查把各行各业最真实的反馈带进内容，用第一性原则与 maxing everything 把它们变成可照做的系统，并全程 build in public',
  positioning:
    '基于极致工程的田野调查者——把各行各业最真实的反馈带进内容，所有输出即本人，全程 build in public',
  slogan: null,
  personaTags: '极致工程师、田野调查者、Build in Public 创作者、AI Agent 重度用户',
  toneOfVoice:
    '接近真实、接地气、有依据；第一人称口语，说人话、给证据、承认不知道；弃用「纪录片调调」「冷静」',
  targetAudience:
    '25–40 岁追求真实成长与效率升级的知识工作者/工程师/独立创作者；以及被访谈的各行业一线从业者',
  visualNotes: '实录优先、低修饰、稳定一致（草案，待定）',
};