const api = require('../../utils/api');

Page({
  data: { activeTab: 'users', stats: { totalUsers: 0, completedStories: 0, totalBadges: 0 }, users: [], storyList: [], loading: true, loadError: '' },
  onLoad() { this.loadDashboard(); },
  async loadDashboard() {
    this.setData({ loading: true, loadError: '' });
    try {
      const [summary, stories] = await Promise.all([api.getAdminStats(), api.getAdminStories()]);
      this.setData({ stats: { totalUsers: summary.totalUsers || 0, completedStories: summary.completedStories || 0, totalBadges: summary.totalBadges || 0 }, users: summary.users || [], storyList: stories.map((story) => ({ ...story, expanded: false })), loading: false });
    } catch (error) {
      this.setData({ loading: false, loadError: error.message || '后台数据加载失败' });
    }
  },
  switchTab(e) { this.setData({ activeTab: e.currentTarget.dataset.tab }); },
  toggleStory(e) { const id = e.currentTarget.dataset.id; this.setData({ storyList: this.data.storyList.map((story) => story.id === id ? { ...story, expanded: !story.expanded } : story) }); },
  async exportUsers() { try { await api.exportUsers(); wx.showToast({ title: '已打开导出文件', icon: 'success' }); } catch (error) { wx.showToast({ title: error.message || '导出失败', icon: 'none' }); } },
  async exportStories() { try { await api.exportStories(); wx.showToast({ title: '已打开导出文件', icon: 'success' }); } catch (error) { wx.showToast({ title: error.message || '导出失败', icon: 'none' }); } },
  logout() { wx.showModal({ title: '退出后台？', content: '将清除本机管理员登录状态。', success: ({ confirm }) => { if (confirm) { api.clearAdminState(); wx.navigateBack(); } } }); }
});
