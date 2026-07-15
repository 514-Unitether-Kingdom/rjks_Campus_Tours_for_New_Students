const api = require('../../utils/api');

const normalizeNodeAssets = (node) => ({
  ...node,
  // 当前素材包将 1~3 张医保流程背景合并为一个文件名；接口仍按单张名称返回。
  bg: /^\/images\/medical_bg[1-3]\.jpg$/.test(node.bg || '') ? '/images/medical_bg1~3.jpg' : node.bg
});

Page({
  data: { storyId: 'medical', storyName: '办事流程', nodes: [], currentNode: null, currentIndex: 0, history: [], isCompleted: false, isEnding: false },
  onLoad(options) { const storyId = options.storyId || 'medical'; this.setData({ storyId }); this.loadStory(storyId); },
  async loadStory(storyId) {
    wx.showLoading({ title: '载入流程' });
    try {
      const nodes = (await api.getStoryNodes(storyId)).map(normalizeNodeAssets);
      if (!nodes.length) throw { message: '当前流程暂无内容' };
      this.setData({ nodes, currentNode: nodes[0], history: [nodes[0]] });
    } catch (error) {
      wx.showModal({ title: '无法载入流程', content: error.message || '请检查网络后重试', showCancel: false, success: () => wx.navigateBack() });
    } finally { wx.hideLoading(); }
  },
  onTap() {
    if (this.data.isEnding || this.data.isCompleted) return;
    if (this.data.currentNode.isEnd || this.data.currentIndex + 1 >= this.data.nodes.length) return this.completeStory();
    const currentIndex = this.data.currentIndex + 1;
    const currentNode = this.data.nodes[currentIndex];
    this.setData({ currentIndex, currentNode, history: [...this.data.history, currentNode] });
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
  showHistory() { wx.showModal({ title: '流程回顾', content: this.data.history.map((node) => `${node.character || '提示'}：${node.text}`).join('\n\n'), showCancel: false }); },
  goBack() {
    if (this.data.currentIndex === 0 || this.data.isCompleted) return wx.navigateBack();
    wx.showModal({ title: '暂离流程？', content: '短流程不支持存档。', success: ({ confirm }) => { if (confirm) wx.navigateBack(); } });
  }
});
