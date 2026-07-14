// AI 新生助手聊天页（T8）。流式逐字 + 答案配图 + 点赞点踩。
// 接口见 backend/docs/T8-AI助手前端接口说明.md。
const api = require('../../utils/api');

Page({
  data: {
    messages: [],     // {role:'user'|'assistant', text, images:[{full,desc,broken}], imgUrls, recordId, feedback, streaming, error}
    input: '',
    sending: false,
    suggestions: [],
    lastRelated: [],   // 最新一条答案的"猜你想问"
    scrollTop: 0
  },

  onLoad() {
    this.loadSuggestions();
  },

  async loadSuggestions() {
    try {
      const list = await api.getAskSuggestions();
      this.setData({ suggestions: Array.isArray(list) ? list.slice(0, 6) : [] });
    } catch (e) { /* 引导词拉不到不影响使用 */ }
  },

  onInput(e) { this.setData({ input: e.detail.value }); },

  onTapSuggestion(e) {
    this.setData({ input: e.currentTarget.dataset.q }, () => this.onSend());
  },

  // 点"猜你想问"里的追问
  onTapRelated(e) {
    if (this.data.sending) return;
    this.setData({ input: e.currentTarget.dataset.q }, () => this.onSend());
  },

  // 始终滚到底：scroll-top 单调递增，内容变长会一直贴底（超出即被 clamp）
  scrollToBottom() {
    this._st = (this._st || 0) + 100000;
    this.setData({ scrollTop: this._st });
  },

  onSend() {
    const q = (this.data.input || '').trim();
    if (!q || this.data.sending) return;
    if (q.length > 500) { wx.showToast({ title: '问题太长了，精简到 500 字内', icon: 'none' }); return; }

    const messages = this.data.messages.concat([
      { role: 'user', text: q, images: [], imgUrls: [], related: [], recordId: null, feedback: 0, streaming: false, error: false },
      { role: 'assistant', text: '', images: [], imgUrls: [], related: [], recordId: null, feedback: 0, streaming: true, error: false }
    ]);
    const aiIdx = messages.length - 1;
    this.setData({ messages, input: '', sending: true, lastRelated: [] }, () => this.scrollToBottom());

    // 流式文字节流渲染：累积到 _buf，最多每 60ms setData 一次，避免逐字 setData 卡顿
    this._buf = '';
    this._lastFlush = 0;
    const flush = (force) => {
      const now = Date.now();
      if (!force && now - this._lastFlush < 60) return;
      this._lastFlush = now;
      this.setData({ ['messages[' + aiIdx + '].text']: this._buf }, () => this.scrollToBottom());
    };

    api.askQuestionStream(q, {
      onDelta: (t) => { this._buf += t; flush(false); },
      onReplace: (t) => { this._buf = t; flush(true); },
      onDone: (payload) => {
        flush(true);
        const base = api.getBaseUrl();
        const images = (payload.images || []).map((im) => ({
          full: /^https?:\/\//.test(im.url) ? im.url : base + im.url,
          desc: im.desc || '',
          broken: false
        }));
        this.setData({
          ['messages[' + aiIdx + '].streaming']: false,
          ['messages[' + aiIdx + '].text']: this._buf,
          ['messages[' + aiIdx + '].images']: images,
          ['messages[' + aiIdx + '].imgUrls']: images.map((i) => i.full),
          ['messages[' + aiIdx + '].related']: payload.related || [],
          ['messages[' + aiIdx + '].recordId']: payload.recordId || null,
          lastRelated: payload.related || [],
          sending: false
        }, () => this.scrollToBottom());
      },
      onError: (err) => {
        this.setData({
          ['messages[' + aiIdx + '].streaming']: false,
          ['messages[' + aiIdx + '].error']: true,
          ['messages[' + aiIdx + '].text']: this._buf || (err && err.message) || 'AI 暂时有点忙，稍后再试',
          sending: false
        }, () => this.scrollToBottom());
      }
    });
  },

  async onFeedback(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const value = Number(e.currentTarget.dataset.value);
    const msg = this.data.messages[idx];
    if (!msg || !msg.recordId || msg.feedback === value) return;
    try {
      await api.sendAskFeedback(msg.recordId, value);
      this.setData({ ['messages[' + idx + '].feedback']: value });
      wx.showToast({ title: value === 1 ? '感谢反馈' : '已记录', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  onPreviewImage(e) {
    const { url, urls } = e.currentTarget.dataset;
    wx.previewImage({ current: url, urls: (urls && urls.length) ? urls : [url] });
  },

  // 图裂兼底：加载失败则隐藏该图，不露裂图
  onImgError(e) {
    const midx = Number(e.currentTarget.dataset.midx);
    const iidx = Number(e.currentTarget.dataset.iidx);
    this.setData({ ['messages[' + midx + '].images[' + iidx + '].broken']: true });
  }
});
