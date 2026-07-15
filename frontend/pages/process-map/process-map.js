const api = require('../../utils/api');

Page({
  data: { markers: [], loading: true, loadError: '' },

  onShow() { this.loadMarkers(); },

  async loadMarkers() {
    this.setData({ loading: true, loadError: '' });
    try {
      const markers = await api.getProcessMarkers();
      this.setData({ markers, loading: false });
    } catch (error) {
      this.setData({ loading: false, loadError: error.message || '流程地图暂时无法加载' });
    }
  },

  selectMarker(e) {
    const marker = this.data.markers.find((item) => item.id === e.currentTarget.dataset.id);
    if (!marker) return;
    wx.showModal({
      title: marker.name,
      content: marker.completed ? '该流程已完成，可以再次体验复习。' : `准备进入「${marker.name}」短故事吗？`,
      confirmText: '进入剧情',
      success: ({ confirm }) => {
        if (confirm) wx.navigateTo({ url: `/pages/process-story/process-story?storyId=${marker.storyId}` });
      }
    });
  }
});
