/**
 * T7 业务接口自测脚本
 *
 * 用法：
 *   1. 确保后端已启动（npm start），数据库已按 sql/ 下三个脚本初始化
 *   2. node test/t7-selftest.js
 *
 * 可选环境变量：
 *   BASE_URL   默认 http://localhost:3000
 *   ADMIN_USER 默认 admin
 *   ADMIN_PASS 默认 rjks@bjut514
 *
 * 脚本会先清空运行时数据（users / user_badges / save_slots / story_progress /
 * user_map_views / operation_logs），不会动剧情、勋章、标记、地图这些种子数据。
 * 全部通过时退出码为 0，有失败时为 1，可直接接进 CI。
 *
 * 用例与《测试需求分析-探校之旅.md》的 FN 编号对应关系见 docs/T7接口测试说明.md。
 */
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'rjks@bjut514';

let pass = 0;
const failures = [];

const ok = (cond, label, detail = '') => {
  if (cond) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    failures.push({ label, detail });
    console.log(`  FAIL  ${label}${detail ? '\n        实际：' + detail : ''}`);
  }
};

const req = async (method, path, { token, body, raw } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (raw) return { status: r.status, headers: r.headers, buf: Buffer.from(await r.arrayBuffer()) };
  let json = null;
  try { json = await r.json(); } catch (_) { /* 二进制或空响应 */ }
  return { status: r.status, json };
};

const login = async (code) => {
  const r = await req('POST', '/api/auth/wechat-login', { body: { code } });
  if (!r.json || r.json.code !== 0) throw new Error('用户登录失败：' + JSON.stringify(r.json));
  return r.json.data.token;
};

const adminLogin = async () => {
  const r = await req('POST', '/api/admin/login', { body: { username: ADMIN_USER, password: ADMIN_PASS } });
  if (!r.json || r.json.code !== 0) throw new Error('管理员登录失败：' + JSON.stringify(r.json));
  return r.json.data.token;
};

// 清空运行时数据，保留种子数据。外键有依赖，删除顺序不能乱。
const resetRuntimeData = async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  for (const t of ['user_badges', 'save_slots', 'story_progress', 'user_map_views', 'operation_logs', 'users']) {
    await conn.query(`DELETE FROM ${t}`);
  }
  await conn.query("UPDATE admins SET failed_count = 0, locked_until = NULL WHERE username = ?", [ADMIN_USER]);
  await conn.end();
};

