// 管理员 openid 白名单。
//
// 作用：决定"我的"页要不要给这个微信用户显示"数据管理"入口——**只是 UI 可见性**。
//
// ⚠ 这不是鉴权边界，务必分清：
//   - 白名单只负责"藏入口"，普通用户看不到管理模式；
//   - 但它绝不下发任何权限。真正的权限校验仍在每个 /api/admin/* 接口上
//     （adminAuth 中间件 + 密码登录换取的 adminToken）。
//   - 即使有人绕过前端、手写请求直接打后台接口，也照样被 adminAuth 挡住。
//   这样即便本地 MOCK_WECHAT=true 时 openid 可被伪造（openid=mock_<code>），
//   伪造者也拿不到 adminToken（没有管理员密码），进不了后台。
//
// 配置（.env）：
//   ADMIN_OPENID_WHITELIST=openid1,openid2   逗号分隔，留空=无人可见入口（安全默认）
//   - 正式上线(MOCK_WECHAT=false)：填组员真实微信 openid。
//     获取办法：组员先登录一次，再到 users 表按姓名查其 openid 填入。
//   - 本地联调(MOCK_WECHAT=true)：openid 形如 mock_<code>；用固定 code 登录
//     （如 code=admin_rsd → openid=mock_admin_rsd）再把该值填进白名单即可自测。

// 每次读取时解析：白名单很小，不缓存；改 .env 重启后即时生效，无需清缓存。
function parseWhitelist() {
  return new Set(
    String(process.env.ADMIN_OPENID_WHITELIST || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

// 该 openid 是否在管理员白名单内
exports.isAdminOpenid = (openid) => {
  if (!openid) return false;
  return parseWhitelist().has(String(openid));
};

// 当前白名单条目数（供健康检查/日志，避免直接暴露 openid 明细）
exports.size = () => parseWhitelist().size;
