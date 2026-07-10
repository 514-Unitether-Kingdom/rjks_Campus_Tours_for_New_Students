const api = require('../../utils/api');

Page({
  data: {
    saves: [],
    loading: false
  },

  onShow() {
    this.loadSaves();
  },

  async loadSaves() {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    try {
      const saves = await api.getSaveSlots();
      const formatted = saves.map((item) => ({
        ...item,
        storyName: item.storyName || '浏览校园',
        nodeIndex: item.nodeIndex || 0,
        nodeSummary: item.nodeSummary || '暂无节点摘要',
        saveTime: this.formatTime(item.saveTime)
      }));

      this.setData({ saves: formatted });
    } catch (error) {
      this.setData({ saves: [] });
      wx.showToast({
        title: error.message || '存档加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return '未知时间';
    try {
      const date = new Date(timeStr);
      const pad = (value) => String(value).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch (error) {
      return timeStr;
    }
  },

  async loadSave(e) {
    const slotId = e.currentTarget.dataset.id;
    wx.showLoading({ title: '载入中...' });

    try {
      const slot = await api.loadSave(slotId);
      wx.hideLoading();
      wx.showToast({ title: '载入成功', icon: 'success' });

      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/campus-story/campus-story?startNodeId=${slot.nodeId}`
        });
      }, 500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '载入失败，请重试',
        icon: 'none'
      });
    }
  },

  deleteSave(e) {
    const slotId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确定删除此存档？',
      content: '删除后不可恢复',
      confirmColor: '#E74C3C',
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '删除中...' });
        try {
          await api.deleteSave(slotId);
          this.setData({
            saves: this.data.saves.filter((item) => String(item.slotId) !== String(slotId))
          });
          wx.hideLoading();
          wx.showToast({ title: '已删除', icon: 'success' });
        } catch (error) {
          wx.hideLoading();
          wx.showToast({
            title: error.code === 1004 ? '无权操作该存档' : (error.message || '删除失败'),
            icon: 'none'
          });
          this.loadSaves();
        }
      }
    });
  },

  onPullDownRefresh() {
    this.loadSaves().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});
