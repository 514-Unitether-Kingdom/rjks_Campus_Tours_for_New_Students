// 错误码分段（《软件设计说明》7.1）：
//   1000~1999 认证与权限   2000~2999 参数   3000~3999 业务规则
//   4000~4999 资源不存在   5000+      服务端异常
//
// 3000 与 4000 段按模块再分配，避免后端 A / B 同时新增业务码时相撞：
//   3001~3099 / 4001~4099  后端 A（认证、用户、管理员）
//   3100~3199 / 4100~4199  后端 B（剧情、勋章、存档、地图、导出）
module.exports = {
  SUCCESS: 0,

  // ---- 1000 认证与权限（公用）----
  AUTH_WECHAT_FAILED: 1001,
  AUTH_TOKEN_MISSING: 1002,
  AUTH_TOKEN_INVALID: 1003,
  PERMISSION_DENIED: 1004,   // 越权访问他人资源，随 HTTP 403 返回

  // ---- 2000 参数 ----
  PARAM_MISSING: 2001,
  PARAM_INVALID: 2002,

  // ---- 3000 业务规则 ----
  // 后端 A
  ADMIN_LOGIN_DENIED: 3001,
  ADMIN_LOCKED: 3002,
  // 后端 B
  SAVE_SLOT_FULL: 3101,                    // 存档已满，需先删除
  SAVE_NOT_ALLOWED_FOR_SHORT_STORY: 3102,  // 短剧情不支持存档
  SENSITIVE_CONTENT: 3103,                 // AI 助手：内容被安全审核拦截
  RATE_LIMITED: 3104,                      // AI 助手：提问太频繁
  AI_UNAVAILABLE: 3105,                    // AI 助手：模型暂不可用

  // ---- 4000 资源不存在 ----
  // 后端 A
  USER_NOT_FOUND: 4001,
  ADMIN_NOT_FOUND: 4002,
  // 后端 B
  STORY_NOT_FOUND: 4101,
  STORY_NODE_NOT_FOUND: 4102,
  SAVE_SLOT_NOT_FOUND: 4103,
  MAP_NOT_FOUND: 4104,
  EXPORT_NO_DATA: 4105,                    // 无数据可导出，不生成空文件（BR-36）
  QA_RECORD_NOT_FOUND: 4106,               // AI 助手：问答记录不存在
  KB_ENTRY_NOT_FOUND: 4107,                // AI 助手：知识条目不存在

  // ---- 5000 服务端 ----
  SERVER_ERROR: 5000
};
