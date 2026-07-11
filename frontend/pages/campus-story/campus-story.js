const api = require('../../utils/api');

const normalizeNodeAssets = (node) => ({
  ...node,
  // 当前素材包将 1~5 张校园背景合并为一个文件名；接口仍按单张名称返回。
  bg: /^\/images\/story_bg[1-5]\.jpg$/.test(node.bg || '') ? '/images/story_bg1~5.jpg' : node.bg
});

Page({
  data: { storyId: 'campus', nodes: [], currentNode: null, currentIndex: 0, history: [], isCompleted: false, isEnding: false },
  onLoad(options) {
    const storyId = options.storyId || 'campus';
    this.setData({ storyId });
    this.loadStory(options.startNodeId, storyId);
  },
  async loadStory(startNodeId, storyId) {
    wx.showLoading({ title: '载入旅程' });
    try {
      const nodes = (await api.getStoryNodes(storyId)).map(normalizeNodeAssets);
      if (!nodes.length) throw { message: '当前剧情暂无内容' };
      const start = startNodeId ? Math.max(nodes.findIndex((node) => node.id === startNodeId), 0) : 0;
      this.setData({ nodes, currentIndex: start, currentNode: nodes[start], history: nodes.slice(0, start + 1) });
    } catch (error) {
      wx.showModal({ title: '无法载入剧情', content: error.message || '请检查网络后重试', showCancel: false, success: () => wx.navigateBack() });
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
  async onSave() {
    try {
      await api.saveProgress(this.data.storyId, this.data.currentNode.id);
      wx.showToast({ title: '进度已存入行囊', icon: 'success' });
    } catch (error) {
      if (error.code === 3101) wx.showModal({ title: '存档已满', content: '最多保存 5 份存档，请先清理旧记录。', showCancel: false });
      else wx.showToast({ title: error.message || '存档失败', icon: 'none' });
    }
  },
  showHistory() { wx.showModal({ title: '旅程回顾', content: this.data.history.map((node) => `${node.character || '提示'}：${node.text}`).join('\n\n'), showCancel: false }); },
  goBack() {
    if (this.data.currentIndex === 0 || this.data.isCompleted) return wx.navigateBack();
    wx.showModal({ title: '暂离旅程？', content: '当前进度未自动保存。', success: ({ confirm }) => { if (confirm) wx.navigateBack(); } });
  }
});
