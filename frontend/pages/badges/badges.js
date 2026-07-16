const api = require('../../utils/api');

Page({
  data: { badges: [], loading: true, loadError: '', obtainedCount: 0 },
  onShow() { this.loadBadges(); },
  async loadBadges() {
    this.setData({ loading: true, loadError: '' });
    try {
      const badges = await api.getUserBadges();
      const obtainedCount = badges.filter((badge) => badge.obtained).length;
      this.setData({ badges, obtainedCount, loading: false });
      wx.setStorageSync('badgeCount', obtainedCount);
    } catch (error) {
      this.setData({ loading: false, loadError: error.message || '勋章数据加载失败' });
    }
  },
  showBadgeDetail(e) {
    const detail = e.currentTarget.dataset.detail;
    if (detail) wx.showModal({ title: '详情', content: detail, showCancel: false });
  },
  goToStoryMode() { wx.reLaunch({ url: '/pages/story-mode/story-mode' }); },
  onPullDownRefresh() { this.loadBadges().finally(() => wx.stopPullDownRefresh()); }
});
