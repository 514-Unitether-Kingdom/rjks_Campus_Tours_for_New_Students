const { CAMPUS_MAP, getLocation } = require('../../utils/campus-map');

const getLocations = (locationId) => String(locationId || '').split(',')
  .map((id) => getLocation(id.trim()))
  .filter(Boolean);

Component({
  properties: {
    locationId: { type: String, value: '', observer() { this.drawMap(); } }
  },
  data: { canvasHeight: 260, locationName: '' },
  lifetimes: {
    ready() { this.initCanvas(); },
    detached() { if (this.pulseTimer) clearInterval(this.pulseTimer); }
  },
  methods: {
    initCanvas() {
      const query = wx.createSelectorQuery().in(this);
      query.select('#map-canvas').fields({ node: true, size: true }).exec((result) => {
        const info = result[0];
        if (!info || !info.node || !info.width) return;
        const expectedHeight = Math.round(info.width * CAMPUS_MAP.height / CAMPUS_MAP.width);
        if (Math.abs(info.height - expectedHeight) > 1) {
          this.setData({ canvasHeight: expectedHeight });
          wx.nextTick(() => this.initCanvas());
          return;
        }
        this.canvas = info.node;
        this.context = this.canvas.getContext('2d');
        this.width = info.width;
        this.height = info.height;
        const pixelRatio = wx.getSystemInfoSync().pixelRatio || 1;
        this.canvas.width = this.width * pixelRatio;
        this.canvas.height = this.height * pixelRatio;
        this.context.scale(pixelRatio, pixelRatio);
        this.image = this.canvas.createImage();
        this.image.onload = () => {
          this.drawMap();
          this.startPulse();
        };
        this.image.src = CAMPUS_MAP.image;
      });
    },
    drawMap() {
      if (!this.context || !this.image || !this.width || !this.height) return;
      const locations = getLocations(this.properties.locationId);
      this.context.clearRect(0, 0, this.width, this.height);
      const bounds = locations.length && locations.flatMap((location) => location.points).reduce((box, [x, y]) => ({
        minX: Math.min(box.minX, x), maxX: Math.max(box.maxX, x), minY: Math.min(box.minY, y), maxY: Math.max(box.maxY, y)
      }), { minX: CAMPUS_MAP.width, maxX: 0, minY: CAMPUS_MAP.height, maxY: 0 });
      const pad = locations.length ? 180 : 0;
      const sourceX = locations.length ? Math.max(0, bounds.minX - pad) : 0;
      const sourceY = locations.length ? Math.max(0, bounds.minY - pad) : 0;
      const sourceW = locations.length ? Math.min(CAMPUS_MAP.width - sourceX, Math.max(bounds.maxX - bounds.minX + pad * 2, 420)) : CAMPUS_MAP.width;
      const sourceH = locations.length ? Math.min(CAMPUS_MAP.height - sourceY, Math.max(bounds.maxY - bounds.minY + pad * 2, 320)) : CAMPUS_MAP.height;
      this.viewport = { sourceX, sourceY, sourceW, sourceH };
      this.context.drawImage(this.image, sourceX, sourceY, sourceW, sourceH, 0, 0, this.width, this.height);
      if (locations.length) {
        const scaleX = this.width / sourceW;
        const scaleY = this.height / sourceH;
        locations.forEach((location) => {
          this.context.beginPath();
          location.points.forEach((point, index) => {
            const x = (point[0] - sourceX) * scaleX;
            const y = (point[1] - sourceY) * scaleY;
            if (index === 0) this.context.moveTo(x, y);
            else this.context.lineTo(x, y);
          });
          this.context.closePath();
          this.context.fillStyle = this.pulseOn ? 'rgba(255, 203, 50, 0.76)' : 'rgba(255, 203, 50, 0.34)';
          this.context.strokeStyle = '#e65100';
          this.context.lineWidth = 3;
          this.context.fill();
          this.context.stroke();
        });
      }
      this.setData({ locationName: locations.length ? locations.map((location) => location.name).join('、') : '未配置地点' });
    },
    startPulse() {
      if (this.pulseTimer) clearInterval(this.pulseTimer);
      this.pulseTimer = setInterval(() => {
        this.pulseOn = !this.pulseOn;
        this.drawMap();
      }, 650);
    }
  }
});
