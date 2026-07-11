// backend/controllers/authController.js
const axios = require('axios');
const User = require('../models/User');
const { signUserToken } = require('../utils/jwt');
const C = require('../utils/constants');

exports.wechatLogin = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.fail(C.PARAM_MISSING, '缺少微信code参数');
    }
    //校验 code 存在后，立即校验长度
    if (code.length > 60) {
      return res.fail(C.PARAM_INVALID, 'code 参数过长');
    }
    // 🔧 通过环境变量控制是否模拟
    const isMock = process.env.MOCK_WECHAT === 'true';

    let openid;
    if (isMock) {
      // ========== 模拟模式（开发测试用） ==========
      // 直接用 code 作为 openid，方便任意字符串登录
      openid = `mock_${code}`;
      console.log(`[模拟登录] code: ${code} -> openid: ${openid}`);
    } else {
      // ========== 真实模式（上线后使用） ==========
      const appId = process.env.WECHAT_APPID;
      const secret = process.env.WECHAT_SECRET;
      if (!appId || !secret || appId === 'mock_appid') {
        return res.fail(C.AUTH_WECHAT_FAILED, '微信配置缺失，请联系管理员');
      }
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

      try {
        const response = await axios.get(url);
        if (response.data.errcode) {
          console.error('微信登录失败:', response.data);
          return res.fail(C.AUTH_WECHAT_FAILED, '微信登录失败，请重试');
        }
        openid = response.data.openid;
        if (!openid) {
          return res.fail(C.AUTH_WECHAT_FAILED, '获取用户标识失败');
        }
        // 可存储 session_key 用于后续解密数据（当前不需要）
      } catch (err) {
        console.error('请求微信接口异常:', err.message);
        return res.fail(C.AUTH_WECHAT_FAILED, '微信服务暂不可用');
      }
    }

    // 查找或创建用户
    let user = await User.findByOpenid(openid);
    if (!user) {
      user = await User.create({ openid });
    }

    const token = signUserToken(user.id);
    const needProfile = !user.name || !user.gender;

    res.success({ token, needProfile });
  } catch (err) {
    next(err);
  }
};