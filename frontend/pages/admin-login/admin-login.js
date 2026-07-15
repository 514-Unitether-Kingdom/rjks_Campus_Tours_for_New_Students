const api = require('../../utils/api');

Page({
  data: {
    username: '',
    password: '',
    errorMsg: '',
    loading: false
  },

  onUserInput(e) {
    this.setData({ 
      username: e.detail.value,
      errorMsg: '' 
    });
  },

  onPwdInput(e) {
    this.setData({ 
      password: e.detail.value,
      errorMsg: '' 
    });
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
        errorMsg: error.message || '用户名或密码错误，请重试'
      });
      
      // 清空密码
      this.setData({ password: '' });
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
