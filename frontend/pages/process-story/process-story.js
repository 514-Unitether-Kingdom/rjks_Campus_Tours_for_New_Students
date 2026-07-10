const api = require('../../utils/api');

Page({
  data: {
    storyId: '',
    storyName: '',
    nodes: [],
    currentNode: null,
    currentIndex: 0,
    history: [],
    isCompleted: false,
    isEnding: false,
    isProcessing: false
  },

  onLoad(options) {
    const storyId = options.storyId || 'medical';
    const storyNames = {
      medical: '医保报销流程',
      card: '一卡通补办流程',
      print: '打印流程'
    };
    
    this.setData({
      storyId: storyId,
      storyName: storyNames[storyId] || '办事流程'
    });
    
    this.loadStory(storyId);
  },

  async loadStory(storyId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const nodes = await api.getStoryNodes(storyId);
      this.setData({ nodes });
      this.setData({
        currentNode: nodes[0],
        history: [nodes[0]]
      });
    } catch (e) {
      // 模拟数据
      const mockData = {
        medical: [
          { id: 'm1', bg: '/images/medical_bg1.jpg', character: '校医', text: '同学你好，我是校医室的王医生。医保报销需要先在校医院开具转诊单。' },
          { id: 'm2', bg: '/images/medical_bg2.jpg', character: '校医', text: '如果校医院无法处理，医生会开具转诊单，你可以去指定医院就诊。' },
          { id: 'm3', bg: '/images/medical_bg3.jpg', character: '校医', text: '就诊后，将发票、病历、转诊单等材料交回校医院报销窗口。' },
          { id: 'm_end', bg: '/images/medical_bg_end.jpg', character: '校医', text: '🎉 流程就这些啦！\n\n点击下方「完成剧情」按钮获得勋章！', isEnd: true }
        ],
        card: [
          { id: 'c1', bg: '/images/card_bg1.jpg', character: '工作人员', text: '一卡通丢失不要慌，来校园卡服务中心挂失补办。' },
          { id: 'c2', bg: '/images/card_bg2.jpg', character: '工作人员', text: '需要缴纳工本费，然后现场拍照制卡。' },
          { id: 'c_end', bg: '/images/card_bg_end.jpg', character: '工作人员', text: '🎉 补办完成，新卡立等可取！\n\n点击下方「完成剧情」按钮获得勋章！', isEnd: true }
        ],
        print: [
          { id: 'p1', bg: '/images/print_bg1.jpg', character: '店员', text: '同学需要打印吗？可以使用U盘或校园网传输文件。' },
          { id: 'p2', bg: '/images/print_bg2.jpg', character: '店员', text: '选择好打印参数后，刷卡支付即可取走打印件。' },
          { id: 'p_end', bg: '/images/print_bg_end.jpg', character: '店员', text: '🎉 打印完成，祝你学习顺利！\n\n点击下方「完成剧情」按钮获得勋章！', isEnd: true }
        ]
      };
      
      const nodes = mockData[storyId] || mockData.medical;
      this.setData({ nodes });
      this.setData({
        currentNode: nodes[0],
        history: [nodes[0]]
      });
    } finally {
      wx.hideLoading();
    }
  },

  // ===== 点击推进剧情 =====
  onTap() {
    // 防止重复点击
    if (this.data.isProcessing) return;
    if (this.data.isEnding) return;
    if (this.data.isCompleted) {
      // 如果已完成，直接返回
      wx.navigateBack();
      return;
    }
    
    // 如果当前是最后一页（isEnd），触发完成
    if (this.data.currentNode.isEnd) {
      this.completeStory();
      return;
    }
    
    const nextIndex = this.data.currentIndex + 1;
    
    if (nextIndex >= this.data.nodes.length) {
      this.completeStory();
      return;
    }
    
    const nextNode = this.data.nodes[nextIndex];
    this.setData({
      currentIndex: nextIndex,
      currentNode: nextNode,
      history: [...this.data.history, nextNode]
    });
  },

  // ===== 完成剧情 =====
  async completeStory() {
    if (this.data.isCompleted || this.data.isEnding) return;
    if (this.data.isProcessing) return;
    
    this.setData({ isProcessing: true, isEnding: true });
    
    wx.showLoading({ 
      title: '剧情结算中...', 
      mask: true 
    });
    
    try {
      console.log('🎯 完成短故事:', this.data.storyId);
      
      const result = await api.completeStory(this.data.storyId);
      console.log('🎯 短故事结果:', result);
      
      // ===== 标记流程已完成 =====
      const completed = wx.getStorageSync('completedProcesses') || {};
      completed[this.data.storyId] = true;
      wx.setStorageSync('completedProcesses', completed);
      console.log('📝 已更新完成状态:', completed);
      
      wx.hideLoading();
      
      this.setData({ 
        isCompleted: true,
        isProcessing: false,
        isEnding: false
      });
      
      const badgeInfo = {
        medical: { name: '医疗达人', emoji: '🏥' },
        card: { name: '补办高手', emoji: '💳' },
        print: { name: '打印能手', emoji: '🖨️' }
      };
      
      const info = badgeInfo[this.data.storyId] || { name: '办事达人', emoji: '🏅' };
      
      // ===== 修复：显示弹窗（无论是否首次获得） =====
      if (result.alreadyObtained) {
        wx.showModal({
          title: '✅ 剧情已完成',
          content: `${info.emoji} ${info.name}\n\n你已了解${this.data.storyName}！\n\n💡 可以再次体验复习流程，但不会重复获得勋章`,
          showCancel: false,
          confirmText: '好的',
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }
      
      // 首次获得勋章
      wx.showModal({
        title: '🎉 恭喜获得新勋章！',
        content: `${info.emoji} ${info.name}\n\n你已了解${this.data.storyName}！\n\n💡 可以再次体验复习流程，但不会重复获得勋章`,
        showCancel: false,
        confirmText: '太棒了！🎊',
        success: () => {
          wx.navigateBack();
        }
      });
      
    } catch (error) {
      console.error('❌ 完成短故事失败:', error);
      wx.hideLoading();
      this.setData({ 
        isProcessing: false,
        isEnding: false 
      });
      
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
    if (this.data.isCompleted) {
      wx.navigateBack();
      return;
    }
    
    if (this.data.currentIndex > 0) {
      wx.showModal({
        title: '提示',
        content: '退出将丢失当前进度，短故事不支持存档，确定退出吗？',
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
