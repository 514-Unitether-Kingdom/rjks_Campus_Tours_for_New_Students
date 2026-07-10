const api = require('../../utils/api');

Page({
  data: {
    checking: true,
    loggingIn: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  async checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ checking: false });
      return;
    }

    getApp().globalData.token = token;

    try {
      const profile = await api.getProfile();
      if (profile.name && profile.gender) {
        wx.showToast({
          title: `欢迎回来，${profile.name}`,
          icon: 'success',
          duration: 1000
        });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/home/home' });
        }, 800);
        return;
      }

      wx.redirectTo({ url: '/pages/profile/profile' });
    } catch (error) {
      api.clearLoginState();
      this.setData({ checking: false });
    }
  },

  getWechatCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (!res.code) {
            reject(new Error('授权失败，请稍后重试'));
            return;
          }

          const useRealWxCode = wx.getStorageSync('useRealWxCode') === true;
          if (useRealWxCode) {
            resolve(res.code);
            return;
          }

          let stableCode = wx.getStorageSync('mockWechatCode');
          if (!stableCode) {
            stableCode = res.code;
            wx.setStorageSync('mockWechatCode', stableCode);
          }
          resolve(stableCode);
        },
        fail: () => reject(new Error('授权失败，请稍后重试'))
      });
    });
  },

  async handleLogin() {
    if (this.data.loggingIn) return;

    this.setData({ loggingIn: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      const code = await this.getWechatCode();
      const loginResult = await api.wxLogin(code);

      wx.hideLoading();

      if (loginResult.needProfile) {
        wx.showToast({ title: '请完善个人信息', icon: 'none' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/profile/profile' });
        }, 500);
        return;
      }

      const profile = await api.getProfile();
      wx.showToast({
        title: `欢迎回来，${profile.name || '同学'}`,
        icon: 'success'
      });
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/home/home' });
      }, 700);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '网络连接失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loggingIn: false, checking: false });
    }
  }
});
