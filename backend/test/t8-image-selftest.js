/**
 * T8 AI 助手「答案配图」自测脚本
 *
 * 分两部分：
 *   A. 配图相关性闸门(services/kbImagePicker) 的纯单元测试 —— 不依赖服务/数据库，随时可跑。
 *   B. /api/ask 等接口的集成测试 —— 需后端已启动且知识库+配图已导入。
 *
 * 用法：
 *   node test/t8-image-selftest.js            # 跑 A + B（B 打 BASE_URL）
 *   ONLY_UNIT=1 node test/t8-image-selftest.js  # 只跑 A（无需起服务）
 *
 * 环境变量：
 *   BASE_URL  默认 http://localhost:3000
 *
 * 非破坏性：只用 mock 登录建/复用一个测试用户、写 qa_records（日志表），
 * 不删除任何数据，可安全对本地或云上跑。全过退出码 0，有失败为 1，可接 CI。
 *
 * 关键回归用例（曾经踩过的错配）：
 *   - off-topic 问题(天气/火锅/教务处) 不再乱配"保研率表"
 *   - 通用词串味(浴室开放时间 配成食堂图) 已挡住
 *   - hits[0] 未必最贴题(一卡通"补办"条要被选中)
 */
require('dotenv').config({ quiet: true });

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const { pickImages, relevance, buildGeneric, contentBigrams } = require('../services/kbImagePicker');

let pass = 0;
const failures = [];
const ok = (cond, label, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else { failures.push({ label, detail }); console.log(`  FAIL  ${label}${detail ? '\n        实际：' + detail : ''}`); }
};

// ---------------------------------------------------------------------------
// Part A：picker 纯单元测试
// ---------------------------------------------------------------------------
function unitTests() {
  console.log('\n== A. 配图相关性闸门 单元测试 ==');

  // 合成语料，让"开放/放时/时间"成为通用词(df>=3)，而"浴室/食堂/校门/图书"是区分词(df=1)
  const corpus = [
    { question: '浴室开放时间', keywords: '' },
    { question: '食堂开放时间', keywords: '' },
    { question: '校门开放时间表', keywords: '' },
    { question: '图书馆开放时间', keywords: '' },
    { question: '校车（班车）时间表', keywords: '通勤 班车' },
  ];
  const generic = buildGeneric(corpus, 3);
  ok(generic.has('开放'), 'buildGeneric: 高频词"开放"判为通用');
  ok(generic.has('时间'), 'buildGeneric: 高频词"时间"判为通用');
  ok(!generic.has('浴室'), 'buildGeneric: 区分词"浴室"不判为通用');
  ok(!generic.has('食堂'), 'buildGeneric: 区分词"食堂"不判为通用');

  ok(contentBigrams('校车时间').size === 3, 'contentBigrams: "校车时间"→3 个二元组');
  ok(contentBigrams('，。！ 、（）').size === 0, 'contentBigrams: 纯标点/空白→空');

  const img = (n) => Array.from({ length: n }, (_, i) => ({ url: `/kb-images/x${i}.jpg`, desc: `图${i}` }));
  const bath = { question: '浴室开放时间', keywords: '', images: img(2), score: 30 };
  const food = { question: '食堂开放时间', keywords: '', images: img(3), score: 20 };
  const noimg = { question: '浴室开放时间', keywords: '', images: null, score: 40 };

  // 1. 贴题 → 返回其图，且按 cap 截断
  ok(pickImages('浴室开放时间', [bath], { generic, max: 3 }).length === 2, '贴题条目→返回其 2 张图');
  ok(pickImages('浴室怎么用', [{ ...bath, images: img(5) }], { generic, max: 3 }).length === 3, 'cap=3 生效(5张截到3)');

  // 2. 通用词串味：问浴室，只有食堂条 → 不配（回归用例）
  ok(pickImages('浴室开放时间', [food], { generic }).length === 0, '回归:浴室问题不配食堂图(通用词过滤)');

  // 3. off-topic 零重合 → 不配（回归用例）
  ok(pickImages('今天天气怎么样', [bath, food], { generic }).length === 0, '回归:off-topic(天气)零配图');
  ok(pickImages('附近火锅推荐', [bath, food], { generic }).length === 0, '回归:off-topic(火锅)零配图');

  // 4. hits[0] 无图但 hits[1] 贴题有图 → 选 hits[1]
  const picked4 = pickImages('浴室开放时间', [noimg, bath], { generic });
  ok(picked4.length === 2, 'hits[0]无图→回退选贴题的有图条');

  // 5. 多个贴题条，取区分度最高的
  const a = { question: '校车时间表', keywords: '', images: [{ url: '/a.jpg', desc: 'A' }], score: 5 };
  const b = { question: '校车（班车）时间表', keywords: '通勤', images: [{ url: '/b.jpg', desc: 'B' }], score: 99 };
  const p5 = pickImages('校车班车时间表怎么坐', [a, b], { generic });
  ok(p5.length === 1 && p5[0].url === '/b.jpg', '并列贴题→取区分度更高那条');

  // 6. 边界：空 hits / null / 空问题
  ok(pickImages('浴室', [], { generic }).length === 0, '空 hits→[]');
  ok(pickImages('浴室', null, { generic }).length === 0, 'null hits→[]');
  ok(pickImages('', [bath], { generic }).length === 0, '空问题→[]');

  // 7. 脏数据兜底：无 url 的图被过滤、重复 url 去重
  const dirty = { question: '浴室开放时间', keywords: '',
    images: [{ url: '', desc: '坏' }, { url: '/ok.jpg', desc: '好' }, { url: '/ok.jpg', desc: '重复' }], score: 10 };
  const p7 = pickImages('浴室开放时间', [dirty], { generic });
  ok(p7.length === 1 && p7[0].url === '/ok.jpg', '脏数据:空url过滤+重复url去重→仅1张');

  // 8. relevance 数值
  const r = relevance('浴室开放时间', bath, generic);
  ok(r.distinctive >= 1, 'relevance: 浴室 vs 浴室条 有区分性重合');
  const r2 = relevance('浴室开放时间', food, generic);
  ok(r2.distinctive === 0, 'relevance: 浴室 vs 食堂条 去通用词后零重合');
}

