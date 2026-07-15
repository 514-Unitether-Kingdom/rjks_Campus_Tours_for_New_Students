# 探校之旅 · T8 AI 新生助手 —— 前端接口说明

> 给前端 B（无鹏）做 AI 聊天页用。后端 B（任晟达）维护。
> 覆盖聊天页要用的全部接口 + **答案配图（images）的渲染约定**。
> 云上地址：`http://82.157.17.90:3000`（固定、7×24 在线）。本文档随实现更新。

---

## 0. 通用约定

- 所有接口都要登录态：请求头带 `Authorization: Bearer <token>`（token 从 `POST /api/auth/wechat-login` 拿，和其他页面一样）。
- 统一返回信封：`{ code, message, data }`。`code=0` 成功，非 0 是业务错误（`message` 可直接提示用户）。
- HTTP 基本都是 200（越权/认证除外），按 `code` 判断业务结果。
- 请求体统一 JSON、UTF-8。

---

## 1. 提问（核心接口）

**`POST /api/ask`**

请求体：

```json
{ "question": "校车时间表是怎样的？", "sessionId": "可选，用于多轮对话归组" }
```

成功返回 `data`：

```json
{
  "answer": "校车在工作日运行……具体可参考下方图片。",
  "images": [
    { "url": "/kb-images/34193bb6c543a22b.jpg", "desc": "北京工业大学校本部与通州校区之间校车（班车）发车时间表" },
    { "url": "/kb-images/87cb1e83a6ddac9e.jpg", "desc": "北京工业大学校园三维地图局部" }
  ],
  "sources": ["工大百科(学生整理)"],
  "recordId": 123,
  "answeredBy": "ai"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `answer` | string | 要展示的文字答案。可能含换行 `\n`，按普通多行文本渲染即可 |
| `images` | 数组 | **答案配图，可能为空数组 `[]`**。见第 2 节渲染约定 |
| `sources` | string[] | 资料来源，可在答案下方小字标注（可选展示） |
| `recordId` | number | 本次问答记录 id，**点赞/点踩要用它**（见第 3 节） |
| `answeredBy` | string | `ai`=模型答 / `fallback`=模型忙降级给资料 / `blocked`=内容被拦 / `error`=失败。一般不用特意区分，正常显示 answer 即可 |

常见业务错误码：

| code | 含义 | 建议提示 |
|---|---|---|
| 2001 | 没填问题 | “请输入你的问题” |
| 2002 | 问题超 500 字 | message 已含提示 |
| 3103 | 内容被安全审核拦截 | message 已含提示 |
| 3104 | 提问太频繁（限流：60 秒最多 15 次） | “问得太快啦，歇一下再问” |
| 3105 | 模型暂不可用且无资料兜底 | “AI 有点忙，稍后再问” |

---

## 2. ⭐ 答案配图（images）渲染约定

这是这次新增的重点。有些答案（校历、校车时间表、校园地图、办事流程图…）文字讲不全，靠图才清楚，所以 `/api/ask` 会在 `answer` 之外带一个 `images` 数组（最多 3 张）。

> 后端已做**相关性闸门**：只有图确实贴题时才返回。问一个知识库覆盖不到或跑题的问题（如“今天天气”），`images` 会是 `[]`，不会乱配图。所以前端**务必**按“空就不渲染”处理，不要假设一定有图。

**渲染规则：**

1. **在 `answer` 文字的下方**，按数组顺序把每张图依次渲染出来（`images[0]` 在最上）。
2. **`url` 是相对路径**，要拼上接口 base 才能用：

   ```js
   const base = wx.getStorageSync('apiBaseUrl') || 'http://82.157.17.90:3000'; // 和你发请求用的同一个 base
   const fullUrl = base + img.url;   // http://82.157.17.90:3000/kb-images/xxx.jpg
   ```

3. `<image>` 建议 `mode="widthFix"`（等比缩放、不变形），宽度撑满气泡即可。图片本身已压缩（每张 <200KB），加载很快。
4. **点击放大**：校历、时间表这类图用户需要看清细节，强烈建议给图加点击事件调 `wx.previewImage`，把这条消息的所有图 url 传进去，支持双指缩放：

   ```js
   wx.previewImage({ current: fullUrl, urls: images.map(i => base + i.url) });
   ```

5. `desc` 是图注（来自图片 OCR，偏长）。**建议只用作 `<image>` 的无障碍描述，或截断到一行小灰字**，不要整段铺出来。不想显示也行。
6. **`images` 为 `[]` 时不渲染任何图**，只显示文字。别假设一定有图。
7. **图裂兜底**：给 `<image>` 加 `binderror`，加载失败时隐藏该图（别露裂图），保证体验干净：
   ```xml
   <image ... binderror="onImgError" data-idx="{{index}}" />
   ```
   （`onImgError` 里把这张标记为隐藏即可。）

小程序 `<image>` 示例：

```xml
<block wx:for="{{msg.images}}" wx:key="url">
  <image src="{{base + item.url}}" mode="widthFix"
         bindtap="onPreview" data-url="{{base + item.url}}" />
  <text class="img-caption">{{item.desc}}</text>
