const api = require('../../utils/api');

Page({
  data: { markers: [], loading: true, loadError: '', activeProcess: null },

  onShow() { this.loadMarkers(); },

  async loadMarkers() {
    this.setData({ loading: true, loadError: '' });
    try {
      const markers = await api.getProcessMarkers();
      this.setData({ markers, loading: false });
    } catch (error) {
      this.setData({ loading: false, loadError: error.message || '流程服务暂不可用' });
    }
  },

  selectProcess(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeProcess: this.data.markers.find((marker) => marker.id === id) || null });
  },
  noop() {},
  closeSheet() { this.setData({ activeProcess: null }); },
  enterStory() {
    const item = this.data.activeProcess;
    if (!item) return;
    this.closeSheet();
    wx.navigateTo({ url: `/pages/process-story/process-story?storyId=${item.storyId}` });
  }
});
