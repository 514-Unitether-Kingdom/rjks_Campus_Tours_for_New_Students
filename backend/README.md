# 探校之旅 后端服务

Node.js + Express + MySQL 8。前端（微信小程序）通过 HTTPS/JSON 调用本服务。

接口文档见 [docs/T7接口契约.md](docs/T7接口契约.md)。

---

## 谁需要在本地跑后端？

| 角色 | 需要搭建本地环境吗 | 说明 |
| --- | --- | --- |
| 后端开发 | 需要 | 日常开发调试 |
| 架构 | 按需 | review 代码不需要跑起来 |
| 前端开发 | **不需要** | 只需要一个能访问的后端地址，见「前端怎么连」 |
| 测试 | **不需要** | 同上 |

数据库跑在各自机器上，别人访问不到。前端联调时要么连后端同学临时开的公网地址，要么自己搭一套。

---

## 前端怎么连

### 方式一：连别人已经跑起来的服务（推荐用于联调）

后端同学用 ngrok 把本地 3000 端口暴露成一个 https 地址，前端把 `utils/api.js` 里的 `BASE` 改成那个地址即可。**不需要装 MySQL，不需要建库。**

注意 ngrok 免费版每次重启会换域名，改了要同步给前端。

### 方式二：自己搭一套

按下面的「本地搭建」走一遍，然后 `BASE = 'http://localhost:3000'`。

无论哪种方式，微信开发者工具里都要勾上 **「不校验合法域名」**，否则 `wx.request` 会被拦截。

真机预览时域名必须加进小程序后台白名单。注意 **`request` 合法域名和 `downloadFile` 合法域名是两个独立的列表**，导出功能走的是后者，容易漏配。

---

## 本地搭建

### 1. 依赖

Node.js 18+，MySQL 8.x。

```bash
git clone https://github.com/514-Unitether-Kingdom/rjks_Campus_Tours_for_New_Students.git
cd rjks_Campus_Tours_for_New_Students/backend
npm install
```

### 2. 配置

复制 `.env.example` 为 `.env`，填上本机的数据库密码。

```
DB_PASSWORD="你的密码"
JWT_SECRET=用下面这条命令生成
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **值里如果含 `#`，必须加双引号。** `DB_PASSWORD=abc#123` 会被 dotenv 解析成 `abc`，`#` 之后的内容当注释丢掉了。

`.env` 已被 `.gitignore` 忽略，不要提交。

### 3. 建库

```sql
CREATE DATABASE IF NOT EXISTS tanxiaozhilv DEFAULT CHARSET utf8mb4;
USE tanxiaozhilv;

SOURCE sql/Script.sql;      -- users / admins
SOURCE sql/t7_schema.sql;   -- 剧情 / 节点 / 勋章 / 存档 / 流程标记 / 地图 / 日志
SOURCE sql/t7_seed.sql;     -- 初始数据
```

三个脚本必须按这个顺序执行（有外键依赖），都可以重复执行。

脚本开头有 `SET NAMES utf8mb4`，所以不用担心 Windows 上 mysql 客户端默认 GBK 导致中文入库变乱码。

### 4. 启动

```bash
npm start        # 或 npm run dev（nodemon 热重载）
```

打开 <http://localhost:3000> 看到欢迎页就说明起来了。

---

## 自测账号

| 角色 | 凭证 |
| --- | --- |
| 普通用户 | `POST /api/auth/wechat-login`，body `{"code":"任意字符串"}`（当前是模拟登录，不真的调微信） |
| 管理员 | `admin` / `123456` |

拿到 token 后所有请求带上 `Authorization: Bearer <token>`。

---

## 目录结构

```
backend/
├── app.js                 入口，注册中间件与路由
├── config/db.js           MySQL 连接池
├── middlewares/
│   ├── auth.js            用户鉴权，校验 token.type === 'user'
│   ├── adminAuth.js       管理员鉴权，校验 token.type === 'admin'
│   ├── response.js        统一响应 res.success / res.fail
│   └── errorHandler.js    全局异常兜底
├── routes/                路由定义
├── controllers/           请求处理
├── models/                数据访问
├── utils/
│   ├── jwt.js             token 签发与校验
│   ├── constants.js       错误码
│   ├── dto.js             数据库字段 -> 前端契约字段的映射
│   └── format.js          时间格式化、Excel 转义、BOM
├── sql/                   建表与初始数据
└── docs/T7接口契约.md      接口文档
```

---

## 分工

| 模块 | 负责人 |
| --- | --- |
| 项目框架、数据库连接、微信登录、个人信息、管理员认证、权限中间件、通用错误处理 | 黄懿卿（后端 A） |
| 剧情节点、办事流程标记、勋章发放、存档、地图、后台统计、Excel/TXT 导出 | 任晟达（后端 B） |
| 系统架构、数据库设计、接口规范、错误码、部署方案 | 刘宇宸（架构） |
