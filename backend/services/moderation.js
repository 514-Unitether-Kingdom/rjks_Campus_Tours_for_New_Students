// 内容安全（V1 兜底版）。
//
// ⚠ 这是最小实现：一个关键词黑名单，对用户提问和 AI 回答都过一遍。
// 真正上线应改用微信内容安全接口 msgSecCheck（需要小程序 access_token）
// 或 DeepSeek 侧的内容安全能力。此处先兜底，词表可按需扩充或改从文件加载。
//
// 仓库里不堆真实敏感词，只放少量示意；上线前请补全或替换为 msgSecCheck。
const BLOCK_WORDS = (process.env.MODERATION_WORDS || '')
  .split(',')
  .map((w) => w.trim())
  .filter(Boolean);

// 明显违规意图的兜底词（示意，非完整）。生产用 msgSecCheck 替换。
const DEFAULT_WORDS = ['自杀教程', '制作炸弹', '毒品交易'];

const ALL = [...new Set([...DEFAULT_WORDS, ...BLOCK_WORDS])];

exports.isBlocked = (text) => {
  if (!text) return false;
  const t = String(text);
  return ALL.some((w) => w && t.includes(w));
};
