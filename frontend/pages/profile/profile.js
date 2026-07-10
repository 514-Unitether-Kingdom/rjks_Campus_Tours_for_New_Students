const api = require('../../utils/api');

Page({
  data: {
    name: '',
    gender: '',
    grade: '',
    college: '',
    major: '',
    saving: false,
    gradeList: ['大一', '大二', '大三', '大四', '研一', '研二', '研三'],
    collegeList: [
      '信息学部',
      '城市建设学部',
      '材料与制造学部',
      '理学部',
      '经济与管理学院',
      '文法学部',
      '艺术设计学院',
      '马克思主义学院',
      '北京-都柏林国际学院',
      '樊恭烋荣誉学院',
      '其他'
    ],
    majorList: [],
    collegeIndex: -1,
    majorIndex: -1,
    majorMap: {
      '信息学部': ['计算机科学与技术', '软件工程', '信息安全', '物联网工程', '电子信息工程', '通信工程', '自动化', '人工智能'],
      '城市建设学部': ['土木工程', '建筑学', '城乡规划', '给排水科学与工程', '建筑环境与能源应用工程'],
      '材料与制造学部': ['材料科学与工程', '机械工程', '智能制造工程', '资源循环科学与工程'],
      '理学部': ['数学与应用数学', '应用物理学', '统计学', '数据科学与大数据技术'],
      '经济与管理学院': ['工商管理', '会计学', '金融学', '经济学', '管理科学', '市场营销'],
      '文法学部': ['法学', '社会工作', '英语', '日语'],
      '艺术设计学院': ['视觉传达设计', '环境设计', '产品设计', '服装与服饰设计', '数字媒体艺术'],
      '马克思主义学院': ['思想政治教育'],
      '北京-都柏林国际学院': ['金融学', '软件工程', '电子信息工程', '物联网工程'],
      '樊恭烋荣誉学院': ['荣誉课程项目'],
      '其他': ['其他专业']
    }
  },

  onLoad() {
    this.loadProfile();
  },

  async loadProfile() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }

    const cached = wx.getStorageSync('userInfo') || {};
    this.fillForm(cached);

    try {
      const profile = await api.getProfile();
      this.fillForm(profile);
    } catch (error) {
      if (!cached.name) {
        wx.showToast({ title: error.message || '资料加载失败', icon: 'none' });
      }
    }
  },

  fillForm(userInfo = {}) {
    const college = userInfo.college === '未选择' ? '' : (userInfo.college || '');
    const major = userInfo.major === '未选择' ? '' : (userInfo.major || '');
    const collegeIndex = this.data.collegeList.indexOf(college);
    const majorList = this.data.majorMap[college] || [];
    const majorIndex = majorList.indexOf(major);

    this.setData({
      name: userInfo.name || '',
      gender: userInfo.gender || '',
      grade: userInfo.grade === '未选择' ? '' : (userInfo.grade || ''),
      college,
      major,
      collegeIndex,
      majorIndex,
      majorList
    });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onGenderChange(e) {
    this.setData({ gender: e.detail.value });
  },

  onGradeChange(e) {
    const index = Number(e.detail.value);
    this.setData({ grade: this.data.gradeList[index] });
  },

  onCollegeChange(e) {
    const index = Number(e.detail.value);
    const college = this.data.collegeList[index];
    const majorList = this.data.majorMap[college] || [];

    this.setData({
      collegeIndex: index,
      college,
      majorList,
      major: '',
      majorIndex: -1
    });
  },

  onMajorChange(e) {
    const index = Number(e.detail.value);
    this.setData({
      majorIndex: index,
      major: this.data.majorList[index]
    });
  },

  async saveProfile() {
    if (this.data.saving) return;

    const name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: '请填写姓名', icon: 'none' });
      return;
    }
    if (!this.data.gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return;
    }

    const profile = {
      name,
      gender: this.data.gender,
      grade: this.data.grade || '未选择',
      college: this.data.college || '未选择',
      major: this.data.major || '未选择'
    };

    this.setData({ saving: true });
    wx.showLoading({ title: '保存中...', mask: true });

    try {
      await api.saveProfile(profile);
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });

      setTimeout(() => {
        wx.reLaunch({ url: '/pages/home/home' });
      }, 800);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '保存失败，请检查网络后重试',
        icon: 'none'
      });
    } finally {
      this.setData({ saving: false });
    }
  }
});
