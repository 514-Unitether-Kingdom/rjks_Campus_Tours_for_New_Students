const api = require('../../utils/api');

const MAP_CACHE_KEY = 'activeMapCache';
const MAP_CACHE_AGE = 24 * 60 * 60 * 1000;
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
  },

  normalizeImageUrl(url) {
    if (!url) return DEFAULT_MAP.imageUrl;
    if (/^(https?:|wxfile:|http:\/\/tmp|https:\/\/tmp)/.test(url)) return url;
    return url.startsWith('/') ? url : `/${url}`;
  },

  prepareImage(imageUrl) {
    const normalized = this.normalizeImageUrl(imageUrl);
    if (!/^https?:\/\//.test(normalized)) {
      return Promise.resolve(normalized);
    }

    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: normalized,
        success: (res) => {
          if (res.statusCode !== 200) {
            reject(new Error('地图资源更新中，请稍后查看'));
            return;
          }

          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => resolve(saveRes.savedFilePath),
            fail: () => resolve(res.tempFilePath)
          });
        },
        fail: () => reject(new Error('地图下载失败，请检查网络'))
      });
    });
  },

  onMapLoad() {
    this.setData({
      loading: false,
      loadError: false,
      imageReady: true
    });
  },

  onMapError() {
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

  onMapLongPress() {
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
