// 简易内存限流：同一用户在 60 秒内最多 15 次提问。
// 防止有人狂刷烧钱或恶意攻击。重启后清零，V1 够用；
// 多实例部署时应改用 Redis 计数。
const C = require('../utils/constants');

const WINDOW_MS = 60 * 1000;
const MAX = 15;
const hits = new Map();

module.exports = (req, res, next) => {
  const key = req.user ? `u${req.user.id}` : `ip${req.ip}`;
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX) {
    return res.fail(C.RATE_LIMITED, '问得有点快，歇几秒再问吧');
  }
  arr.push(now);
  hits.set(key, arr);
  next();
};
