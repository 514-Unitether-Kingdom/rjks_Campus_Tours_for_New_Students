const BASE_URL = 'https://power-titles-hawaii-bingo.trycloudflare.com';
const REQUEST_TIMEOUT = 10000;

const getBaseUrl = () => wx.getStorageSync('apiBaseUrl') || BASE_URL;

const setBaseUrl = (url) => {
  const normalized = String(url || '').replace(/\/+$/, '');
  if (normalized) wx.setStorageSync('apiBaseUrl', normalized);
};

const clearLoginState = () => {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('hasUserInfo');
  getApp().globalData.token = null;
  getApp().globalData.userInfo = null;
};

const clearAdminState = () => {
  wx.removeStorageSync('adminToken');
  getApp().globalData.isAdmin = false;
};

const redirectToAdminLogin = () => {
  wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
  wx.redirectTo({
    url: '/pages/admin-login/admin-login',
    fail: () => wx.reLaunch({ url: '/pages/admin-login/admin-login' })
  });
};

const handleAdminAuthFailure = (reject) => {
  clearAdminState();
  redirectToAdminLogin();
  reject({ code: 1003, message: '登录已过期，请重新登录' });
};

const normalizeError = (err, fallbackMessage) => ({
  code: err && err.code ? err.code : 5000,
  message: err && err.message ? err.message : fallbackMessage,
  details: err && err.details ? err.details : null
});

