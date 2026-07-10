# 张炜晨 - 前端 A 交接说明

## 1. 我负责的范围

根据《项目开发计划》4 节分工，前端 A 范围是：

- 登录页：`pages/login`
- 个人信息页：`pages/profile`
- 主页：`pages/home`
- 我的页：`pages/my`
- 校园地图页：`pages/map`
- 上面页面依赖的统一请求封装：`utils/api.js`

故事模式、长/短剧情、流程选择、勋章、存档、管理员后台页面属于前端 B。本次只保留这些页面的原型文件和 API 兼容函数，未替前端 B 完成页面级联调。

## 2. 已完成内容

### 登录

- 点击登录会调用 `wx.login`，再请求 `POST /api/auth/wechat-login`。
- 后端返回 `token` 后保存到 `wx.Storage` 的 `token`。
- 根据后端 `needProfile`：
  - `true`：进入个人信息页。
  - `false`：请求 `GET /api/users/me` 回填资料后进入主页。
- 页面启动时如果已有 token，会自动请求 `GET /api/users/me` 做静默登录校验。

注意：当前后端用 `code` 模拟 `openid`。为了本地联调时同一台设备能识别为同一个用户，前端默认复用第一次拿到的 `mockWechatCode`。如果后端改成真实微信 `code2Session`，在微信开发者工具控制台执行：

```js
wx.setStorageSync('useRealWxCode', true)
```

或直接删除 `pages/login/login.js` 里复用 `mockWechatCode` 的逻辑。

### 个人信息

- 进入页面会请求 `GET /api/users/me` 自动回填。
- 保存时请求 `PUT /api/users/me`。
- 姓名、性别必填；年级、学院、专业为空时提交为 `未选择`。
- 保留学院-专业联动表，覆盖项目要求中的学院和专业。

### 主页和我的

- 主页展示当前用户姓名，优先读缓存，再用 `GET /api/users/me` 刷新。
- 我的页展示姓名、学院、年级、默认头像。
- 退出登录会清除 `token`、`adminToken`、`userInfo`、`hasUserInfo`，但不清理勋章/存档缓存，符合退出登录规则。

### 校园地图

- 请求 `GET /api/maps/active` 获取当前地图。
- 支持 24 小时地图缓存；远程图片会尝试 `downloadFile + saveFile`。
- 支持双指缩放、拖动查看。
- 长按地图弹出自定义菜单，选择后保存到相册。
- 处理相册权限拒绝、图片未加载、地图接口失败等异常提示。

## 3. 如何运行

1. 先获取项目代码：

```bash
git clone https://github.com/514-Unitether-Kingdom/rjks_Campus_Tours_for_New_Students.git
```

如果已经克隆过项目，进入项目目录后拉取最新代码：

```bash
git pull
```

2. 用微信开发者工具导入小程序前端目录：

```text
rjks_Campus_Tours_for_New_Students/frontend
```

这里的 `frontend` 是仓库里的前端目录，不要求和我电脑上的路径一致。每个人按自己本机实际克隆位置选择即可。

3. 本地联调时，后端默认地址是：

```js
// utils/api.js
const BASE_URL = 'http://localhost:3000'
```

4. 如果后端同学给了 ngrok / cloudflare 等公网联调地址，推荐在微信开发者工具控制台临时设置：

```js
wx.setStorageSync('apiBaseUrl', 'https://xxxx.ngrok-free.app')
```

然后点击“编译”。这样不会把临时地址提交进仓库。

如果要恢复默认本地地址，执行：

```js
wx.removeStorageSync('apiBaseUrl')
```

5. 微信开发者工具本地调试时，建议勾选：

```text
详情 -> 本地设置 -> 不校验合法域名、web-view、TLS 版本以及 HTTPS 证书
```

6. 如果页面出现旧登录态或旧联调地址影响测试，可在控制台清理缓存后重新设置地址：

```js
wx.clearStorageSync()
wx.setStorageSync('apiBaseUrl', 'https://xxxx.ngrok-free.app')
```

## 4. 后端联调接口

前端 A 直接用到：

- `POST /api/auth/wechat-login`
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/maps/active`

共享封装里也预留了前端 B 会用到的故事、勋章、存档、流程和后台接口函数，但对应页面还需要前端 B 自己处理页面逻辑。

## 5. 建议自测流程

1. 清除微信开发者工具缓存。
2. 进入登录页，点击微信授权登录。
3. 首次登录应进入个人信息页。
4. 不填姓名保存，应提示“请填写姓名”。
5. 不选性别保存，应提示“请选择性别”。
6. 填姓名、性别、年级、学院、专业后保存，应进入主页。
7. 关闭再打开小程序，应自动进入主页，并显示欢迎用户名。
8. 从主页进入“我的”，检查个人资料展示。
9. 从“我的”进入个人信息页，检查资料回填并可修改保存。
10. 从主页进入校园地图，检查地图显示、缩放、拖动、长按保存。
11. 点击退出登录，应回到登录页，再次进入不应直接跳主页。

## 6. 交给后续同学的说明

- 前端 B 接手时重点看 `utils/api.js` 里已有函数，不要再在页面里拼 `wx.request`。
- 后端已经从 token 解析用户身份，前端不要再传 `userId`，旧原型里 `userId = token` 的写法应逐步删除。
- `process-select`、`saves`、`admin-dashboard` 仍是原型逻辑，需要前端 B 按接口契约继续改。
- 管理员账号以最新后端说明为准：`admin / rjks@bjut514`。
