const api = require('../../utils/api');

Page({
  data: {
    activeTab: 'users',
    stats: {
      totalUsers: 0,
      completedStories: 0,
      totalBadges: 0,
      users: []
    },
    storyList: [
      {
        id: 'campus',
        name: '浏览校园',
        type: '长故事',
        expanded: true,
        nodes: [
          { id: 'n1', character: '学姐', text: '欢迎来到北京工业大学！我是你的向导学姐...' },
          { id: 'n2', character: '学姐', text: '这是我们的主教学楼...' },
          { id: 'n3', character: '学姐', text: '那边是图书馆...' },
          { id: 'n_end', character: '学姐', text: '恭喜你完成校园探索！' }
        ]
      },
      {
        id: 'medical',
        name: '医保报销流程',
        type: '短故事',
        expanded: false,
        nodes: [
          { id: 'm1', character: '校医', text: '医保报销需要先在校医院开具转诊单...' },
          { id: 'm2', character: '校医', text: '持转诊单到指定医院就诊...' },
          { id: 'm_end', character: '校医', text: '流程就这些，祝你早日康复！' }
        ]
      },
      {
        id: 'card',
        name: '一卡通补办流程',
        type: '短故事',
        expanded: false,
        nodes: [
          { id: 'c1', character: '工作人员', text: '一卡通丢失来服务中心挂失补办...' },
          { id: 'c_end', character: '工作人员', text: '补办完成，新卡立等可取！' }
        ]
      }
    ]
  },

  async onLoad() {
    this.loadStats();
  },

  async loadStats() {
    wx.showLoading({ title: '加载数据...' });
    try {
      const token = wx.getStorageSync('adminToken') || 'mock_token';
      const stats = await api.getAdminStats(token);
      // 模拟统计数据
      this.setData({
        stats: {
          ...stats,
          completedStories: 45,
          totalBadges: 32
        }
      });
    } catch (e) {
      // 模拟数据
      this.setData({
        stats: {
          totalUsers: 28,
          completedStories: 15,
          totalBadges: 22,
          users: [
            { id: '1', name: '张三', gender: '男', college: '信息学部', registerTime: '2026-07-01 10:30' },
            { id: '2', name: '李四', gender: '女', college: '经管学院', registerTime: '2026-07-01 14:20' },
            { id: '3', name: '王五', gender: '男', college: '信息学部', registerTime: '2026-07-02 09:15' }
          ]
        }
      });
    } finally {
      wx.hideLoading();
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  toggleStory(e) {
    const id = e.currentTarget.dataset.id;
    const storyList = this.data.storyList.map(s => {
      if (s.id === id) {
        return { ...s, expanded: !s.expanded };
      }
      return s;
    });
    this.setData({ storyList });
  },

  async exportUsers() {
    wx.showLoading({ title: '导出中...' });
    try {
      const token = wx.getStorageSync('adminToken') || 'mock_token';
      await api.exportUsers(token);
      wx.hideLoading();
      wx.showToast({ title: '✅ 导出成功', icon: 'success' });
      // 模拟下载提示
      wx.showModal({
        title: '导出成功',
        content: '用户数据已导出为 Excel 文件\n\n文件名：users_20260704.xlsx',
        showCancel: false
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  async exportStories() {
    wx.showLoading({ title: '导出中...' });
    try {
      const token = wx.getStorageSync('adminToken') || 'mock_token';
      await api.exportStories(token);
      wx.hideLoading();
      wx.showToast({ title: '✅ 导出成功', icon: 'success' });
      wx.showModal({
        title: '导出成功',
        content: '剧情内容已导出为 TXT 文件\n\n文件名：stories_20260704.txt',
        showCancel: false
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出管理员登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('adminToken');
          wx.navigateBack();
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  }
});