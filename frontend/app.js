App({
  globalData: {
    userInfo: null,
    token: null,
    isAdmin: false
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const adminToken = wx.getStorageSync('adminToken');
    const userInfo = wx.getStorageSync('userInfo');

    this.globalData.token = token || null;
    this.globalData.isAdmin = !!adminToken;
    this.globalData.userInfo = userInfo || null;
  }
});
