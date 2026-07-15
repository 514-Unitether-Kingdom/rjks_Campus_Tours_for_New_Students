// 数据库行 -> 前端契约的字段映射。
//
// 数据库用下划线命名（node_key / bg_image_url），前端 utils/api.js 里
// 已经硬编码了自己的一套字段名（id / bg / character / characterImage）。
// 《项目开发计划》3.4 把「接口响应兼容现有 utils/api.js 结构」列为关键风险，
// 所以差异统一在这一层抹平，controller 和 model 都不迁就对方。

// 剧情节点：前端 campus-story.wxml / process-story.wxml 绑定
//   currentNode.bg / .character / .characterImage / .text / .isEnd
// 注意 id 必须是字符串 node_key：
//   campus-story.js 读档时做 nodes.findIndex(n => n.id === startNodeId)，
//   而 startNodeId 来自 URL 参数永远是字符串，返回数字 id 会导致 '3' === 3 为 false。
exports.toNode = (row) => ({
  id: row.node_key,
  bg: row.bg_image_url,
  character: row.speaker,
  characterImage: row.character_image_url,
  text: row.dialogue_text,
  locationId: row.location_id || null,
  nodeType: row.node_type || 'scene',
  choices: row.choices_json ? (typeof row.choices_json === 'string' ? JSON.parse(row.choices_json) : row.choices_json) : [],
  isEnd: !!row.is_end,
  sortOrder: row.sort_order
});

// 剧情：id 用 code，前端以 'campus' / 'medical' 调用
exports.toStory = (row) => ({
  id: row.code,
  name: row.name,
  type: row.type,
  typeLabel: row.type === 'long' ? '长故事' : '短故事',
  description: row.description,
  maxSaves: row.max_saves,
  supportsSave: row.type === 'long'
});

// 勋章：前端 badges.wxml 绑定 item.id / .name / .icon / .description / .obtained
// id 用 code，因为 utils/api.js 的 ALL_BADGES 就是 'badge_campus' 这种字符串
exports.toBadge = (row, obtained) => ({
  id: row.code,
  name: row.name,
  icon: row.icon_url,
  description: row.description,
  obtained: !!obtained
});

// 存档：前端 saves.js 用 slotId / nodeId / saveTime，
// 并自行从 nodeId 里抠数字算进度、把 storyName 写死成"浏览校园"。
// 这里把 storyName / nodeIndex / nodeSummary 一并返回（待澄清事项 Q-08 的结论：
// 存档摘要须含存档时间、保存结点、对应剧情名称），前端可直接用，不必再加工。
exports.toSaveSlot = (row) => ({
  slotId: row.slot_id,
  slotIndex: row.slot_index,
  storyId: row.story_code,
  storyName: row.story_name,
  nodeId: row.node_key,
  nodeIndex: row.sort_order,
  nodeSummary: row.dialogue_text ? String(row.dialogue_text).slice(0, 20) : '',
  saveTime: row.save_time
});

// 办事流程标记：id 用 code，对应 process-select 页面标记的 data-id
exports.toMarker = (row, completed) => ({
  id: row.code,
  name: row.name,
  description: row.description,
  steps: row.steps || [],
  positionX: Number(row.position_x),
  positionY: Number(row.position_y),
  storyId: row.story_code,
  completed: !!completed
});

// 校园地图
exports.toMap = (row) => ({
  id: row.id,
  name: row.name,
  imageUrl: row.image_url,
  version: row.version
});

// 后台用户列表：不下发 openid（NFR-17 最小必要原则，
// userController.getProfile 也是特意剥离 openid 的，两处保持一致）
exports.toAdminUser = (row) => ({
  id: row.id,
  name: row.name,
  gender: row.gender,
  grade: row.grade,
  college: row.college,
  major: row.major,
  registerTime: row.register_time
});
