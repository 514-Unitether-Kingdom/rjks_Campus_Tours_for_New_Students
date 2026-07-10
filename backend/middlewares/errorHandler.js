module.exports = (err, req, res, next) => {
  console.error('【系统异常】', err.stack);
  // 如果是我们自己抛出的业务错误（带code），就返回那个code
  if (err.code && typeof err.code === 'number') {
    // 透传 httpStatus（如果有）
    return res.fail(err.code, err.message, err.details, err.httpStatus);
  }
  // 未知的系统错误
  res.fail(5000, '服务器内部错误，请稍后重试', err.message);
};