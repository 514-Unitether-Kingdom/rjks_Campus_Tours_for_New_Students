const api = require('../../utils/api');

Page({
  data: {
    storyId: 'campus',
    nodes: [],
    currentNode: null,
    currentIndex: 0,
    history: [],
    isCompleted: false,
    isEnding: false
  },

  onLoad(options) {
    const startNodeId = options.startNodeId || null;
    this.loadStory(startNodeId);
  },

  async loadStory(startNodeId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const nodes = await api.getStoryNodes('campus');
      this.setData({ nodes });
      
      let startIndex = 0;
      if (startNodeId) {
        const found = nodes.findIndex(n => n.id === startNodeId);
        if (found > -1) startIndex = found;
      }
      
      this.setData({
        currentIndex: startIndex,
        currentNode: nodes[startIndex],
        history: nodes.slice(0, startIndex + 1)
      });
    } catch (e) {
      // 使用模拟数据
      const mockNodes = [
        { id: 'n1', bg: '/images/story_bg1.jpg', character: '学姐', characterImage: '/images/character_xuejie.png', text: '欢迎来到北京工业大学！我是你的向导学姐，今天带你逛逛校园。' },
        { id: 'n2', bg: '/images/story_bg2.jpg', character: '学姐', characterImage: '/images/character_xuejie.png', text: '这是我们的主教学楼——第一教学楼，大部分课程都在这里进行。' },
        { id: 'n3', bg: '/images/story_bg3.jpg', character: '学姐', characterImage: '/images/character_xuejie.png', text: '那边是图书馆，你可以在这里自习、借书，记得带校园卡哦。' },
        { id: 'n4', bg: '/images/story_bg4.jpg', character: '学姐', characterImage: '/images/character_xuejie.png', text: '这是食堂，有三层，各种美食应有尽有！' },
        { id: 'n5', bg: '/images/story_bg5.jpg', character: '学姐', characterImage: '/images/character_xuejie.png', text: '校医院在校园东南角，生病了记得及时就医。' },
        { id: 'n_end', bg: '/images/story_bg_end.jpg', character: '学姐', characterImage: '/images/character_xuejie.png', text: '🎉 校园就介绍到这里啦！\n\n点击完成剧情，获得勋章！', isEnd: true }
      ];
      this.setData({ nodes: mockNodes });
      this.setData({
        currentNode: mockNodes[0],
        history: [mockNodes[0]]
      });
    } finally {
      wx.hideLoading();
    }
  },

  // ===== 点击推进剧情 =====
  onTap() {
    // 如果正在结束中，不处理
    if (this.data.isEnding) return;
    
    // 如果已经完成，不处理
    if (this.data.isCompleted) return;
    
    // ===== 关键修改：如果当前是最后一页（isEnd），触发完成 =====
    if (this.data.currentNode.isEnd) {
      this.completeStory();
      return;
    }
    
    const nextIndex = this.data.currentIndex + 1;
    
    // 如果已经是最后一项，触发完成
    if (nextIndex >= this.data.nodes.length) {
      this.completeStory();
      return;
    }
    
    // 正常推进到下一段
    const nextNode = this.data.nodes[nextIndex];
    this.setData({
      currentIndex: nextIndex,
      currentNode: nextNode,
      history: [...this.data.history, nextNode]
    });
  },

  // ===== 完成剧情 =====
  async completeStory() {
    // 防止重复调用
    if (this.data.isCompleted || this.data.isEnding) return;
    
    this.setData({ isEnding: true });
    
    wx.showLoading({ 
      title: '剧情结算中...', 
      mask: true 
    });
    
    try {
      const result = await api.completeStory('campus');
      console.log('🎯 完成剧情结果:', result);
      
      wx.hideLoading();
      
      // 标记已完成
      this.setData({ isCompleted: true });
      
      if (result.alreadyObtained) {
        // 已获得勋章
        wx.showModal({
          title: '✅ 剧情已完成',
          content: '🏅 校园探索者\n\n你已获得这枚勋章！\n\n💡 可以在「我的勋章」中查看',
          showCancel: false,
          confirmText: '好的',
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }
      
      // ===== 首次获得勋章 - 庆祝弹窗 =====
      wx.showModal({
        title: '🎉 恭喜获得新勋章！',
        content: '🏅 校园探索者\n\n你已了解校园主要建筑和场所！\n\n💡 可以在「我的勋章」中查看所有勋章',
        showCancel: false,
        confirmText: '太棒了！🎊',
        success: () => {
          wx.navigateBack();
        }
      });
      
    } catch (error) {
      console.error('❌ 完成剧情失败:', error);
      wx.hideLoading();
      this.setData({ isEnding: false });
      
      wx.showModal({
        title: '提示',
        content: '勋章发放失败，请重试',
        showCancel: false,
        confirmText: '好的',
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  // 存档
  async onSave() {
    const { storyId, currentNode } = this.data;
    
    wx.showLoading({ title: '存档中...' });
    try {
      await api.saveProgress(storyId, currentNode.id);
      wx.hideLoading();
      wx.showToast({ title: '💾 存档成功', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      if (e.code === 3101 || e.message === '存档已满') {
        wx.showModal({
          title: '存档已满',
          content: '最多保存5个存档，请先删除旧存档',
          showCancel: false
        });
      } else {
        wx.showToast({ title: '存档失败', icon: 'none' });
      }
    }
  },

  // 历史对话
  showHistory() {
    const historyText = this.data.history.map(n => 
      `${n.character || '系统'}：${n.text}`
    ).join('\n\n');
    
    wx.showModal({
      title: '📜 历史对话',
      content: historyText || '暂无历史记录',
      showCancel: false,
      confirmText: '关闭'
    });
  },

  goBack() {
    // 如果已经完成或正在结束，直接返回
    if (this.data.isCompleted || this.data.isEnding) {
      wx.navigateBack();
      return;
    }
    
    // 如果有进度，提示确认
    if (this.data.currentIndex > 0) {
      wx.showModal({
        title: '提示',
        content: '退出将丢失当前进度，是否确定？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  }
});
