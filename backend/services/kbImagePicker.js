// AI 助手答案配图的"相关性闸门"。
//
// 问题：检索(ngram)对 off-topic 问题也会返回一个分数虚高的长条目，
//   若无条件贴它的图，会出现"问天气配张保研率表"这种损害信任的错配。
// 做法：只在"确实贴题"时配图——用问题与条目主题(question+keywords)的
//   中文二元组重合度做闸门；并在所有命中里挑"最贴题且有图"的一条，
//   而不是死板地取 hits[0]（检索首条不一定是答案真正依据的那条）。
//
// 关键点：像"开放/时间"这种在多条里都出现的通用二元组会造成跨主题串味
//   （浴室开放时间 vs 食堂开放时间）。所以用 IDF 思路，从语料自动识别
//   高频通用二元组并在计数时忽略，只认"浴室/食堂/校历"这类区分性词。
// 纯文本、无外部依赖，便于单测。

const EMPTY = new Set();

// 取中文/字母数字的二元组集合（丢标点与空白）
function contentBigrams(s) {
  const clean = String(s || '').toLowerCase().replace(/[^一-龥a-z0-9]+/g, '');
  const grams = new Set();
  for (let i = 0; i + 1 < clean.length; i++) grams.add(clean.slice(i, i + 2));
  return grams;
}

// 受保护主题词：虽因"恰好有几个相关条目"而 df 偏高，但它们是真正的主题名词，
// 不能当通用词过滤，否则"宿舍/课表"这类查询会命中 0 图（实测漏配宿舍图）。
// 与之相对，"信息服务/好好学习/新生答疑/热门问题"等 df 高达 10+ 的是 wiki 章节名，
// 才是该过滤的结构词。列表很短、可控，随知识库主题增加在此维护。
const PROTECTED_TOPICS = new Set(['宿舍', '课表']);

// 从全部条目主题里统计"通用二元组"：出现在 >= dfMin 条里的，视为无区分度（受保护词除外）。
// topics: [{ question, keywords }]
function buildGeneric(topics, dfMin = 4) {
  const df = new Map();
  for (const t of topics || []) {
    const g = contentBigrams((t.question || '') + ' ' + (t.keywords || ''));
    for (const x of g) df.set(x, (df.get(x) || 0) + 1);
  }
  const generic = new Set();
  for (const [x, c] of df) if (c >= dfMin && !PROTECTED_TOPICS.has(x)) generic.add(x);
  return generic;
}

// 问题与某条目的贴题度：
//  - distinctive: 去掉通用词后，问题与条目主题(question+keywords)的共享二元组数
//  - titleCoverage: 问题命中了"条目标题里区分性(非通用)二元组"的比例。
//    用来判断"单个词命中"到底是主题词(食堂/保研，覆盖标题核心)还是
//    长标题里的碎片(GPA 的 gp、'使用' 这种，覆盖比例极低)。
const hasCJK = (s) => /[一-龥]/.test(s);

function relevance(question, entry, generic = EMPTY) {
  const qg = contentBigrams(question);
  const titleG = contentBigrams(entry.question);
  const topicG = contentBigrams((entry.question || '') + ' ' + (entry.keywords || ''));
  let distinctive = 0;
  let cjkDistinctive = 0; // 含中文的区分性重合数——中文双字多是词，英文双字常是碎片(gp↔GPA)
  let protectedHit = false; // 命中受保护强主题词（宿舍/课表），这类免覆盖率门槛
  for (const g of qg) {
    if (topicG.has(g) && !generic.has(g)) {
      distinctive++;
      if (hasCJK(g)) cjkDistinctive++;
      if (PROTECTED_TOPICS.has(g)) protectedHit = true;
    }
  }
  let titleDistinctTotal = 0;
  let titleDistinctHit = 0;
  for (const g of titleG) {
    if (generic.has(g)) continue;
    titleDistinctTotal++;
    if (qg.has(g)) titleDistinctHit++;
  }
  const titleCoverage = titleDistinctTotal ? titleDistinctHit / titleDistinctTotal : 0;
  return { distinctive, cjkDistinctive, titleCoverage, protectedHit };
}

// 从检索结果挑出应展示的配图。
// 闸门：区分性共享 >= 2，或（>= 1 且该词覆盖了条目标题核心 >= minCoverage）。
//   —— 挡住"零主题重合"的钓鱼问题(保研率误配)、"通用词串味"(浴室配食堂图)，
//      以及"长标题里的偶然碎片"(ChatGPT 的 gp 撞 GPA、'使用'撞正版软件条)；
//      同时保住"词即标题核心"的单词命中(食堂/保研/校历)。
// 选择：满足闸门且有图的条目里，取区分性最高的一条（并列取标题覆盖更高、再检索分更高），
//   再按原文顺序返回前 max 张（保留图与图之间的顺序关系）。
function pickImages(question, hits, opts = {}) {
  const { max = 3, minCoverage = 0.2, generic = EMPTY } = opts;
  let best = null, bestD = -1, bestCov = -1, bestScore = -1;
  for (const h of hits || []) {
    const imgs = Array.isArray(h.images) ? h.images : null;
    if (!imgs || !imgs.length) continue;
    const { distinctive, cjkDistinctive, titleCoverage, protectedHit } = relevance(question, h, generic);
    // 多词命中直接过；单词命中要求"是中文词"且（覆盖到标题核心一定比例，或命中受保护强主题词）
    //（英文碎片如 gp 撞 GPA 只有 1 个非中文重合，走不到这条，须多词命中，天然被挡）。
    const pass = distinctive >= 2 || (cjkDistinctive >= 1 && (titleCoverage >= minCoverage || protectedHit));
    if (!pass) continue;
    const score = Number(h.score) || 0;
    if (
      distinctive > bestD ||
      (distinctive === bestD && titleCoverage > bestCov) ||
      (distinctive === bestD && titleCoverage === bestCov && score > bestScore)
    ) {
      best = h; bestD = distinctive; bestCov = titleCoverage; bestScore = score;
    }
  }
  if (!best) return [];
  // 兜底：只返回带合法 url 的图（防脏数据裂图），按原文顺序去重、限量。
  const seen = new Set();
  const out = [];
  for (const im of best.images) {
    const url = im && typeof im.url === 'string' ? im.url.trim() : '';
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, desc: im && typeof im.desc === 'string' ? im.desc : '' });
    if (out.length >= max) break;
  }
  return out;
}

// 通用词集合缓存：从全库主题构建有成本，缓存 10 分钟（知识库很少变）。
// loadTopics: async () => [{question, keywords}]。构建失败则退回上次缓存或空集
// （空集时 pickImages 仍靠 distinct>=1 挡住"零重合"的明显错配，只是通用词串味会漏）。
let _genericCache = null;
let _genericAt = 0;
async function getGeneric(loadTopics, ttlMs = 10 * 60 * 1000, dfMin = 3) {
  const now = Date.now();
  if (_genericCache && now - _genericAt < ttlMs) return _genericCache;
  try {
    const topics = await loadTopics();
    _genericCache = buildGeneric(topics, dfMin);
    _genericAt = now;
  } catch (e) {
    if (!_genericCache) _genericCache = EMPTY;
  }
  return _genericCache;
}

module.exports = { pickImages, relevance, contentBigrams, buildGeneric, getGeneric };
