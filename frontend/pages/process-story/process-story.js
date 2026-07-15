const api = require('../../utils/api');

const normalizeNodeAssets = (node) => ({
  ...node,
  // locationId 由剧情接口按节点返回；兼容后端尚未统一字段名的过渡阶段。
  locationId: node.locationId || node.location_id || '',
  nodeType: node.nodeType || node.node_type || 'scene',
  choices: Array.isArray(node.choices) ? node.choices : [],
  // 当前素材包将 1~3 张医保流程背景合并为一个文件名；接口仍按单张名称返回。
  bg: /^\/images\/medical_bg[1-3]\.jpg$/.test(node.bg || '') ? '/images/medical_bg1~3.jpg' : node.bg
});

Page({
  data: { storyId: 'medical', storyName: '办事流程', nodes: [], currentNode: null, currentIndex: 0, history: [], isCompleted: false, isEnding: false, showLocationMap: false },
  onLoad(options) { const storyId = options.storyId || 'medical'; this.setData({ storyId }); this.loadStory(storyId); },
  async loadStory(storyId) {
    wx.showLoading({ title: '载入流程' });
    try {
      const nodes = (await api.getStoryNodes(storyId)).map(normalizeNodeAssets);
      if (!nodes.length) throw { message: '当前流程暂无内容' };
      this.setData({ nodes, currentIndex: 0, currentNode: nodes[0], history: [nodes[0]], showLocationMap: false });
    } catch (error) {
      wx.showModal({ title: '无法载入流程', content: error.message || '请检查网络后重试', showCancel: false, success: () => wx.navigateBack() });
    } finally { wx.hideLoading(); }
  },
  onTap() {
    if (this.data.isEnding || this.data.isCompleted) return;
    if (this.data.currentNode.choices && this.data.currentNode.choices.length) return;
    if (this.data.currentNode.isEnd || this.data.currentIndex + 1 >= this.data.nodes.length) return this.completeStory();
    const currentIndex = this.data.currentIndex + 1;
    const currentNode = this.data.nodes[currentIndex];
    this.setData({ currentIndex, currentNode, history: [...this.data.history, currentNode], showLocationMap: false });
  },
  selectChoice(e) {
    const targetNodeId = e.currentTarget.dataset.target;
    const currentIndex = this.data.nodes.findIndex((node) => node.id === targetNodeId);
    if (currentIndex < 0) return wx.showToast({ title: '路线节点暂未配置', icon: 'none' });
    const currentNode = this.data.nodes[currentIndex];
    this.setData({ currentIndex, currentNode, history: [...this.data.history, currentNode], showLocationMap: false });
  },
  async completeStory() {
    if (this.data.isEnding || this.data.isCompleted) return;
    this.setData({ isEnding: true });
    try {
      const result = await api.completeStory(this.data.storyId);
      this.setData({ isCompleted: true, isEnding: false });
      if (result.alreadyObtained) {
        wx.navigateBack();
        return;
      }
      wx.showModal({ title: '获得新勋章', content: result.badge ? `已获得「${result.badge.name}」` : '完成记录已保存。', showCancel: false, success: () => wx.navigateBack() });
    } catch (error) {
      this.setData({ isEnding: false });
      wx.showToast({ title: error.message || '结算失败，请重试', icon: 'none' });
    }
  },
  goPrevious() {
    if (this.data.history.length <= 1) {
      wx.showToast({ title: '已经是第一页', icon: 'none' });
      return;
    }
    const history = this.data.history.slice(0, -1);
    const currentNode = history[history.length - 1];
    const currentIndex = this.data.nodes.findIndex((node) => node.id === currentNode.id);
    this.setData({ history, currentNode, currentIndex: Math.max(currentIndex, 0), showLocationMap: false });
  },
  toggleLocationMap() { this.setData({ showLocationMap: !this.data.showLocationMap }); },
  preventClose() {},
  goBack() {
    if (this.data.currentIndex === 0 || this.data.isCompleted) return wx.navigateBack();
    wx.showModal({ title: '暂离流程？', content: '短流程不支持存档。', success: ({ confirm }) => { if (confirm) wx.navigateBack(); } });
  }
});