const buildUrl = (path) => {
  if (/^https?:\/\//.test(path)) return path;
  return getBaseUrl() + path;
};

const getToken = (tokenKey) => wx.getStorageSync(tokenKey || 'token') || '';

const request = ({ method = 'GET', path, data = {}, auth = true, tokenKey = 'token' }) => new Promise((resolve, reject) => {
  const header = {
    'Content-Type': 'application/json'
  };
  const token = getToken(tokenKey);

  if (auth && token) {
    header.Authorization = `Bearer ${token}`;
  }

  wx.request({
    url: buildUrl(path),
    method,
    data,
    header,
    timeout: REQUEST_TIMEOUT,
    success: (res) => {
      const body = res.data || {};

      if (res.statusCode === 401 || body.code === 1002 || body.code === 1003) {
        if (tokenKey === 'adminToken') {
          clearAdminState();
          redirectToAdminLogin();
        } else {
          clearLoginState();
          wx.reLaunch({ url: '/pages/login/login' });
        }
        reject(normalizeError(body, '登录已过期，请重新登录'));
        return;
      }

      if (res.statusCode === 403 || body.code === 1004) {
        reject(normalizeError(body, '无权操作该资源'));
        return;
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(normalizeError(body, '网络连接失败，请稍后重试'));
        return;
      }

      if (body.code === 0) {
        resolve(body.data);
        return;
      }

      reject(normalizeError(body, '操作失败，请稍后重试'));
    },
    fail: () => reject({ code: 5000, message: '网络连接失败，请稍后重试' })
  });
});

const adminRequest = (method, path, data) => request({
  method,
  path,
  data,
  tokenKey: 'adminToken'
});

const normalizeProfile = (profile = {}) => ({
  id: profile.id,
  name: profile.name || '',
  gender: profile.gender || '',
  grade: profile.grade || '',
  college: profile.college || '',
  major: profile.major || '',
  registerTime: profile.register_time || profile.registerTime || '',
  avatarUrl: profile.avatarUrl || '/images/default_avatar.png'
});

const cacheProfile = (profile) => {
  const normalized = normalizeProfile(profile);
  wx.setStorageSync('userInfo', normalized);
  wx.setStorageSync('hasUserInfo', !!(normalized.name && normalized.gender));
  getApp().globalData.userInfo = normalized;
  return normalized;
};

const wxLogin = async (code) => {
  const result = await request({
    method: 'POST',
    path: '/api/auth/wechat-login',
    data: { code },
    auth: false
  });

  wx.setStorageSync('token', result.token);
  getApp().globalData.token = result.token;
  return result;
};

const getProfile = async () => {
  const profile = await request({
    method: 'GET',
    path: '/api/users/me'
  });
  return cacheProfile(profile);
};

const saveProfile = async (profileOrUserId, maybeProfile) => {
  const profile = maybeProfile || profileOrUserId;
  const saved = await request({
    method: 'PUT',
    path: '/api/users/me',
    data: profile
  });
  return cacheProfile(saved);
};

const getActiveMap = async () => request({
  method: 'GET',
  path: '/api/maps/active'
});

const getStoryList = async (type) => request({
  method: 'GET',
  path: type ? `/api/stories?type=${encodeURIComponent(type)}` : '/api/stories'
});

const getStoryNodes = async (storyId, fromNodeId) => {
  const query = fromNodeId ? `?fromNodeId=${encodeURIComponent(fromNodeId)}` : '';
  return request({
    method: 'GET',
    path: `/api/stories/${encodeURIComponent(storyId)}/nodes${query}`
  });
};

const getUserBadges = async () => request({
  method: 'GET',
  path: '/api/badges/me'
});

const completeStory = async (userIdOrStoryId, maybeStoryId) => {
  const storyId = maybeStoryId || userIdOrStoryId;
  const result = await request({
    method: 'POST',
    path: `/api/stories/${encodeURIComponent(storyId)}/complete`,
    data: {}
  });
  return { success: true, ...result };
};

const saveProgress = async (userIdOrStoryId, storyIdOrNodeId, maybeNodeId) => {
  const storyId = maybeNodeId ? storyIdOrNodeId : userIdOrStoryId;
  const nodeId = maybeNodeId || storyIdOrNodeId;
  const result = await request({
    method: 'POST',
    path: '/api/save-slots',
    data: { storyId, nodeId }
  });
  return { success: true, ...result };
};

const getSaveSlots = async () => request({
  method: 'GET',
  path: '/api/save-slots'
});

const loadSave = async (userIdOrSlotId, maybeSlotId) => {
  const slotId = maybeSlotId || userIdOrSlotId;
  const slots = await getSaveSlots();
  const slot = slots.find((item) => String(item.slotId) === String(slotId));
  if (!slot) throw { code: 4103, message: '存档不存在' };
  return slot;
};

const deleteSave = async (userIdOrSlotId, maybeSlotId) => {
  const slotId = maybeSlotId || userIdOrSlotId;
  return request({
    method: 'DELETE',
    path: `/api/save-slots/${encodeURIComponent(slotId)}`
  });
};

const getProcessMarkers = async () => request({
  method: 'GET',
  path: '/api/process-markers'
});

const adminLogin = async (username, password) => {
  const result = await request({
    method: 'POST',
    path: '/api/admin/login',
    data: { username, password },
    auth: false
  });
  const token = result.adminToken || result.token;
  wx.setStorageSync('adminToken', token);
  getApp().globalData.isAdmin = true;
  return { ...result, token };
};

const getAdminStats = async (userOrder = 'desc') => {
  const [stats, users] = await Promise.all([
    adminRequest('GET', '/api/admin/stats'),
    adminRequest('GET', `/api/admin/users?page=1&pageSize=200&order=${encodeURIComponent(userOrder)}`)
  ]);
  return {
    ...stats,
    users: users.list || [],
    userOrder: users.order || userOrder
  };
};

const getAdminStories = async () => adminRequest('GET', '/api/admin/stories');

const downloadAdminFile = (path, fileType) => new Promise((resolve, reject) => {
  wx.downloadFile({
    url: buildUrl(path),
    header: {
      Authorization: `Bearer ${getToken('adminToken')}`
    },
    success: (res) => {
      if (res.statusCode === 401) {
        handleAdminAuthFailure(reject);
        return;
      }
      if (res.statusCode === 403) {
        reject({ code: 1004, message: '无权操作该资源' });
        return;
      }
      if (res.statusCode !== 200) {
        reject({ code: 5000, message: '导出失败' });
        return;
      }
      wx.openDocument({
        filePath: res.tempFilePath,
        fileType,
        success: () => resolve({ success: true, filePath: res.tempFilePath }),
        fail: () => reject({ code: 5000, message: '文件打开失败' })
      });
    },
    fail: () => reject({ code: 5000, message: '导出失败，请检查网络' })
  });
});

const downloadAdminTextFile = (path) => new Promise((resolve, reject) => {
  wx.downloadFile({
    url: buildUrl(path),
    header: {
      Authorization: `Bearer ${getToken('adminToken')}`
    },
    success: (res) => {
      if (res.statusCode === 401) {
        handleAdminAuthFailure(reject);
        return;
      }
      if (res.statusCode === 403) {
        reject({ code: 1004, message: '无权操作该资源' });
        return;
      }
      if (res.statusCode !== 200) {
        reject({ code: 5000, message: '导出失败' });
        return;
      }

      wx.getFileSystemManager().readFile({
        filePath: res.tempFilePath,
        encoding: 'utf8',
        success: ({ data }) => resolve({
          success: true,
          filePath: res.tempFilePath,
          content: String(data || '').replace(/^\uFEFF/, '')
        }),
        fail: () => reject({ code: 5000, message: 'TXT 文件读取失败' })
      });
    },
    fail: () => reject({ code: 5000, message: '导出失败，请检查网络' })
  });
});

const exportUsers = async () => downloadAdminFile('/api/admin/export/users.xlsx', 'xlsx');
const exportStories = async () => downloadAdminTextFile('/api/admin/export/stories.txt');

// ============ AI 新生助手（T8） ============
const getAskSuggestions = async () => request({ method: 'GET', path: '/api/ask/suggestions' });
const getAskHistory = async () => request({ method: 'GET', path: '/api/ask/history' });
const sendAskFeedback = async (recordId, value) => request({
  method: 'POST',
  path: `/api/ask/${encodeURIComponent(recordId)}/feedback`,
  data: { value }
});
// 非流式提问（流式不可用时的降级）
const askQuestion = async (question) => request({ method: 'POST', path: '/api/ask', data: { question } });

// UTF-8 解码 Uint8Array。小程序 TextDecoder 支持不一，手写兜底。
const utf8Decode = (bytes) => {
  if (typeof TextDecoder !== 'undefined') {
    try { return new TextDecoder('utf-8').decode(bytes); } catch (e) { /* 手写兜底 */ }
  }
  let out = '';
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i];
    if (b < 0x80) { out += String.fromCharCode(b); i += 1; }
    else if (b >= 0xC0 && b < 0xE0) { out += String.fromCharCode(((b & 0x1F) << 6) | (bytes[i + 1] & 0x3F)); i += 2; }
    else if (b >= 0xE0 && b < 0xF0) { out += String.fromCharCode(((b & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F)); i += 3; }
    else {
      const cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) | ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F);
      const c = cp - 0x10000;
      out += String.fromCharCode(0xD800 + (c >> 10), 0xDC00 + (c & 0x3FF));
      i += 4;
    }
  }
  return out;
};
const concatBytes = (a, b) => { const r = new Uint8Array(a.length + b.length); r.set(a, 0); r.set(b, a.length); return r; };
const indexOfDoubleLF = (bytes) => {
  for (let i = 0; i + 1 < bytes.length; i++) if (bytes[i] === 0x0A && bytes[i + 1] === 0x0A) return i;
  return -1;
};

