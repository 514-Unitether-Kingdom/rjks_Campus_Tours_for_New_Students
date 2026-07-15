const BASE_URL = 'http://localhost:3000';
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
  logout,
  clearLoginState,
  clearAdminState,
  redirectToAdminLogin
};
