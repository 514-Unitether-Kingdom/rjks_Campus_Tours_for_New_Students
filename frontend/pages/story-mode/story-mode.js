Page({
  goCampusStory() {
    wx.navigateTo({ url: '/pages/campus-story/campus-story' });
  },

  goProcessSelect() {
    wx.navigateTo({ url: '/pages/process-select/process-select' });
  },

  goBadges() {
    wx.navigateTo({ url: '/pages/badges/badges' });
  },

  goSaves() {
    wx.navigateTo({ url: '/pages/saves/saves' });
  }
});