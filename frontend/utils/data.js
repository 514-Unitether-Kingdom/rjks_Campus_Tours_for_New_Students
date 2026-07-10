// 模拟勋章数据
const badges = [
    { id: 'badge_campus', name: '校园探索者', icon: '/images/badge_campus.png', description: '完成浏览校园剧情' },
    { id: 'badge_medical', name: '医疗达人', icon: '/images/badge_medical.png', description: '完成医保报销剧情' },
  ];
  
  // 浏览校园剧情节点（长故事）
  const campusStoryNodes = [
    { id: 'n1', bg: '/images/story_bg1.jpg', character: '学姐', text: '欢迎来到北京工业大学！我是你的向导学姐，今天带你逛逛校园。' },
    { id: 'n2', bg: '/images/story_bg2.jpg', character: '学姐', text: '这是我们的主教学楼，大部分课程都在这里进行。' },
    { id: 'n3', bg: '/images/story_bg3.jpg', character: '学姐', text: '那边是图书馆，你可以在这里自习、借书，记得带校园卡哦。' },
    // ...更多节点，最后节点标记结束
    { id: 'n_end', bg: '/images/story_bg_end.jpg', character: '学姐', text: '校园就介绍到这里啦！恭喜你完成校园探索！', isEnd: true }
  ];
  
  // 医保报销剧情节点（短故事）
  const medicalStoryNodes = [
    { id: 'm1', bg: '/images/medical_bg1.jpg', character: '校医', text: '同学你好，医保报销需要先在校医院开具转诊单。' },
    { id: 'm2', bg: '/images/medical_bg2.jpg', character: '校医', text: '然后带着转诊单和病历去指定医院就诊。' },
    { id: 'm3', bg: '/images/medical_bg3.jpg', character: '校医', text: '回来后将发票、病历等材料交到校医院报销窗口。' },
    { id: 'm_end', bg: '/images/medical_bg_end.jpg', character: '校医', text: '流程就这些啦，祝你早日康复！', isEnd: true }
  ];
  
  module.exports = {
    badges,
    campusStoryNodes,
    medicalStoryNodes,
  };