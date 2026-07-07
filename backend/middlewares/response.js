// 统一成功返回
exports.success = (res, data, message = 'success') => {
  res.status(200).json({ code: 0, message, data });
};
// 统一失败返回
exports.fail = (res, code, message, details = null) => {
  res.status(200).json({ code, message, details });
};