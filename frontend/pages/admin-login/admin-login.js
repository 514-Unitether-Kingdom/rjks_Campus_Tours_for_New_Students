const api = require('../../utils/api');

Page({
  data: {
    username: '',
    password: '',
    errorMsg: '',
    loading: false,
    canSubmit: false
  },

  updateSubmitState(username, password) {
    this.setData({
      canSubmit: !!(username.trim() && password.trim())
    });
  },

  onUserInput(e) {
    const username = e.detail.value;
    this.setData({ 
      username,
      errorMsg: '' 
    });
    this.updateSubmitState(username, this.data.password);
  },

  onPwdInput(e) {
    const password = e.detail.value;
    this.setData({ 
      password,
      errorMsg: '' 
    });
    this.updateSubmitState(this.data.username, password);
  },

  async login() {
    const { username, password } = this.data;
    
    // 表单校验
    if (!username.trim()) {
      this.setData({ errorMsg: '请输入用户名' });
      return;
    }
    if (!password.trim()) {
      this.setData({ errorMsg: '请输入密码' });
      return;
    }
    if (username.trim() !== username.trim().toLowerCase()) {
      this.setData({
        password: '',
        canSubmit: false,
        errorMsg: '用户名或密码错误，请重试'
      });
      return;
    }

    this.setData({ loading: true, errorMsg: '' });
    wx.showLoading({ title: '登录中...' });

    try {
      const result = await api.adminLogin(username.trim(), password.trim());
      
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      
      // 保存token
      wx.setStorageSync('adminToken', result.token);
      
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/admin-dashboard/admin-dashboard'
        });
      }, 500);

    } catch (error) {
      wx.hideLoading();
      this.setData({ 
        loading: false,
        errorMsg: error.message || '用户名或密码错误，请重试',
        password: '',
        canSubmit: false
      });
    }
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
