const api = require('../../utils/api');
const { CAMPUS_MAP, getLocation } = require('../../utils/campus-map');

// 以地点 ID 作为流程入口的唯一定位来源；后端旧坐标仅作为未知流程的兼容兜底。
const markerLocationIds = {
  medical: 'school_hospital',
  card: 'student_service_center'
};

const markerPositionFromLocation = (marker) => {
  const location = getLocation(markerLocationIds[marker.id]);
  if (!location) return marker;
  const center = location.points.reduce((result, point) => [result[0] + point[0], result[1] + point[1]], [0, 0])
    .map((value) => value / location.points.length);
  return {
    ...marker,
    mapPositionX: Number((center[0] / CAMPUS_MAP.width * 100).toFixed(3)),
    mapPositionY: Number((center[1] / CAMPUS_MAP.height * 100).toFixed(3))
  };
};

Page({
  data: { markers: [], loading: true, loadError: '' },

  onShow() { this.loadMarkers(); },

  async loadMarkers() {
    this.setData({ loading: true, loadError: '' });
    try {
      const markers = (await api.getProcessMarkers()).map(markerPositionFromLocation);
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
