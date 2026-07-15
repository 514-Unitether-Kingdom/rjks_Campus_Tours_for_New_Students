const api = require('../../utils/api');

Page({
  data: { longStories: [], loading: true, loadError: '' },

  onShow() { this.loadStories(); },

  async loadStories() {
    this.setData({ loading: true, loadError: '' });
    try {
      const stories = await api.getStoryList();
      this.setData({ longStories: stories.filter((story) => story.type === 'long'), loading: false });
    } catch (error) {
      this.setData({ loading: false, loadError: error.message || '暂时无法获取探索内容' });
    }
  },

  openStory(e) {
    wx.navigateTo({ url: `/pages/campus-story/campus-story?storyId=${e.currentTarget.dataset.id}` });
  },

  goProcessMap() { wx.navigateTo({ url: '/pages/process-map/process-map' }); },
  goBadges() { wx.navigateTo({ url: '/pages/badges/badges' }); },
  goSaves() { wx.navigateTo({ url: '/pages/saves/saves' }); }
});
