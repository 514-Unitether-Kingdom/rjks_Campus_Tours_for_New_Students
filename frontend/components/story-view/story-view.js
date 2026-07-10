Component({
    properties: {
      storyId: String,        // 剧情标识
      nodes: Array,           // 剧情节点数组
      canSave: Boolean,       // 是否可存档
      startNodeId: String     // 起始节点ID（用于载入存档）
    },
    data: {
      currentNode: null,
      currentIndex: 0,
      history: [],            // 已展示的对话
    },
    attached() {
      this.initStory();
    },
    methods: {
      initStory() {
        const startIdx = this.properties.startNodeId ? 
          this.properties.nodes.findIndex(n => n.id === this.properties.startNodeId) : 0;
        this.setData({
          currentIndex: startIdx,
          currentNode: this.properties.nodes[startIdx],
          history: this.properties.nodes.slice(0, startIdx+1)
        });
      },
      onTap() {
        // 点击推进
        const nextIdx = this.data.currentIndex + 1;
        if (nextIdx >= this.properties.nodes.length) {
          // 剧情结束，触发完成事件
          this.triggerEvent('complete');
          return;
        }
        const nextNode = this.properties.nodes[nextIdx];
        this.setData({
          currentIndex: nextIdx,
          currentNode: nextNode,
          history: [...this.data.history, nextNode]
        });
      },
      showHistory() {
        // 弹出历史对话半屏
        wx.showModal({
          title: '历史对话',
          content: this.data.history.map(n => (n.character||'') + ': ' + n.text).join('\n'),
          showCancel: false
        });
      },
      onSave() {
        // 触发父组件存档事件
        this.triggerEvent('save', { nodeId: this.data.currentNode.id });
      },
      // 外部可调用载入
      loadFromNode(nodeId) {
        const idx = this.properties.nodes.findIndex(n => n.id === nodeId);
        if (idx > -1) {
          this.setData({
            currentIndex: idx,
            currentNode: this.properties.nodes[idx],
            history: this.properties.nodes.slice(0, idx+1)
          });
        }
      }
    }
  })