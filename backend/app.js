const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// 引入路由
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const storyRoutes = require('./routes/storyRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const saveSlotRoutes = require('./routes/saveSlotRoutes');
const processMarkerRoutes = require('./routes/processMarkerRoutes');

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
app.use('/api/badges', badgeRoutes);
app.use('/api/save-slots', saveSlotRoutes);
app.use('/api/process-markers', processMarkerRoutes);

// 2. 挂载自定义响应方法 (让 res.success 和 res.fail 可用)
app.use((req, res, next) => {
  res.success = (data, message) => success(res, data, message);
  res.fail = (code, message, details) => fail(res, code, message, details);
  next();
});

// 3. 注册路由（前端访问的就是这些地址）
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stories', storyRoutes);

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