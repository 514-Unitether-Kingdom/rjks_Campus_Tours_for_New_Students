const api = require('../../utils/api');

Page({
  data: {
    badges: [],
    loading: true,
    obtainedCount: 0
  },

  onShow() {
    this.loadBadges();
  },

  async loadBadges() {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载勋章数据...' });
    
    try {
      const badges = await api.getUserBadges();
      
      // 在JS中计算已获得数量
      const obtainedCount = badges.filter(b => b.obtained).length;
      
      this.setData({ 
        badges,
        obtainedCount,
        loading: false 
      });
      
      wx.setStorageSync('badgeCount', obtainedCount);
      
    } catch (error) {
      console.error('加载勋章失败:', error);
      // 使用默认数据
      const defaultBadges = [
        { id: 'badge_campus', name: '🏛️ 校园探索者', icon: '/images/badge_campus.png', obtained: false, description: '完成浏览校园剧情' },
        { id: 'badge_medical', name: '🏥 医疗达人', icon: '/images/badge_medical.png', obtained: false, description: '完成医保报销剧情' },
        { id: 'badge_card', name: '💳 补办高手', icon: '/images/badge_card.png', obtained: false, description: '完成一卡通补办剧情' },
        { id: 'badge_print', name: '🖨️ 打印能手', icon: '/images/badge_print.png', obtained: false, description: '完成打印流程剧情' }
      ];
      this.setData({
        badges: defaultBadges,
        obtainedCount: 0,
        loading: false
      });
    } finally {
      wx.hideLoading();
    }
  },

  goToStoryMode() {
    wx.navigateBack();
  },

  onPullDownRefresh() {
    this.loadBadges();
    wx.stopPullDownRefresh();
  }
});
