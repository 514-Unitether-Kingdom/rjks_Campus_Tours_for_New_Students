const api = require('../../utils/api');

Page({
  data: {
    medicalCompleted: false,
    cardCompleted: false,
    printCompleted: false,
    showPopup: false,
    popupData: {
      title: '',
      desc: '',
      steps: [],
      completed: false,
      id: ''
    },
    currentProcess: ''
  },

  onLoad() {
    this.loadCompletedStatus();
  },

  onShow() {
    this.loadCompletedStatus();
  },

  loadCompletedStatus() {
    // 只读取已完成的状态，未完成的不要默认设置为 =====
    const completed = wx.getStorageSync('completedProcesses') || {};
    
    // 只取已明确标记为 true 的，其他默认 false
    this.setData({
      medicalCompleted: completed.medical === true,
      cardCompleted: completed.card === true,
      printCompleted: completed.print === true
    });
  },

  onMarkerTap(e) {
    const id = e.currentTarget.dataset.id;
    const completedKey = id + 'Completed';
    const isCompleted = this.data[completedKey];
    
    const processData = {
      medical: {
        title: '🏥 医保报销流程',
        desc: '了解校医院就诊和医保报销的完整流程',
        steps: [
          '在校医院挂号就诊',
          '医生开具转诊单（如需外院就诊）',
          '持转诊单到指定医院就诊',
          '收集发票、病历等材料',
          '返校提交报销材料到校医院窗口',
          '等待审核，报销款打入银行卡'
        ],
        completed: isCompleted
      },
      card: {
        title: '💳 一卡通补办流程',
        desc: '校园一卡通丢失后如何快速补办',
        steps: [
          '在校园卡服务中心挂失',
          '缴纳工本费（现金/微信）',
          '现场拍照制卡',
          '领取新卡，激活使用'
        ],
        completed: isCompleted
      },
      print: {
        title: '🖨️ 校园打印流程',
        desc: '如何在校园内使用打印服务',
        steps: [
          '前往校园打印店或图书馆打印区',
          '连接校园网或使用U盘',
          '上传/选择打印文件',
          '设置打印参数（单双面、份数等）',
          '刷卡或扫码支付',
          '取走打印件'
        ],
        completed: isCompleted
      }
    };

    const data = processData[id];
    if (!data) return;

    this.setData({
      showPopup: true,
      popupData: { ...data, id },
      currentProcess: id
    });
  },

  enterStory() {
    this.setData({ showPopup: false });
    const storyId = this.data.currentProcess;
    wx.navigateTo({ 
      url: `/pages/process-story/process-story?storyId=${storyId}`
    });
  },

  closePopup() {
    this.setData({ showPopup: false });
  },

  stopPropagation() {
    // 阻止事件冒泡
  }
});