// 流式提问（SSE）。cb: onDelta(text)/onReplace(text)/onDone(payload)/onError({code,message})。
// 返回 RequestTask（可 abort）。关键：按字节找 \n\n 切完整事件，避免多字节中文在网络分片边界被切断。
// 不支持 enableChunked 的旧库/异常自动降级为非流式整段返回。
const askQuestionStream = (question, cb = {}) => {
  const { onDelta, onReplace, onDone, onError } = cb;
  let byteBuf = new Uint8Array(0);
  let sawSSE = false;
  let sawDone = false;

  const handleEvent = (obj) => {
    if (obj.type === 'delta') onDelta && onDelta(obj.text || '');
    else if (obj.type === 'replace') onReplace && onReplace(obj.text || '');
    else if (obj.type === 'done') { sawDone = true; onDone && onDone(obj); }
    else if (obj.type === 'error') { sawDone = true; onError && onError({ code: obj.code, message: obj.message }); }
  };
  const parseWholeSSE = (raw) => {
    raw.split('\n\n').forEach((seg) => {
      const line = seg.trim();
      if (!line.startsWith('data:')) return;
      sawSSE = true;
      try { handleEvent(JSON.parse(line.slice(5).trim())); } catch (e) { /* ignore */ }
    });
  };

  const task = wx.request({
    url: buildUrl('/api/ask/stream'),
    method: 'POST',
    data: { question },
    header: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken('token')}` },
    enableChunked: true,
    timeout: 30000,
    success: (res) => {
      if (sawDone) return;
      if (sawSSE) { onDone && onDone({ recordId: null, images: [], sources: [], answeredBy: 'ai', interrupted: true }); return; }
      // 没走分片：整段解析 body（旧库不分片，或校验/限流走 JSON res.fail）
      let raw = utf8Decode(byteBuf);
      if (!raw && res && res.data) raw = typeof res.data === 'string' ? res.data : utf8Decode(new Uint8Array(res.data));
      if (raw && raw.indexOf('data:') >= 0) {
        parseWholeSSE(raw);
        if (!sawDone) onDone && onDone({ recordId: null, images: [], sources: [], answeredBy: 'ai', interrupted: true });
        return;
      }
      try { const j = JSON.parse(raw); onError && onError({ code: j.code, message: j.message }); }
      catch (e) { onError && onError({ code: 5000, message: 'AI 暂时有点忙，稍后再试' }); }
    },
    fail: () => {
      // enableChunked 不被支持或网络失败 → 降级非流式
      if (!sawSSE) {
        askQuestion(question)
          .then((data) => onDone && onDone({ ...data, fallbackWhole: true }))
          .catch((err) => onError && onError({ code: err.code || 5000, message: err.message || '网络连接失败，请稍后重试' }));
      } else if (!sawDone) {
        onError && onError({ code: 5000, message: '连接中断，请重试' });
      }
    }
  });

  if (task && typeof task.onChunkReceived === 'function') {
    task.onChunkReceived((res) => {
      byteBuf = concatBytes(byteBuf, new Uint8Array(res.data));
      let i;
      while ((i = indexOfDoubleLF(byteBuf)) >= 0) {
        const seg = byteBuf.slice(0, i);
        byteBuf = byteBuf.slice(i + 2);
        const line = utf8Decode(seg).trim();
        if (!line.startsWith('data:')) continue;
        sawSSE = true;
        try { handleEvent(JSON.parse(line.slice(5).trim())); } catch (e) { /* ignore */ }
      }
    });
  }
  return task;
};

const logout = () => {
  clearLoginState();
  clearAdminState();
};

module.exports = {
  BASE_URL,
  getBaseUrl,
  setBaseUrl,
  request,
  adminRequest,
  normalizeProfile,
  cacheProfile,
  wxLogin,
  getProfile,
  saveProfile,
  getActiveMap,
  getStoryList,
  getStoryNodes,
  getUserBadges,
  completeStory,
  saveProgress,
  getSaveSlots,
  loadSave,
  deleteSave,
  getProcessMarkers,
  adminLogin,
  getAdminStats,
  getAdminStories,
  exportUsers,
  exportStories,
  getAskSuggestions,
  getAskHistory,
  sendAskFeedback,
  askQuestion,
  askQuestionStream,
  logout,
  clearLoginState,
  clearAdminState,
  redirectToAdminLogin
};
