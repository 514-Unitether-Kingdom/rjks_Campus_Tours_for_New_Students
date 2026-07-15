const api = require('../../utils/api');

Page({
  data: { badges: [], loading: true, loadError: '', obtainedCount: 0 },
  onShow() { this.loadBadges(); },
  async loadBadges() {
    this.setData({ loading: true, loadError: '' });
    try {
      const badges = (await api.getUserBadges()).map((badge) => ({
        ...badge,
        icon: ['badge_card', 'badge_print'].includes(badge.id) ? '/images/badge_gray.png' : badge.icon
      }));
      const obtainedCount = badges.filter((badge) => badge.obtained).length;
      this.setData({ badges, obtainedCount, loading: false });
      wx.setStorageSync('badgeCount', obtainedCount);
    } catch (error) {
      this.setData({ loading: false, loadError: error.message || '勋章数据加载失败' });
    }
  },
  goToStoryMode() { wx.reLaunch({ url: '/pages/story-mode/story-mode' }); },
  onPullDownRefresh() { this.loadBadges().finally(() => wx.stopPullDownRefresh()); }
});
