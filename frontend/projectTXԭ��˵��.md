
---

# 探校之旅 - 小程序原型说明文档

> 游戏化校园引导微信小程序 | 北京工业大学 · 平乐园校区

---

## 📋 目录

- 一、项目简介
- 二、技术栈
- 三、项目结构
- 四、快速开始
- 五、功能模块说明
- 六、页面路由说明
- 七、模拟数据说明
- 八、管理员后台
- 九、图片资源清单
- 十、已知问题与优化方向
- 十一、团队分工建议
- 十二、常见问题

---

## 一、项目简介

### 1.1 产品定位

面向北京工业大学新生，通过**剧情互动**和**轻量游戏化机制**，帮助新生以沉浸式、趣味化的方式熟悉校园环境与常见办事流程。

### 1.2 核心功能

| 功能 | 说明 |
| --- | --- |
| 微信授权登录 | 用户通过微信授权完成身份认证 |
| 完善个人信息 | 采集姓名、性别、年级、学院、专业 |
| 浏览校园剧情（长故事） | 通过点击推进剧情，了解校园建筑与场所 |
| 医保报销剧情（短故事） | 通过剧情互动了解医保报销流程 |
| 查看勋章 | 展示已获得和未获得的剧情完成勋章 |
| 存档/读档 | 长故事支持进度保存和载入 |
| 校园地图 | 查看平乐园校区平面图 |
| 管理员后台 | 查看注册用户、导出数据、预览剧情 |

### 1.3 成功标准

10人完成注册并使用。

---

## 二、技术栈

| 维度 | 说明 |
| --- | --- |
| 平台 | 微信小程序 |
| 前端框架 | 微信小程序原生框架 |
| 数据存储 | 微信小程序本地缓存（模拟后端） |
| 开发工具 | 微信开发者工具 |
| 版本管理 | Git |

> ⚠️ **重要说明**：当前版本为**前端原型**，所有数据均使用本地缓存模拟。后续需要接入真实后端API（微信云开发 / Node.js + MySQL）。

---

## 三、项目结构

```text
projectTX/
├── app.json                 # 小程序全局配置
├── app.js                   # 小程序入口文件
├── app.wxss                 # 全局样式
├── sitemap.json             # 站点地图配置
│
├── pages/                   # 页面目录
│   ├── login/               # 登录授权页
│   ├── profile/             # 个人信息页
│   ├── home/                # 主页面
│   ├── story-mode/          # 故事模式页
│   ├── campus-story/        # 浏览校园剧情（长故事）
│   ├── process-select/      # 办事流程选择页
│   ├── process-story/       # 办事流程剧情（短故事）
│   ├── badges/              # 勋章查看页
│   ├── saves/               # 存档页
│   ├── map/                 # 校园地图页
│   ├── my/                  # 我的页面
│   ├── admin-login/         # 管理员登录页
│   └── admin-dashboard/     # 后台管理页
│
├── utils/                   # 工具函数
│   ├── api.js               # 模拟API接口（需替换为真实接口）
│   └── data.js              # 模拟数据（剧情、勋章）
│
└── images/                  # 图片资源
    ├── icon_story.png       # 故事模式图标
    ├── icon_map.png         # 校园地图图标
    ├── icon_my.png          # 我的图标
    ├── campus_map_full.png  # 完整校园地图
    ├── badge_*.png          # 勋章图标
    ├── story_*.jpg          # 剧情背景图
    └── ...                  # 其他图片
```

---

## 四、快速开始

### 4.1 环境准备

