const api = require('../../utils/api');

Page({
  data: {
    userInfo: {
      name: '',
      college: '',
      grade: '',
      avatarUrl: ''
    },
    showAdminEntry: false
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
    this.loadAdminEntry();
  },

  async loadUserInfo() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }

    const cached = wx.getStorageSync('userInfo') || {};
    this.renderUserInfo(cached);

    try {
      const profile = await api.getProfile();
      this.renderUserInfo(profile);
    } catch (error) {
      if (!cached.name) {
        wx.showToast({ title: '用户信息加载失败', icon: 'none' });
      }
    }
  },

  async loadAdminEntry() {
    this.setData({ showAdminEntry: false });
    const token = wx.getStorageSync('token');
    if (!token) {
      return;
    }

    try {
      const result = await api.checkAdminEligibility();
      this.setData({ showAdminEntry: !!(result && result.canAdmin) });
    } catch (error) {
      this.setData({ showAdminEntry: false });
    }
  },

  renderUserInfo(userInfo = {}) {
    this.setData({
      userInfo: {
        name: userInfo.name || '新同学',
        college: userInfo.college || '未设置学院',
        grade: userInfo.grade || '未设置年级',
        avatarUrl: userInfo.avatarUrl || (userInfo.gender === '女' ? '/images/avatar_female.png' : userInfo.gender === '男' ? '/images/avatar_male.png' : '/images/default_avatar.png')
      }
    });
  },

  goProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  },

  goBadges() {
    wx.navigateTo({
      url: '/pages/badges/badges'
    });
  },

  goAdmin() {
    wx.navigateTo({
      url: '/pages/admin-login/admin-login'
    });
  },

  handleLogout() {
    wx.showModal({
      title: '确定退出登录？',
      content: '退出后需重新登录',
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          this.doLogout();
        }
      }
    });
  },

  doLogout() {
    this.setData({ showAdminEntry: false });
    api.logout();
    wx.showToast({
      title: '已安全退出',
      icon: 'success'
    });

    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }, 700);
  }
});