</block>
```

> 说明：图片是后端静态托管的普通 http 资源，已设 7 天缓存、放开跨源策略。DevTools 里若报“不校验合法域名”，是因为联调是 http 非 https，勾上“不校验合法域名”即可，正式发布配了 https 域名就没这提示。

---

## 2.5 流式提问（聊天页主用，逐字蹦出）

**`POST /api/ask/stream`**   body 同 `/api/ask`：`{ question, sessionId? }`

返回 **SSE（`text/event-stream`）**，每个事件是一行 `data: {json}\n\n`，`type` 取值：

| type | 字段 | 含义 |
|---|---|---|
| `delta` | `{text}` | 追加一段文字（逐字/逐词） |
| `replace` | `{text}` | 用安全文案整体替换（输出被审核拦截时） |
| `done` | `{recordId, images, sources, answeredBy}` | 结束，附配图与出处（`images`/`recordId` 用法同 `/api/ask`） |
| `error` | `{code, message}` | 出错结束 |

注意：参数/限流/审核类错误（空问题、超长、被拦、限流）在进入 SSE **之前**用普通 JSON（`{code,...}`）返回，前端要能分流处理。

**前端已封装好，直接用 `utils/api.js` 的 `askQuestionStream(question, {onDelta,onReplace,onDone,onError})` 即可**，它内部处理了：按字节切 SSE（防中文在分片边界乱码）、UTF-8 手写解码、旧库不支持 chunked 时自动降级为整段返回。`onDone(payload)` 里 `payload.images` 已是数组，页面里记得拼 `getBaseUrl()`。

> 本功能已随 `pages/ai-chat/ai-chat` 聊天页交付，页面已接好流式+配图+点赞点踩，通常无需自己再对接本接口，直接用/改那个页面即可。

## 3. 点赞 / 点踩

**`POST /api/ask/:recordId/feedback`**   请求体 `{ "value": 1 }`（`1` 赞 / `-1` 踩）。
`recordId` 用第 1 节返回的那个。成功返回 `{ recordId, feedback }`。

---

## 4. 推荐问题（进页面先摆几个引导）

**`GET /api/ask/suggestions`** → `data` 是字符串数组，如 `["怎么看剧情/故事", "校车时间表", ...]`，直接做成可点的快捷气泡，点了就当 question 发起提问。

---

## 5. 历史记录

**`GET /api/ask/history`** → `data` 是该用户最近 20 条问答，每条：

```json
{ "id": 123, "question": "...", "answer": "...", "images": [...], "feedback": 0, "created_at": "..." }
```

`images` 字段规则和第 2 节完全一致（可能为 `null` 或数组）。渲染历史里的图同样拼 base。

---

## 6. 一句话总结给前端

聊天页正常显示 `answer` 文字；**如果 `images` 非空，就在文字下方按顺序渲染图（url 记得拼 base、加点击预览）**；点赞点踩带上 `recordId`。就这些。有问题直接找我（任晟达）。
