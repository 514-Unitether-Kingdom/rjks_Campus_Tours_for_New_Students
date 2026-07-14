const api = require('../../utils/api');

Page({
  data: {
    userName: ''
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }

    const cached = wx.getStorageSync('userInfo') || {};
    this.setData({
      userName: cached.name || '新同学'
    });

    try {
      const profile = await api.getProfile();
      this.setData({
        userName: profile.name || '新同学'
      });
    } catch (error) {
      if (!cached.name) {
        wx.showToast({ title: '用户信息加载失败', icon: 'none' });
      }
    }
  },

  goToStoryMode() {
    wx.navigateTo({ url: '/pages/story-mode/story-mode' });
  },

  goToMap() {
    wx.navigateTo({ url: '/pages/map/map' });
  },

  goToMy() {
    wx.navigateTo({ url: '/pages/my/my' });
  },

  goToAiChat() {
    wx.navigateTo({ url: '/pages/ai-chat/ai-chat' });
  }
});
