// 统一成功返回
exports.success = (res, data, message = 'success') => {
  res.status(200).json({ code: 0, message, data });
};

// 统一失败返回
//
// httpStatus 默认 200：微信小程序的 wx.request 对非 2xx 响应不走 fail 回调，
// 普通业务错误用「HTTP 200 + 业务码」前端更好处理。
// 但认证失败与越权必须返回真实的 401 / 403：
//   - 《软件设计说明》7.1：认证与权限错误返回 401/403
//   - 测试用例 FN-11-08 / BR-26 / RSK-03 按 403 验收「越权删除他人存档」
// 该参数向后兼容，既有调用无需修改。
exports.fail = (res, code, message, details = null, httpStatus = 200) => {
  res.status(httpStatus).json({ code, message, details });
};
