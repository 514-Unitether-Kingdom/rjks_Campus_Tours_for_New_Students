const api = require('../../utils/api');

Page({
  data: {
    name: '',
    gender: '',
    grade: '',
    college: '',
    major: '',
    saving: false,
    gradeList: ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博一', '博二', '博三', '博四及以上'],
    collegeList: [
      '计算机学院',
      '信息科学技术学院',
      '机械与能源工程学院',
      '材料科学与工程学院',
      '建筑工程学院',
      '建筑与城市规划学院',
      '城市交通学院',
      '数学统计学与力学学院',
      '物理与光电工程学院',
      '化学与生命科学学院',
      '环境科学与工程学院',
      '经济与管理学院',
      '外国语学院',
      '艺术设计学院',
      '马克思主义学院',
      '北京-都柏林国际学院',
      '樊恭烋荣誉学院',
      '碳中和未来技术学院',
      '其他'
    ],
    majorList: [],
    collegeIndex: -1,
    majorIndex: -1,
    majorMap: {
      '计算机学院': ['计算机科学与技术', '软件工程', '信息安全', '数字媒体技术', '物联网工程'],
      '信息科学技术学院': ['人工智能', '电子信息工程', '电子科学与技术', '自动化', '通信工程', '机器人工程', '测控技术与仪器'],
      '机械与能源工程学院': ['机械工程', '智能制造工程', '能源与动力工程', '新能源科学与工程'],
      '材料科学与工程学院': ['材料科学与工程', '纳米材料与技术', '焊接技术与工程', '资源循环科学与工程', '应用化学', '新能源材料与器件'],
      '建筑工程学院': ['土木工程', '给排水科学与工程', '建筑环境与能源应用工程', '智能建造'],
      '建筑与城市规划学院': ['建筑学', '城乡规划'],
      '城市交通学院': ['交通工程', '交通设备与控制工程'],
      '数学统计学与力学学院': ['数学与应用数学', '信息与计算科学', '统计学'],
      '物理与光电工程学院': ['应用物理学', '光电信息科学与工程'],
      '化学与生命科学学院': ['化学生物学', '生物医学工程', '生物技术'],
      '环境科学与工程学院': ['环境工程', '环境科学'],
      '经济与管理学院': ['工商管理', '会计学', '金融学', '国际经济与贸易', '经济统计学', '大数据管理与应用', '信息管理与信息系统', '法学', '社会学', '社会工作'],
      '外国语学院': ['英语'],
      '艺术设计学院': ['工业设计', '视觉传达设计', '环境设计', '数字媒体艺术', '产品设计', '服装设计', '雕塑', '绘画', '工艺美术'],
      '马克思主义学院': ['思想政治教育'],
      '北京-都柏林国际学院': ['金融学', '软件工程', '电子信息工程', '物联网工程'],
      '樊恭烋荣誉学院': ['荣誉课程项目'],
      '碳中和未来技术学院': ['碳中和相关方向'],
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
    const incomingGrade = userInfo.grade === '未选择' ? '' : (userInfo.grade || '');
    const grade = this.data.gradeList.includes(incomingGrade) ? incomingGrade : '';
    const incomingCollege = userInfo.college === '未选择' ? '' : (userInfo.college || '');
    const college = this.data.collegeList.includes(incomingCollege) ? incomingCollege : '';
    const incomingMajor = userInfo.major === '未选择' ? '' : (userInfo.major || '');
    const collegeIndex = this.data.collegeList.indexOf(college);
    const majorList = this.data.majorMap[college] || [];
    const major = majorList.includes(incomingMajor) ? incomingMajor : '';
    const majorIndex = majorList.indexOf(major);

    this.setData({
      name: userInfo.name || '',
      gender: userInfo.gender || '',
      grade,
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

    if (this.data.grade && !this.data.gradeList.includes(this.data.grade)) {
      wx.showToast({ title: '学员信息无效：年级不在合法名录中', icon: 'none' });
      return;
    }

    if (this.data.college && !this.data.collegeList.includes(this.data.college)) {
      wx.showToast({ title: '学员信息无效：学院不在合法名录中', icon: 'none' });
      return;
    }

    if (this.data.major) {
      const validMajors = this.data.majorMap[this.data.college] || [];
      if (!this.data.college || !validMajors.includes(this.data.major)) {
        wx.showToast({ title: '学员信息无效：专业与学院不匹配', icon: 'none' });
        return;
      }
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
