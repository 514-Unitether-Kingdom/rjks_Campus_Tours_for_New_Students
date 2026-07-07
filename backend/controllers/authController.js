const User = require('../models/User');
const { signUserToken } = require('../utils/jwt');

exports.wechatLogin = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.fail(2001, '缺少微信code参数');
    }

    // 【重要】这里为了先让前端跑通，我们模拟微信返回的openid。
    // 等正式上线再替换为真实的 axios.get('https://api.weixin.qq.com/sns/jscode2session...')
    // 为了方便测试，用 code 作为 openid（这样前端随便传个 'test123' 都能登录）
    const mockOpenid = `mock_${code}`;

    let user = await User.findByOpenid(mockOpenid);
    if (!user) {
      // 自动注册
      user = await User.create({ openid: mockOpenid });
    }

    const token = signUserToken(user.id);
    // 判断是否已经填了姓名和性别
    const needProfile = !user.name || !user.gender;

    res.success({ token, needProfile });
  } catch (err) {
    next(err);
  }
};