1. 下载安装 **微信开发者工具**
   - 下载地址：[https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 克隆或下载本项目源码

### 4.2 运行步骤

```bash
# 1. 打开微信开发者工具
# 2. 点击「导入项目」
# 3. 选择项目目录：projectTX
# 4. AppID选择「测试号」
# 5. 点击「确定」
# 6. 等待编译完成
```

### 4.3 默认账号

| 角色 | 用户名 | 密码 |
| --- | --- | --- |
| 管理员 | `admin` | `123456` |

---

## 五、功能模块说明

### 5.1 用户流程

```text
进入小程序 → 微信授权登录 → 填写个人信息 → 进入主页面
```

### 5.2 长故事体验（浏览校园）

```text
主页面 → 故事模式 → 浏览校园剧情体验 → 点击推进剧情 → 
（可选）存档 → 剧情结束 → 获得勋章 → 返回故事模式
```

**特点：**

- 支持存档（最多5个）
- 支持查看历史对话
- 完成剧情自动发放勋章

### 5.3 短故事体验（医保报销等）

```text
主页面 → 故事模式 → 办事流程剧情体验 → 
点击地图标记 → 进入剧情 → 点击推进 → 剧情结束 → 获得勋章
```

**特点：**

- 不支持存档
- 完成后地图标记由感叹号变为勾
- 完成剧情自动发放勋章

### 5.4 勋章系统

```text
主页面 → 故事模式 → 查看勋章
```

- 已获得勋章：彩色显示，带✓标记
- 未获得勋章：灰色显示（锁定状态）
- 显示已获得数量统计

### 5.5 存档系统

```text
主页面 → 故事模式 → 查看存档
```

- 显示所有存档列表（存档时间、进度）
- 支持载入存档
- 支持删除存档

---

## 六、页面路由说明

| 页面路径 | 页面名称 | 说明 |
| --- | --- | --- |
| `pages/login/login` | 登录页 | 微信授权登录入口 |
| `pages/profile/profile` | 个人信息页 | 填写用户信息 |
| `pages/home/home` | 主页 | 功能入口聚合 |
| `pages/story-mode/story-mode` | 故事模式 | 剧情选择入口 |
| `pages/campus-story/campus-story` | 长故事 | 浏览校园剧情 |
| `pages/process-select/process-select` | 流程选择 | 办事流程地图选择 |
| `pages/process-story/process-story` | 短故事 | 办事流程剧情 |
| `pages/badges/badges` | 勋章 | 查看勋章列表 |
| `pages/saves/saves` | 存档 | 管理存档 |
| `pages/map/map` | 地图 | 校园地图查看 |
| `pages/my/my` | 我的 | 个人信息和管理员入口 |
| `pages/admin-login/admin-login` | 管理员登录 | 后台登录 |
| `pages/admin-dashboard/admin-dashboard` | 后台管理 | 数据统计与内容管理 |

---

## 七、模拟数据说明

### 7.1 数据存储方式

当前所有数据使用微信小程序**本地缓存**（`wx.setStorageSync` / `wx.getStorageSync`）存储。

### 7.2 缓存Key说明

| 缓存Key | 存储内容 | 示例值 |
| --- | --- | --- |
| `badges_{userId}` | 已获得的勋章ID列表 | `['badge_campus']` |
| `completed_{userId}` | 已完成的剧情ID列表 | `['campus', 'medical']` |
| `completedProcesses` | 办事流程完成状态 | `{ medical: true }` |
| `saves_{userId}` | 存档列表 | `[{ slotId, storyId, nodeId, saveTime }]` |
| `userInfo_{userId}` | 用户个人信息 | `{ name, gender, grade, college, major }` |
| `userInfo` | 当前用户信息（缓存） | `{ name, gender, ... }` |
| `adminToken` | 管理员登录令牌 | `mock_admin_token_xxx` |

### 7.3 模拟API接口（`utils/api.js`）

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| `wxLogin(code)` | 微信登录 | `code: string` |
| `saveProfile(userId, profile)` | 保存个人信息 | `userId, profile` |
| `getProfile(userId)` | 获取个人信息 | `userId` |
| `getStoryNodes(storyId)` | 获取剧情节点 | `storyId: string` |
| `getUserBadges(userId)` | 获取勋章列表 | `userId` |
| `completeStory(userId, storyId)` | 完成剧情发放勋章 | `userId, storyId` |
| `saveProgress(userId, storyId, nodeId)` | 存档 | `userId, storyId, nodeId` |
| `getSaveSlots(userId)` | 获取存档列表 | `userId` |
| `loadSave(userId, slotId)` | 载入存档 | `userId, slotId` |
| `deleteSave(userId, slotId)` | 删除存档 | `userId, slotId` |
| `adminLogin(username, password)` | 管理员登录 | `username, password` |
| `getAdminStats(token)` | 获取后台数据 | `token` |
| `exportUsers(token)` | 导出用户数据 | `token` |
| `exportStories(token)` | 导出剧情内容 | `token` |

---

## 八、管理员后台

### 8.1 登录入口

```text
主页面 → 我的 → 管理员登录
```

### 8.2 功能说明

| 功能 | 说明 |
| --- | --- |
| 总注册人数 | 显示当前注册用户总数 |
| 剧情完成数 | 显示所有剧情的完成次数 |
| 勋章发放数 | 显示已发放勋章总数 |
| 用户数据列表 | 表格显示所有注册用户信息 |
| 导出用户数据 | 导出为Excel文件（模拟） |
| 剧情内容预览 | 树形展示所有剧情节点 |
| 导出剧情内容 | 导出为TXT文件（模拟） |

### 8.3 默认账号

| 字段 | 值 |
| --- | --- |
| 用户名 | `admin` |
| 密码 | `123456` |

---

## 九、图片资源清单

### 9.1 需要添加的图片

| 图片路径 | 用途 | 尺寸建议 |
| --- | --- | --- |
| `/images/icon_story.png` | 主页-故事模式图标 | 100×100 |
| `/images/icon_map.png` | 主页-校园地图图标 | 100×100 |
| `/images/icon_my.png` | 主页-我的图标 | 100×100 |
| `/images/icon_badge.png` | 故事模式-勋章图标 | 48×48 |
| `/images/icon_save.png` | 故事模式-存档图标 | 48×48 |
| `/images/default_avatar.png` | 我的-默认头像 | 120×120 |
| `/images/campus_map_full.png` | 地图页-完整地图 | 750×600 |
| `/images/badge_campus.png` | 校园探索者勋章 | 80×80 |
| `/images/badge_medical.png` | 医疗达人勋章 | 80×80 |
| `/images/badge_card.png` | 补办高手勋章 | 80×80 |
| `/images/badge_print.png` | 打印能手勋章 | 80×80 |
| `/images/badge_gray.png` | 未获得勋章占位 | 80×80 |
| `/images/story_bg_*.jpg` | 校园剧情背景图 | 750×1334 |
| `/images/medical_bg_*.jpg` | 医保剧情背景图 | 750×1334 |
| `/images/card_bg_*.jpg` | 一卡通剧情背景图 | 750×1334 |
| `/images/print_bg_*.jpg` | 打印剧情背景图 | 750×1334 |
| `/images/character_xuejie.png` | 学姐立绘 | 300×400 |

### 9.2 图片获取建议

- **图标**：Flaticon ([https://www.flaticon.com/](https://www.flaticon.com/)) 或 Iconfont ([https://www.iconfont.cn/](https://www.iconfont.cn/))
- **背景图**：可以使用校园实拍照片
- **地图**：使用北京工业大学官方地图
- **占位方案**：先用 [https://via.placeholder.com/](https://via.placeholder.com/) 生成占位图

---

## 十、已知问题与优化方向

### 10.1 已知问题

| 问题 | 影响 | 解决方案 |
| --- | --- | --- |
| 勋章数据使用本地缓存 | 换设备或清除缓存后勋章丢失 | 接入后端API持久化存储 |
| 图片资源缺失 | 部分页面显示占位或空白 | 添加真实图片资源 |
| 剧情内容为模拟数据 | 需要替换为真实校园内容 | 撰写真实剧情脚本 |

### 10.2 优化方向

| 优先级 | 优化项 | 说明 |
| --- | --- | --- |
| 高 | 接入真实后端API | 用户数据、勋章数据、剧情数据持久化 |
| 高 | 替换真实剧情内容 | 基于学生真实经历撰写 |
| 高 | 添加真实校园地图 | 使用学校官方地图 |
| 中 | 完善UI设计 | 替换为最终设计稿 |
| 中 | 真机测试 | 在iOS和Android设备上测试 |
| 低 | 添加更多剧情 | 校园一天作息、打印流程等 |

---

## 十一、团队分工建议

| 角色 | 职责 | 人数 |
| --- | --- | --- |
| 产品经理 | 需求管理、原型验收 | 2人 |
| 前端开发 | 页面开发、UI实现、交互逻辑 | 2人 |
| 后端开发 | API开发、数据库设计、部署 | 2人 |
| 测试工程师 | 功能测试、bug跟踪 | 2人 |
| 内容策划 | 剧情脚本撰写、内容审核 | 1人 |

### 开发流程建议

```text
Phase 1: 原型确认（当前阶段）
→ 前端基于原型开发，后端设计数据库和API接口

Phase 2: 接口联调
→ 前端替换 utils/api.js 中的模拟接口为真实API
→ 后端提供完整的API文档

Phase 3: 内容填充
→ 撰写真实剧情脚本
→ 添加真实校园图片和地图

Phase 4: 测试上线
→ 功能测试、兼容性测试
→ 提交微信审核
```

---

## 十二、常见问题

### Q1: 打开项目后页面全白？

**A:** 检查以下几点：

1. 确保 `app.json` 中的页面路径正确
2. 点击「工具」→「清除缓存」→「清除全部缓存」
3. 重新编译

### Q2: 图片加载失败？

**A:** 在 `images/` 文件夹中添加对应图片，或临时使用网络占位图。

### Q3: 管理员登录失败？

**A:** 使用默认账号 `admin` / `123456`。如果还是失败，检查 `utils/api.js` 中的 `adminLogin` 函数。

### Q4: 勋章没有保存？

**A:** 当前版本使用本地缓存，清除缓存后会丢失。正式版本需要接入后端API。

### Q5: 如何真机预览？

**A:** 微信开发者工具中点击「预览」→ 扫码即可在手机上查看。

---

## 附录

### 附录A：相关文档

| 文档 | 说明 |
| --- | --- |
| 探校之旅PRD最终版.md | 产品需求文档 |
| 探校之旅-原型说明文档.md | 本文档 |

### 附录B：联系方式

如有问题，请在项目群内沟通。

---

**文档版本**：V1.0
**更新日期**：2026-07-04
**适用项目**：探校之旅 微信小程序