(async () => {
  console.log(`目标服务：${BASE}\n`);
  await resetRuntimeData();

  const A = await login('userA');
  const B = await login('userB');

  // ---------------------------------------------------------------
  console.log('【剧情节点】FN-05, FN-07');
  let r = await req('GET', '/api/stories', { token: A });
  const codes = r.json.data.map((s) => s.id);
  ok(codes.length === 2 && codes.includes('campus') && codes.includes('medical'),
    'T7-01  剧情列表只下发 enabled 的 campus 与 medical（card/print 本期隐藏）', JSON.stringify(codes));

  r = await req('GET', '/api/stories/campus/nodes', { token: A });
  const nodes = r.json.data;
  ok(nodes.length === 6 && nodes[0].id === 'n1' && nodes[5].isEnd === true,
    'T7-02  campus 返回 6 个节点，首节点 n1，末节点 isEnd=true');
  ok(typeof nodes[0].id === 'string' && !!nodes[0].bg && !!nodes[0].character && !!nodes[0].text,
    'T7-03  节点字段为 id/bg/character/characterImage/text/isEnd，且 id 是字符串');

  r = await req('GET', '/api/stories/campus/nodes?fromNodeId=n4', { token: A });
  ok(r.json.data.map((n) => n.id).join(',') === 'n4,n5,n_end',
    'T7-04  fromNodeId=n4 只返回该节点及之后（读档续读）', r.json.data.map((n) => n.id).join(','));

  r = await req('GET', '/api/stories/不存在/nodes', { token: A });
  ok(r.json.code === 4101, 'T7-05  请求不存在的剧情 → 4101', JSON.stringify(r.json));

  // card / print 本期隐藏（Q-09）。拿不到节点还不够，也不能被直接完成或存档，
  // 否则用户绕过前端发一个请求就能领走本期不该拿到的勋章。
  r = await req('GET', '/api/stories/card/nodes', { token: A });
  ok(r.json.code === 4101, 'T7-05a 请求隐藏剧情 card 的节点 → 4101', JSON.stringify(r.json));

  r = await req('POST', '/api/stories/card/complete', { token: A });
  ok(r.json.code === 4101, 'T7-05b 直接完成隐藏剧情 card → 4101，不发放 badge_card', JSON.stringify(r.json));

  r = await req('POST', '/api/save-slots', { token: A, body: { storyId: 'print', nodeId: 'p1' } });
  ok(r.json.code === 4101, 'T7-05c 对隐藏剧情 print 存档 → 4101', JSON.stringify(r.json));

  // ---------------------------------------------------------------
  console.log('\n【勋章发放】FN-08, BR-19, RSK-04');
  r = await req('POST', '/api/stories/campus/complete', { token: A });
  ok(r.json.code === 0 && r.json.data.alreadyObtained === false && r.json.data.badge.id === 'badge_campus',
    'T7-06  首次完成 campus → 发放 badge_campus，alreadyObtained=false', JSON.stringify(r.json.data));

  r = await req('POST', '/api/stories/campus/complete', { token: A });
  ok(r.json.code === 0 && r.json.data.alreadyObtained === true,
    'T7-07  重复完成 campus → alreadyObtained=true，不重复发放');

  const burst = await Promise.all(
    Array.from({ length: 10 }, () => req('POST', '/api/stories/medical/complete', { token: A }))
  );
  ok(burst.every((x) => x.json.code === 0),
    'T7-08  并发 10 次完成 medical → 无 500、无唯一键异常', JSON.stringify(burst.map((x) => x.json.code)));
  const firsts = burst.filter((x) => x.json.data && x.json.data.alreadyObtained === false).length;
  ok(firsts === 1, `T7-09  并发 10 次中恰好 1 次是首发（实际 ${firsts} 次）`);

  r = await req('GET', '/api/badges/me', { token: A });
  ok(r.json.data.length === 4, 'T7-10  勋章墙返回全部 4 枚（含未获得）');
  const got = r.json.data.filter((b) => b.obtained).map((b) => b.id);
  ok(got.length === 2 && got.includes('badge_campus') && got.includes('badge_medical'),
    'T7-11  A 恰好 2 枚已获得', JSON.stringify(got));

  r = await req('GET', '/api/badges/me', { token: B });
  ok(r.json.data.every((b) => !b.obtained), 'T7-12  B 的勋章墙全部未获得（账号隔离）');

  // ---------------------------------------------------------------
  console.log('\n【存档】FN-10, FN-11, BR-23');
  r = await req('POST', '/api/save-slots', { token: A, body: { storyId: 'medical', nodeId: 'm1' } });
  ok(r.json.code === 3102, 'T7-13  对短剧情存档 → 3102 短剧情不支持存档', JSON.stringify(r.json));

  r = await req('POST', '/api/save-slots', { token: A, body: { storyId: 'campus', nodeId: 'zzz' } });
  ok(r.json.code === 4102, 'T7-14  节点不属于该剧情 → 4102', JSON.stringify(r.json));

  r = await req('POST', '/api/save-slots', { token: A, body: { storyId: 'campus' } });
  ok(r.json.code === 2001, 'T7-15  缺少 nodeId → 2001', JSON.stringify(r.json));

  const slotIds = [];
  for (let i = 1; i <= 5; i++) {
    r = await req('POST', '/api/save-slots', { token: A, body: { storyId: 'campus', nodeId: `n${i}` } });
    slotIds.push(r.json.data && r.json.data.slotId);
    ok(r.json.code === 0 && r.json.data.slotIndex === i,
      `T7-16.${i}  第 ${i} 次存档自动分配到档位 ${i}`, JSON.stringify(r.json));
  }

  r = await req('POST', '/api/save-slots', { token: A, body: { storyId: 'campus', nodeId: 'n1' } });
  ok(r.json.code === 3101, 'T7-17  第 6 次存档 → 3101 存档已满', JSON.stringify(r.json));

  r = await req('GET', '/api/save-slots', { token: A });
  ok(r.json.code === 0 && r.json.data.length === 5, 'T7-18  不带 storyId 也能拉到存档列表');
  const s0 = r.json.data[0];
  ok(!!s0.storyName && !!s0.nodeId && !!s0.saveTime && s0.nodeSummary !== undefined,
    'T7-19  存档含 storyName / nodeId / nodeSummary / saveTime', JSON.stringify(s0));
  ok(/\d/.test(s0.nodeId), `T7-20  nodeId 含阿拉伯数字（${s0.nodeId}）`);
  ok(!Number.isNaN(Date.parse(s0.saveTime)), 'T7-21  saveTime 可被 new Date() 解析');
  const times = r.json.data.map((x) => Date.parse(x.saveTime));
  ok(times.every((v, i) => i === 0 || times[i - 1] >= v), 'T7-22  存档列表按时间倒序');

  await req('DELETE', `/api/save-slots/${slotIds[2]}`, { token: A });
  r = await req('POST', '/api/save-slots', { token: A, body: { storyId: 'campus', nodeId: 'n5' } });
  ok(r.json.code === 0 && r.json.data.slotIndex === 3,
    'T7-23  删除档位 3 后再存 → 复用最小空闲档位 3', JSON.stringify(r.json));

  // ---------------------------------------------------------------
  console.log('\n【越权】FN-11-08, BR-26, RSK-03（本模块唯一的高风险项）');
  r = await req('DELETE', `/api/save-slots/${slotIds[0]}`, { token: B });
  ok(r.status === 403 && r.json.code === 1004,
    'T7-24  B 删除 A 的存档 → HTTP 403 + 业务码 1004', `HTTP ${r.status} / code ${r.json.code}`);

  r = await req('GET', '/api/save-slots', { token: B });
  ok(r.json.data.length === 0, 'T7-25  B 看不到 A 的任何存档');

  r = await req('DELETE', '/api/save-slots/999999', { token: A });
  ok(r.json.code === 4103, 'T7-26  删除不存在的存档 → 4103', JSON.stringify(r.json));

  r = await req('GET', '/api/badges/me');
  ok(r.json.code === 1002, 'T7-27  不带 token 调用受保护接口 → 1002', JSON.stringify(r.json));

  // ---------------------------------------------------------------
  console.log('\n【办事流程标记 与 校园地图】FN-06, FN-12');
  r = await req('GET', '/api/process-markers', { token: A });
  const ids = r.json.data.map((m) => m.id);
  ok(ids.length === 1 && ids[0] === 'medical',
    'T7-28  V1.0 只下发 medical，card/print 隐藏', JSON.stringify(ids));
  ok(r.json.data[0].completed === true, 'T7-29  A 已完成 medical → completed=true');
  ok(Array.isArray(r.json.data[0].steps) && r.json.data[0].steps.length === 6,
    'T7-30  steps 为 6 步的 JSON 数组');

  r = await req('GET', '/api/process-markers', { token: B });
  ok(r.json.data[0].completed === false, 'T7-31  B 未完成 medical → completed=false（按用户计算）');

  r = await req('GET', '/api/maps/active', { token: A });
  ok(r.json.code === 0 && !!r.json.data.imageUrl, 'T7-32  地图接口返回当前生效版本', JSON.stringify(r.json.data));

  // ---------------------------------------------------------------
  console.log('\n【后台】FN-15, FN-16');
  r = await req('GET', '/api/admin/stats', { token: A });
  ok(r.json.code === 1003, 'T7-33  普通用户 token 调后台接口 → 1003（垂直越权防护）', JSON.stringify(r.json));

  const AD = await adminLogin();
  r = await req('GET', '/api/admin/stats', { token: AD });
  const st = r.json.data;
  ok(st.totalUsers === 2, `T7-34  totalUsers=2（实际 ${st.totalUsers}）`);
  ok(st.completedStories === 2, `T7-35  completedStories=2，历史累计不含重复（实际 ${st.completedStories}）`);
  ok(st.totalBadges === 2, `T7-36  totalBadges=2（实际 ${st.totalBadges}）`);

  r = await req('GET', '/api/admin/users?page=1&pageSize=10', { token: AD });
  ok(r.json.data.total === 2 && !('openid' in r.json.data.list[0]),
    'T7-37  用户列表分页正常，且不下发 openid');

  r = await req('GET', '/api/admin/stories', { token: AD });
  ok(r.json.data.length === 4 && r.json.data[0].type === '长故事',
    'T7-38  剧情树返回 4 个剧情（含 disabled），type 为中文标签');

  const xlsx = await req('GET', '/api/admin/export/users.xlsx', { token: AD, raw: true });
  ok(xlsx.status === 200 && xlsx.buf.slice(0, 2).toString() === 'PK',
    'T7-39  Excel 导出返回合法 xlsx（PK 魔数）');
  const fname = decodeURIComponent(xlsx.headers.get('x-filename') || '');
  ok(/^users_\d{8}_\d{6}\.xlsx$/.test(fname), `T7-40  文件名带可读时间戳（${fname}）`);

  const txt = await req('GET', '/api/admin/export/stories.txt', { token: AD, raw: true });
  ok(txt.buf[0] === 0xEF && txt.buf[1] === 0xBB && txt.buf[2] === 0xBF, 'T7-41  TXT 带 UTF-8 BOM');
  ok(txt.buf.includes(Buffer.from('\r\n')), 'T7-42  TXT 换行为 CRLF');
  ok(txt.buf.toString('utf8').includes('校园就介绍到这里啦'), 'T7-43  TXT 含剧情文案，中文未乱码');

  // ---------------------------------------------------------------
  console.log('\n【导出安全与空数据】BR-36, FN-15-05, FN-16-04, Q-15');
  // 把用户姓名改成 Excel 公式，验证转义
  const evil = await login('evil');
  await req('PUT', '/api/users/me', {
    token: evil,
    body: { name: '=HYPERLINK("http://evil.com","click")', gender: '男', grade: '大一', college: '信息学部', major: '软件工程' }
  });
  const xlsx2 = await req('GET', '/api/admin/export/users.xlsx', { token: AD, raw: true });
  const exceljs = require('exceljs');
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const tmp = path.join(os.tmpdir(), `t7_selftest_${Date.now()}.xlsx`);
  fs.writeFileSync(tmp, xlsx2.buf);
  const wb = new exceljs.Workbook();
  await wb.xlsx.readFile(tmp);
  fs.unlinkSync(tmp);
  const cells = wb.getWorksheet('用户数据').getColumn(2).values.filter((v) => typeof v === 'string');
  const evilCell = cells.find((v) => v.includes('HYPERLINK'));
  ok(!!evilCell && evilCell.startsWith("'"),
    'T7-44  Excel 公式注入被转义（以 = 开头的姓名加了单引号前缀）', JSON.stringify(evilCell));

  // 清空用户后导出，应拒绝而不是生成空文件
  await resetRuntimeData();
  const AD2 = await adminLogin();
  r = await req('GET', '/api/admin/export/users.xlsx', { token: AD2 });
  ok(r.json && r.json.code === 4105,
    'T7-45  无用户数据时导出 → 4105，不生成空文件', JSON.stringify(r.json));

  // ---------------------------------------------------------------
  console.log('\n────────────────────────────────');
  console.log(`通过 ${pass} 项，失败 ${failures.length} 项`);
  if (failures.length) {
    console.log('\n失败明细：');
    failures.forEach((f) => console.log(`  - ${f.label}${f.detail ? '  →  ' + f.detail : ''}`));
  }
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error('\n自测脚本异常：', e.message);
  console.error('请确认后端已启动、数据库已初始化、.env 配置正确。');
  process.exit(1);
});
