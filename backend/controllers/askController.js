const db = require('../config/db');
const KbEntry = require('../models/KbEntry');
const QaRecord = require('../models/QaRecord');
const deepseek = require('../services/deepseek');
const moderation = require('../services/moderation');
const kbImagePicker = require('../services/kbImagePicker');
const C = require('../utils/constants');

// AI 新生助手的角色与规则。
// 核心：学校事实只能来自"参考资料"，没有就说不确定、别编。
const SYSTEM_PROMPT = `你是"探校之旅"小程序里的北京工业大学平乐园校区新生助手。
请遵守：
1. 关于学校的具体事实（办事流程、地点、电话、时间、找哪个部门），只能依据下面提供的"参考资料"回答。参考资料里没有的，就明确说"这个我不太确定，建议咨询相关部门或辅导员"，绝不要编造电话、地点、时间或步骤。
2. 关于小程序怎么用，可依据参考资料回答。
3. 其他通用问题可以简短回答，但要提醒"仅供参考"。
4. 用中文回答，口吻亲切、简洁，直接说重点，别啰嗦。
5. 回答用纯文本，不要用 Markdown 标记（不要出现 ** 加粗、## 标题、- 列表符号），因为展示端不渲染 Markdown 会露出原始符号。需要分点时用"1. 2. 3."或"①②③"或直接换行。`;

const buildContext = (hits) => {
  if (!hits.length) return '（没有检索到相关的学校资料）';
  return hits
    .map((h, i) => {
      const contact = h.contact ? `\n相关信息：${h.contact}` : '';
      const src = h.source ? `\n来源：${h.source}` : '';
      return `【资料${i + 1}】${h.question}\n${h.answer}${contact}${src}`;
    })
    .join('\n\n');
};

// 检索 + 配图相关性闸门 + 组织给模型的消息。ask 与 askStream 共用。
// 配图：从检索结果挑"确实贴题且有图"的一条（相关性闸门，宁少勿错），
// off-topic 问题不会乱配图；命中就在提示里告知模型下方会配图，引导自然看图。
async function buildAskContext(question) {
  const hits = await KbEntry.search(question, 5);
  const generic = await kbImagePicker.getGeneric(() => KbEntry.allTopics());
  const responseImages = kbImagePicker.pickImages(question, hits, { max: 3, generic });

  let userContent = `参考资料：\n${buildContext(hits)}\n\n用户问题：${question}`;
  if (responseImages.length) {
    const captions = responseImages.map((im) => im.desc).filter(Boolean).join('、');
    userContent +=
      `\n\n（系统会自动在你的回答下方展示 ${responseImages.length} 张相关图片${captions ? '：' + captions : ''}。` +
      `若这些图能直接回答用户，请在文字里自然地提示"具体可参考下方图片"，但不要编造图片里的具体数字、时间或内容。）`;
  }
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent }
  ];
  const related = relatedQuestions(hits, question, generic);
  return { hits, responseImages, messages, related };
}

// 章节/索引页标题——不适合当"猜你想问"的追问，过滤掉。
const CHAPTER_TITLES = new Set([
  '工大百科', '热门问题', '信息服务', '好好学习', '新生答疑',
  '组织和社团', '温暖工大', '经验分享', '宿舍介绍', '生活服务'
]);

// 关联追问："猜你想问"。取检索结果里主答案之外、且与问题有区分性重合的相关条目标题
//（跳过 hits[0]、章节索引页、以及只靠"时间"这类通用词相邻的弱相关项——如"校车"配"保研"）。
// 基于知识库、动态相关、零额外模型调用。宁可少也不放不相关的；没有就不展示。
function relatedQuestions(hits, question, generic, max = 3) {
  const out = [];
  const seen = new Set([String(question || '').trim()]);
  for (const h of (hits || []).slice(1)) {
    const q = (h.question || '').trim();
    if (!q || seen.has(q) || CHAPTER_TITLES.has(q)) continue;
    seen.add(q);
    const { distinctive } = kbImagePicker.relevance(question, h, generic);
    if (distinctive < 1) continue; // 只留真正贴题的
    out.push(q);
    if (out.length >= max) break;
  }
  return out;
}

// 模型忙时的资料兜底文案（有检索结果才用）
const fallbackAnswer = (hits) =>
  '（AI 暂时忙，先把找到的资料给你）\n\n' +
  hits
    .slice(0, 2)
    .map((h) => `· ${h.question}\n${h.answer}${h.contact ? '（' + h.contact + '）' : ''}`)
    .join('\n\n');