// ---------------------------------------------------------------------------
// Part B：接口集成测试
// ---------------------------------------------------------------------------
const req = async (method, path, { token, body, raw } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (raw) return { status: r.status, headers: r.headers, buf: Buffer.from(await r.arrayBuffer()) };
  let json = null;
  try { json = await r.json(); } catch (_) {}
  return { status: r.status, json };
};
const login = async (code) => {
  const r = await req('POST', '/api/auth/wechat-login', { body: { code } });
  if (!r.json || r.json.code !== 0) throw new Error('登录失败：' + JSON.stringify(r.json));
  return r.json.data.token;
};
const ask = (token, question, extra = {}) => req('POST', '/api/ask', { token, body: { question, ...extra } });

// 流式：读完整 SSE 响应体，解析出事件数组；若是 JSON 错误则返回 {json}
const streamAsk = async (token, question) => {
  const r = await fetch(BASE + '/api/ask/stream', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  const ct = r.headers.get('content-type') || '';
  const text = await r.text();
  if (!ct.includes('text/event-stream')) {
    try { return { json: JSON.parse(text), events: [] }; } catch (_) { return { json: null, events: [] }; }
  }
  const events = text.split('\n\n')
    .filter((l) => l.startsWith('data:'))
    .map((l) => { try { return JSON.parse(l.slice(5).trim()); } catch (_) { return null; } })
    .filter(Boolean);
  return { events, status: r.status };
};
const isImgArr = (a) => Array.isArray(a) && a.every((x) => x && typeof x.url === 'string' && x.url.startsWith('/kb-images/') && typeof x.desc === 'string');

async function apiTests() {
  console.log('\n== B. /api/ask 接口集成测试（BASE=' + BASE + '） ==');
  const token = await login('t8imgtest');

  // 参数校验
  const empty = await ask(token, '   ');
  ok(empty.json && empty.json.code === 2001, '空问题→2001', JSON.stringify(empty.json));
  const long = await ask(token, '校'.repeat(501));
  ok(long.json && long.json.code === 2002, '超500字→2002', JSON.stringify(long.json));

  // 图多问题：校车时间表
  const bus = await ask(token, '校车时间表是怎样的？');
  const bd = (bus.json && bus.json.data) || {};
  ok(bus.json && bus.json.code === 0, '校车提问→code 0', JSON.stringify(bus.json));
  ok(isImgArr(bd.images) && bd.images.length >= 1, '校车→images 非空且结构合法', JSON.stringify(bd.images));
  ok((bd.images || []).some((i) => /校车|发车|时间表/.test(i.desc)), '校车→图注含校车/发车/时间表');
  ok(typeof bd.recordId === 'number', '校车→带 recordId');
  ok(Array.isArray(bd.related), '校车→带 related 关联追问数组', JSON.stringify(bd.related));

  // 单图问题：校历
  const cal = await ask(token, '最新校历是什么时候');
  const cd = (cal.json && cal.json.data) || {};
  ok(cd.images && cd.images.length >= 1 && /校历/.test(cd.images[0].desc), '校历→配到校历图', JSON.stringify(cd.images));

  // 相关性闸门：off-topic 一律不配图（回归）
  for (const [q, tag] of [['今天北京天气怎么样', '天气'], ['学校附近哪家火锅好吃', '火锅'], ['怎么去教务处', '教务处']]) {
    const r = await ask(token, q);
    const d = (r.json && r.json.data) || {};
    ok(r.json && r.json.code === 0 && Array.isArray(d.images) && d.images.length === 0, `闸门:${tag}→images 为空`, JSON.stringify(d.images));
  }

  // 宿舍：有图（回归——"宿舍"曾被误判通用词导致漏配，实际有本部/通州宿舍图）
  const dorm = await ask(token, '宿舍内部长什么样');
  const dd2 = (dorm.json && dorm.json.data) || {};
  ok(Array.isArray(dd2.images) && dd2.images.length >= 1, '宿舍问题→配到宿舍图', JSON.stringify(dd2.images));
  // ChatGPT：无图（回归——GPT/GPA 共享 gp 曾误配学分表图）
  const gpt = await ask(token, '怎么使用ChatGPT');
  const gd = (gpt.json && gpt.json.data) || {};
  ok(Array.isArray(gd.images) && gd.images.length === 0, 'ChatGPT(跑题)→无图', JSON.stringify(gd.images));

  // app_usage 类无图条目
  const save = await ask(token, '怎么存档');
  const sd = (save.json && save.json.data) || {};
  ok(Array.isArray(sd.images) && sd.images.length === 0, '无图条目(存档)→images 为空', JSON.stringify(sd.images));

  // 静态托管：返回的图能访问 + 404
  if (bd.images && bd.images.length) {
    const g = await req('GET', bd.images[0].url, { raw: true });
    ok(g.status === 200 && /image\/(jpeg|jpg)/.test(g.headers.get('content-type') || ''), '静态图可访问 200 image/jpeg', 'status=' + g.status);
    ok(g.buf && g.buf.length > 1000, '静态图有内容(>1KB)', 'bytes=' + (g.buf && g.buf.length));
    ok((g.headers.get('cache-control') || '').includes('max-age'), '静态图带缓存头');
  }
  const g404 = await req('GET', '/kb-images/__nope__.jpg', { raw: true });
  ok(g404.status === 404, '不存在的图→404', 'status=' + g404.status);

  // history 带 images
  const hist = await req('GET', '/api/ask/history', { token });
  const hd = (hist.json && hist.json.data) || [];
  const busRec = hd.find((r) => /校车/.test(r.question || ''));
  ok(busRec && Array.isArray(busRec.images) && busRec.images.length >= 1, 'history:校车记录带 images', JSON.stringify(busRec && busRec.images));

  // suggestions
  const sug = await req('GET', '/api/ask/suggestions', { token });
  ok(sug.json && sug.json.code === 0 && Array.isArray(sug.json.data) && sug.json.data.length > 0, 'suggestions 返回非空数组');

  // feedback
  if (typeof bd.recordId === 'number') {
    const fb = await req('POST', `/api/ask/${bd.recordId}/feedback`, { token, body: { value: 1 } });
    ok(fb.json && fb.json.code === 0, 'feedback 点赞成功', JSON.stringify(fb.json));
    const bad = await req('POST', `/api/ask/${bd.recordId}/feedback`, { token, body: { value: 5 } });
    ok(bad.json && bad.json.code !== 0, 'feedback 非法 value→拒绝', JSON.stringify(bad.json));
  }

  // 未登录访问 → 401
  const noauth = await req('POST', '/api/ask', { body: { question: '校车' } });
  ok(noauth.status === 401, '未登录提问→401', 'status=' + noauth.status);

  // 流式接口（用独立用户，避免和上面的提问累加触发限流）
  const stoken = await login('t8streamtest');
  const s1 = await streamAsk(stoken, '校车时间表是怎样的？');
  const deltas = s1.events.filter((e) => e.type === 'delta');
  const done = s1.events.find((e) => e.type === 'done');
  ok(deltas.length >= 1, '流式:收到 delta 文字事件', 'deltas=' + deltas.length);
  ok(!!done, '流式:收到 done 结束事件');
  ok(done && Array.isArray(done.images) && done.images.length >= 1, '流式:done 带校车配图', JSON.stringify(done && done.images));
  ok(done && Array.isArray(done.related), '流式:done 带 related 关联追问', JSON.stringify(done && done.related));
  ok(done && deltas.map((d) => d.text).join('').length > 5, '流式:拼接文字非空');
  const s2 = await streamAsk(stoken, '今天北京天气怎么样');
  const done2 = s2.events.find((e) => e.type === 'done');
  ok(done2 && Array.isArray(done2.images) && done2.images.length === 0, '流式:off-topic(天气)→done 配图为空', JSON.stringify(done2 && done2.images));
  const s3 = await streamAsk(stoken, '   ');
  ok(s3.json && s3.json.code === 2001, '流式:空问题→JSON 2001(非SSE)', JSON.stringify(s3.json));
}

// ---------------------------------------------------------------------------
(async () => {
  try {
    unitTests();
    if (!process.env.ONLY_UNIT) await apiTests();
  } catch (e) {
    console.error('\n执行异常:', e.message);
    failures.push({ label: '执行异常', detail: e.message });
  }
  console.log(`\n结果：通过 ${pass}，失败 ${failures.length}`);
  if (failures.length) { failures.forEach((f) => console.log('  - ' + f.label)); process.exit(1); }
  console.log('全部通过 ✅');
  process.exit(0);
})();
