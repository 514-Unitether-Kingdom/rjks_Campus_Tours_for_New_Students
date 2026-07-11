const api = require('../../utils/api');

Page({
  data: { saves: [], loading: true, loadError: '' },
  onShow() { this.loadSaves(); },
  async loadSaves() {
    this.setData({ loading: true, loadError: '' });
    try {
      const saves = await api.getSaveSlots();
      this.setData({ saves: saves.map((item) => ({ ...item, formattedTime: this.formatTime(item.saveTime) })), loading: false });
    } catch (error) {
      this.setData({ saves: [], loading: false, loadError: error.message || '存档加载失败' });
    }
  },
  formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未知时间';
    const pad = (number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}  ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },
  loadSave(e) {
    const { nodeid, storyid } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/campus-story/campus-story?storyId=${storyid}&startNodeId=${nodeid}` });
  },
  deleteSave(e) {
    const slotId = e.currentTarget.dataset.id;
    wx.showModal({ title: '删除这份存档？', content: '删除后无法恢复。', confirmColor: '#C94E45', success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        await api.deleteSave(slotId);
        wx.showToast({ title: '存档已删除', icon: 'success' });
        this.loadSaves();
      } catch (error) {
        wx.showToast({ title: error.code === 1004 ? '无权操作该存档' : (error.message || '删除失败'), icon: 'none' });
        this.loadSaves();
      }
    }});
  },
  onPullDownRefresh() { this.loadSaves().finally(() => wx.stopPullDownRefresh()); }
});