// POST /api/ask  body: { question, sessionId? }
exports.ask = async (req, res, next) => {
  const userId = req.user.id;
  const sessionId = req.body.sessionId || null;
  try {
    const question = String(req.body.question || '').trim();
    if (!question) return res.fail(C.PARAM_MISSING, '请输入你的问题');
    if (question.length > 500) return res.fail(C.PARAM_INVALID, '问题太长了，精简到 500 字以内');

    // 1. 输入内容审核
    if (moderation.isBlocked(question)) {
      await QaRecord.create({ userId, sessionId, question, answer: '', answeredBy: 'blocked' });
      return res.fail(C.SENSITIVE_CONTENT, '这个问题不太方便回答，换个问法试试');
    }

    // 2~3. 检索知识库 + 配图闸门 + 组织消息（与 askStream 共用）
    const { hits, responseImages: picked, messages, related } = await buildAskContext(question);
    let responseImages = picked;

    // 4. 调模型；失败就降级
    let answer;
    let answeredBy = 'ai';
    try {
      answer = await deepseek.chat(messages);
    } catch (e) {
      console.warn('[ask] 模型调用失败:', e.message);
      if (hits.length) {
        answer = fallbackAnswer(hits); // 有检索结果 → 退回资料原文
        answeredBy = 'fallback';
      } else {
        await QaRecord.create({ userId, sessionId, question, answer: '', answeredBy: 'error' });
        return res.fail(C.AI_UNAVAILABLE, 'AI 暂时有点忙，稍等再问一次');
      }
    }

    // 5. 输出内容审核
    if (moderation.isBlocked(answer)) {
      answer = '这个问题我暂时不方便回答，建议咨询老师或相关部门。';
      answeredBy = 'blocked';
      responseImages = []; // 答案被拦，配图也不展示
    }

    // 6. 存记录
    const sources = hits.map((h) => h.source).filter(Boolean);
    const category = hits[0] ? hits[0].category : '';
    const recordId = await QaRecord.create({
      userId, sessionId, question, answer,
      images: responseImages.length ? responseImages : null,
      sources: sources.join('; '), category, answeredBy
    });

    // 7. 返回答案 + 配图 + 关联追问 + 出处
    res.success({ answer, images: responseImages, related, sources, recordId, answeredBy });
  } catch (err) {
    next(err);
  }
};

// POST /api/ask/stream  body: { question, sessionId? }
// 流式版：用 SSE（text/event-stream）边生成边推，前端逐字渲染。
// 事件都是 `data: {json}\n\n`，type 取值：
//   delta   {text}          —— 追加一段文字
//   replace {text}          —— 用安全文案整体替换（输出被审核拦截时）
//   done    {recordId, images, sources, answeredBy} —— 结束，附配图与出处
//   error   {code, message} —— 出错结束
// 参数/审核类错误在设置 SSE 头之前用普通 JSON(res.fail) 返回，前端据此分流。
exports.askStream = async (req, res, next) => {
  const userId = req.user.id;
  const sessionId = req.body.sessionId || null;
  try {
    const question = String(req.body.question || '').trim();
    if (!question) return res.fail(C.PARAM_MISSING, '请输入你的问题');
    if (question.length > 500) return res.fail(C.PARAM_INVALID, '问题太长了，精简到 500 字以内');
    if (moderation.isBlocked(question)) {
      await QaRecord.create({ userId, sessionId, question, answer: '', answeredBy: 'blocked' });
      return res.fail(C.SENSITIVE_CONTENT, '这个问题不太方便回答，换个问法试试');
    }

    const { hits, responseImages: picked, messages, related } = await buildAskContext(question);
    let responseImages = picked;

    // 开启 SSE。X-Accel-Buffering:no 防反代缓冲；关掉压缩缓冲影响。
    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    const send = (obj) => {
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    };

    let answer = '';
    let answeredBy = 'ai';
    try {
      answer = await deepseek.chatStream(messages, (delta) => send({ type: 'delta', text: delta }));
    } catch (e) {
      console.warn('[askStream] 模型调用失败:', e.message);
      if (hits.length) {
        answer = fallbackAnswer(hits);
        answeredBy = 'fallback';
        send({ type: 'delta', text: answer }); // 兜底文案整段推一次
      } else {
        await QaRecord.create({ userId, sessionId, question, answer: '', answeredBy: 'error' });
        send({ type: 'error', code: C.AI_UNAVAILABLE, message: 'AI 暂时有点忙，稍等再问一次' });
        return res.end();
      }
    }

    // 输出内容审核：整段生成完再查，命中则整体替换为安全文案、撤掉配图
    if (moderation.isBlocked(answer)) {
      answer = '这个问题我暂时不方便回答，建议咨询老师或相关部门。';
      answeredBy = 'blocked';
      responseImages = [];
      send({ type: 'replace', text: answer });
    }

    const sources = hits.map((h) => h.source).filter(Boolean);
    const category = hits[0] ? hits[0].category : '';
    const recordId = await QaRecord.create({
      userId, sessionId, question, answer,
      images: responseImages.length ? responseImages : null,
      sources: sources.join('; '), category, answeredBy
    });

    send({ type: 'done', recordId, images: responseImages, related, sources, answeredBy });
    res.end();
  } catch (err) {
    // 已进入 SSE 之后出错：以 error 事件收尾；否则交给全局兜底
    if (res.headersSent) {
      try { res.write(`data: ${JSON.stringify({ type: 'error', code: C.SERVER_ERROR || 5000, message: '服务异常' })}\n\n`); } catch (_) {}
      return res.end();
    }
    next(err);
  }
};

// POST /api/ask/:recordId/feedback  body: { value: 1 | -1 }
exports.feedback = async (req, res, next) => {
  try {
    const recordId = Number(req.params.recordId);
    const value = Number(req.body.value);
    if (![1, -1].includes(value)) return res.fail(C.PARAM_INVALID, 'value 只能是 1（赞）或 -1（踩）');
    const ok = await QaRecord.setFeedback(recordId, req.user.id, value);
    if (!ok) return res.fail(C.QA_RECORD_NOT_FOUND, '记录不存在或无权操作');
    res.success({ recordId, feedback: value });
  } catch (err) {
    next(err);
  }
};

// GET /api/ask/suggestions —— 推荐问题，进页面先摆几个引导用户
exports.suggestions = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT question FROM kb_entries WHERE status = 'enabled' ORDER BY category, id LIMIT 8"
    );
    res.success(rows.map((r) => r.question));
  } catch (err) {
    next(err);
  }
};

// GET /api/ask/history —— 用户自己的提问历史
exports.history = async (req, res, next) => {
  try {
    res.success(await QaRecord.listByUser(req.user.id, 20));
  } catch (err) {
    next(err);
  }
};
