const api = require('../../utils/api');

const MAP_CACHE_KEY = 'activeMapCache';
const MAP_CACHE_AGE = 24 * 60 * 60 * 1000;
const MAP_LOAD_TIMEOUT = 12000;
const LONG_PRESS_DELAY = 500;
const LONG_PRESS_MOVE_LIMIT = 10;
const SCALE_GUARD_TIME = 800;
const DEFAULT_MAP = {
  name: '平乐园校区平面图',
  imageUrl: '/images/campus_map_full.png',
  version: 'local'
};

Page({
  data: {
    mapName: DEFAULT_MAP.name,
    mapImage: DEFAULT_MAP.imageUrl,
    loading: true,
    loadError: false,
    imageReady: false,
    cacheTip: ''
  },

  onLoad() {
    this.loadMap();
  },

  onUnload() {
    this.cancelLongPress();
    this.clearMapLoadTimer();
  },

  async loadMap() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }

    this.setData({
      loading: true,
      loadError: false,
      imageReady: false,
      cacheTip: ''
    });
    this.startMapLoadTimer();

    const cache = wx.getStorageSync(MAP_CACHE_KEY);
    if (this.isFreshCache(cache)) {
      this.renderMap(cache, '');
      return;
    }

    try {
      const remoteMap = await api.getActiveMap();
      const imageUrl = await this.prepareImage(remoteMap.imageUrl);
      const cacheData = {
        ...remoteMap,
        imageUrl,
        sourceUrl: remoteMap.imageUrl,
        cachedAt: Date.now()
      };
      wx.setStorageSync(MAP_CACHE_KEY, cacheData);
      this.renderMap(cacheData, '');
    } catch (error) {
      if (cache && cache.imageUrl) {
        this.renderMap(cache, '数据未更新');
        wx.showToast({ title: '地图数据未更新', icon: 'none' });
        return;
      }

      this.renderMap(DEFAULT_MAP, '');
      this.setData({
        loading: false,
        loadError: true
      });
      wx.showToast({
        title: error.message || '地图资源更新中，请稍后查看',
        icon: 'none'
      });
    }
  },

  isFreshCache(cache) {
    return !!(cache && cache.imageUrl && cache.cachedAt && Date.now() - cache.cachedAt < MAP_CACHE_AGE);
  },

  renderMap(map, cacheTip) {
    this.setData({
      mapName: map.name || DEFAULT_MAP.name,
      mapImage: this.normalizeImageUrl(map.imageUrl),
      cacheTip,
      loading: true,
      loadError: false,
      imageReady: false
    });
    this.startMapLoadTimer();
  },

  clearMapLoadTimer() {
    if (this.mapLoadTimer) {
      clearTimeout(this.mapLoadTimer);
      this.mapLoadTimer = null;
    }
  },

  startMapLoadTimer() {
    this.clearMapLoadTimer();
    this.mapLoadTimer = setTimeout(() => {
      if (!this.data.imageReady && this.data.loading) {
        this.setData({
          loading: false,
          loadError: true
        });
        wx.showToast({ title: '加载超时，请稍后重试', icon: 'none' });
      }
    }, MAP_LOAD_TIMEOUT);
  },

  normalizeImageUrl(url) {
    if (!url) return DEFAULT_MAP.imageUrl;
    if (/^(https?:|wxfile:|http:\/\/tmp|https:\/\/tmp)/.test(url)) return url;
    return url.startsWith('/') ? url : `/${url}`;
  },

  prepareImage(imageUrl) {
    // 网络图直接交给 <image> 加载（与流程地图、AI 配图一致，真机稳）。
    // 原先用 downloadFile + saveFile 把大图下到本地再显示，那条链路在真机上不稳
    // （saveFile 已废弃 + 大图），表现为"电脑能显示、手机地图空白"——其它同域名网络图
    // 都正常，唯独这里绕了下载。长按保存仍用 getImageInfo(网络url) 处理，不受影响。
    return Promise.resolve(this.normalizeImageUrl(imageUrl));
  },

  onMapLoad() {
    this.clearMapLoadTimer();
    this.setData({
      loading: false,
      loadError: false,
      imageReady: true
    });
  },

  onMapError() {
    this.clearMapLoadTimer();
    this.setData({
      loading: false,
      loadError: true,
      imageReady: false
    });
  },

  retryLoad() {
    wx.removeStorageSync(MAP_CACHE_KEY);
    this.loadMap();
  },

  cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  },

  blockLongPress() {
    this.cancelLongPress();
    this.touchStartPoint = null;
    this.longPressBlockedUntil = Date.now() + SCALE_GUARD_TIME;
  },

  onMapScale() {
    this.blockLongPress();
  },

  onMapTouchStart(e) {
    this.cancelLongPress();

    if (!e.touches || e.touches.length !== 1 || Date.now() < (this.longPressBlockedUntil || 0)) {
      this.blockLongPress();
      return;
    }

    const touch = e.touches[0];
    this.touchStartPoint = {
      x: touch.clientX,
      y: touch.clientY
    };

    this.longPressTimer = setTimeout(() => {
      this.longPressTimer = null;
      this.openSaveMenu();
    }, LONG_PRESS_DELAY);
  },

  onMapTouchMove(e) {
    if (!this.touchStartPoint) return;

    if (!e.touches || e.touches.length !== 1) {
      this.blockLongPress();
      return;
    }

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - this.touchStartPoint.x);
    const dy = Math.abs(touch.clientY - this.touchStartPoint.y);
    if (dx > LONG_PRESS_MOVE_LIMIT || dy > LONG_PRESS_MOVE_LIMIT) {
      this.cancelLongPress();
    }
  },

  onMapTouchEnd() {
    this.cancelLongPress();
    this.touchStartPoint = null;
  },

  onMapTouchCancel() {
    this.cancelLongPress();
    this.touchStartPoint = null;
  },

  openSaveMenu() {
    if (Date.now() < (this.longPressBlockedUntil || 0)) {
      return;
    }

    if (this.data.loading || !this.data.imageReady) {
      wx.showToast({ title: '图片加载中，请稍后重试', icon: 'none' });
      return;
    }

    wx.showActionSheet({
      itemList: ['保存图片'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.saveMapImage();
        }
      }
    });
  },

  saveMapImage() {
    wx.showLoading({ title: '保存中...', mask: true });

    wx.getImageInfo({
      src: this.data.mapImage,
      success: (info) => {
        wx.saveImageToPhotosAlbum({
          filePath: info.path,
          success: () => {
            wx.hideLoading();
            wx.showToast({ title: '地图已保存至相册', icon: 'success' });
          },
          fail: (error) => this.handleSaveError(error)
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '图片资源未缓存，请检查网络', icon: 'none' });
      }
    });
  },

  handleSaveError(error) {
    wx.hideLoading();
    const message = String(error && (error.errMsg || error.message) || '');
    if (message.includes('auth deny') || message.includes('authorize') || message.includes('denied')) {
      wx.showModal({
        title: '需要相册权限',
        content: '需要相册权限才能保存图片，请前往设置开启',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) wx.openSetting();
        }
      });
      return;
    }

    wx.showToast({
      title: '保存失败，请稍后重试或检查手机存储空间',
      icon: 'none'
    });
  },

  onPullDownRefresh() {
    wx.removeStorageSync(MAP_CACHE_KEY);
    this.loadMap().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});
