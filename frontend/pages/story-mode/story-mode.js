const api = require('../../utils/api');

Page({
  data: { stories: [], loading: true, loadError: '' },

  onShow() { this.loadStories(); },

  async loadStories() {
    this.setData({ loading: true, loadError: '' });
    try {
      const stories = await api.getStoryList();
      this.setData({ stories, loading: false });
    } catch (error) {
      this.setData({ loading: false, loadError: error.message || '暂时无法获取探索内容' });
    }
  },

  openStory(e) {
    const { id, type } = e.currentTarget.dataset;
    const page = type === 'long' ? 'campus-story' : 'process-story';
    wx.navigateTo({ url: `/pages/${page}/${page}?storyId=${id}` });
  },

  goProcessSelect() { wx.navigateTo({ url: '/pages/process-select/process-select' }); },
  goBadges() { wx.navigateTo({ url: '/pages/badges/badges' }); },
  goSaves() { wx.navigateTo({ url: '/pages/saves/saves' }); }
});
