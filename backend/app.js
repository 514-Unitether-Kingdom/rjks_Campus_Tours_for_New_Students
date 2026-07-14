const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// 引入路由
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const storyRoutes = require('./routes/storyRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const saveSlotRoutes = require('./routes/saveSlotRoutes');
const processMarkerRoutes = require('./routes/processMarkerRoutes');
const mapRoutes = require('./routes/mapRoutes');
const askRoutes = require('./routes/askRoutes');

// 引入中间件
const errorHandler = require('./middlewares/errorHandler');
const { success, fail } = require('./middlewares/response');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 1. 安全与解析中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
// 请求无 body（如缺 Content-Type）时 express 不会填充 req.body，
// 各 controller 直接解构 req.body 会抛错并返回 5000。此处兜底为 {}，
// 让缺参数的请求正常走到参数校验（返回 2001）而非崩溃（NFR-09）。
app.use((req, res, next) => { if (req.body == null) req.body = {}; next(); });

// 2. 挂载自定义响应方法 (让 res.success 和 res.fail 可用)
// 必须先于所有路由注册：路由处理器和 auth 中间件都会调用 res.success / res.fail
app.use((req, res, next) => {
  res.success = (data, message) => success(res, data, message);
  // httpStatus 必须透传：认证失败要 401、越权要 403（FN-11-08 / BR-26）
  res.fail = (code, message, details, httpStatus) => fail(res, code, message, details, httpStatus);
  next();
});

// 2.5 知识库配图静态托管：/kb-images/xxx.jpg → backend/public/kb-images/
// AI 助手回答里的图（校历、校车时间表、地图等）由此对外提供。
// 图片已压缩(<200KB)且内容不变，给 7 天不可变缓存；
// 放开 Cross-Origin-Resource-Policy，便于小程序 <image> 跨源加载（helmet 默认 same-origin 会挡）。
app.use('/kb-images', express.static(path.join(__dirname, 'public', 'kb-images'), {
  maxAge: '7d',
  immutable: true,
  setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
}));

// 3. 注册路由（前端访问的就是这些地址）
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/save-slots', saveSlotRoutes);
app.use('/api/process-markers', processMarkerRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/ask', askRoutes);

// 4. 根路径测试
app.get('/', (req, res) => {
  res.send('探校之旅后端服务已启动！欢迎访问');
});

// 5. 全局异常捕获（必须放在所有路由之后）
app.use(errorHandler);

// 6. 启动服务
app.listen(PORT, () => {
  console.log(`✅ 后端服务运行成功！`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📌 测试登录接口: POST http://localhost:${PORT}/api/auth/wechat-login`);
});