const api = require('../../utils/api');

const TEST_CATEGORY_CONFIG = [
  { id: 'orientation', name: '新生报到测试集', folders: ['报到路线', '宿舍入住', '班级集合', '校园卡'] },
  { id: 'life', name: '校园生活测试集', folders: ['食堂排队', '图书馆预约', '社团活动', '快递取件'] },
  { id: 'process', name: '办事流程测试集', folders: ['医保材料', '成绩证明', '教务咨询', '场地申请'] },
  { id: 'safety', name: '安全演练测试集', folders: ['消防撤离', '夜间归寝', '实验室安全', '网络安全'] },
  { id: 'study', name: '学业支持测试集', folders: ['选课冲突', '考试安排', '导师沟通', '实验提交'] },
  { id: 'edge', name: '异常边界测试集', folders: ['超长文本', '重复节点', '禁用故事', '空状态回归'] }
];
const TEST_STORY_COUNT_PER_FOLDER = 6;
const TEST_NODE_COUNT = 6;
const COMPLETED_FAKE_STORY_KEY = 'adminCompletedFakeStoryIds';

const padNumber = (number) => String(number).padStart(3, '0');

const formatAdminTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getPreviewActionState = (story, index, total) => {
  const isLast = total <= 0 || index >= total - 1;
  if (!isLast) {
    return { text: '下一节点', disabled: false };
  }
  if (story && story.completed) {
    return { text: '已完成', disabled: true };
  }
  return { text: '完成剧情', disabled: false };
};

const createTestNodes = (storyId, categoryName, folderName, serial) => (
  Array.from({ length: TEST_NODE_COUNT }, (_, index) => ({
    id: `${storyId}-node-${index + 1}`,
    character: index === 0 ? '测试系统' : '测试角色',
    text: index === TEST_NODE_COUNT - 1
      ? `测试故事 ${padNumber(serial)} 已结束，用于管理员故事模式的大数据展示验收。`
      : `${categoryName}/${folderName} 的第 ${index + 1} 个占位节点，文本用于验证长列表、展开和滚动表现。`,
    isEnd: index === TEST_NODE_COUNT - 1
  }))
);

const sumNodes = (stories) => stories.reduce((total, story) => total + (story.nodeCount || 0), 0);

const createTestStoryGroups = (completedStoryIds = new Set()) => {
  let serial = 1;
  return TEST_CATEGORY_CONFIG.map((category, categoryIndex) => {
    const folders = category.folders.map((folderName, folderIndex) => {
      const stories = Array.from({ length: TEST_STORY_COUNT_PER_FOLDER }, (_, storyIndex) => {
        const currentSerial = serial++;
        const rawType = (categoryIndex + folderIndex + storyIndex) % 3 === 0 ? 'short' : 'long';
        const storyId = `fake-${category.id}-${folderIndex + 1}-${storyIndex + 1}`;
        const completed = completedStoryIds.has(storyId);
        return {
          id: storyId,
          name: `测试故事 ${padNumber(currentSerial)} · ${folderName}`,
          type: rawType === 'long' ? '长故事' : '短故事',
          rawType,
          status: completed ? '测试完成' : (storyIndex === TEST_STORY_COUNT_PER_FOLDER - 1 ? 'disabled' : '测试数据'),
          nodeCount: TEST_NODE_COUNT,
          nodes: createTestNodes(storyId, category.name, folderName, currentSerial),
          expanded: false,
          completed,
          fake: true
        };
      });

      return {
        id: `fake-folder-${category.id}-${folderIndex + 1}`,
        name: folderName,
        storyCount: stories.length,
        nodeCount: sumNodes(stories),
        stories,
        expanded: categoryIndex === 0 && folderIndex === 0,
        fake: true
      };
    });

    return {
      id: `fake-group-${category.id}`,
      name: category.name,
      storyCount: folders.reduce((total, folder) => total + folder.storyCount, 0),
      nodeCount: folders.reduce((total, folder) => total + folder.nodeCount, 0),
      folders,
      fake: true
    };
  });
};

const normalizeRealStories = (stories = []) => stories.map((story) => ({
  ...story,
  nodeCount: story.nodeCount || (story.nodes || []).length,
  nodes: story.nodes || [],
  expanded: false,
  fake: false
}));

const normalizeAdminUsers = (users = []) => users.map((user) => ({
  ...user,
  completedStories: user.completedStories || 0,
  totalBadges: user.totalBadges || 0,
  registerTimeText: formatAdminTime(user.registerTime),
  lastCompletedTimeText: formatAdminTime(user.lastCompletedTime),
  lastBadgeTimeText: formatAdminTime(user.lastBadgeTime),
  completedStoryList: (user.completedStoryList || []).map((story) => ({
    ...story,
    completedTimeText: formatAdminTime(story.completedTime)
  })),
  badgeList: (user.badgeList || []).map((badge) => ({
    ...badge,
    obtainedTimeText: formatAdminTime(badge.obtainedTime)
  }))
}));

const buildStoryGroups = (stories = [], completedFakeStoryIds = new Set()) => {
  const realStories = normalizeRealStories(stories);
  const realNodeCount = sumNodes(realStories);
  const testGroups = createTestStoryGroups(completedFakeStoryIds);
  const fakeStoryCount = testGroups.reduce((total, group) => total + group.storyCount, 0);
  const fakeNodeCount = testGroups.reduce((total, group) => total + group.nodeCount, 0);

  return {
    groups: [
      {
        id: 'real-group',
        name: '后端真实剧情',
        storyCount: realStories.length,
        nodeCount: realNodeCount,
        folders: [{
          id: 'real-folder-default',
          name: '服务端剧情名录',
          storyCount: realStories.length,
          nodeCount: realNodeCount,
          stories: realStories,
          expanded: true,
          fake: false
        }],
        fake: false
      },
      ...testGroups
    ],
    summary: `共 ${realStories.length + fakeStoryCount} 个故事 / ${realNodeCount + fakeNodeCount} 个节点，含 ${fakeStoryCount} 个后台测试假故事，后台测试完成 ${completedFakeStoryIds.size} 个`
  };
};

Page({
  data: {
    activeTab: 'users',
    stats: { totalUsers: 0, completedStories: 0, totalBadges: 0 },
    users: [],
    userDetailVisible: false,
    detailUser: null,
    userSortOrder: 'desc',
    showCompletedDetail: false,
    showBadgeDetail: false,
    storyGroups: [],
    adminStorySummary: '',
    previewVisible: false,
    previewStory: null,
    previewNode: null,
    previewNodeIndex: 0,
    previewTotalNodes: 0,
    previewIsFirst: true,
    previewIsLast: true,
    previewCompleteText: '下一节点',
    previewCompleteDisabled: false,
    completedFakeStoryIds: [],
    exportTextVisible: false,
    exportTextContent: '',
    loading: true,
    loadError: ''
  },
  onShow() { this.loadDashboard(); },
  getCompletedFakeStoryIds() {
    const ids = wx.getStorageSync(COMPLETED_FAKE_STORY_KEY);
    return Array.isArray(ids) ? ids : [];
  },
  saveCompletedFakeStoryIds(ids) {
    wx.setStorageSync(COMPLETED_FAKE_STORY_KEY, ids);
  },
  async loadDashboard() {
    this.setData({ loading: true, loadError: '' });
    try {
      const [summary, stories] = await Promise.all([api.getAdminStats(this.data.userSortOrder), api.getAdminStories()]);
      const users = normalizeAdminUsers(summary.users || []);
      const detailUser = this.data.detailUser
        ? users.find((user) => user.id === this.data.detailUser.id) || null
        : null;
      const completedFakeStoryIds = this.getCompletedFakeStoryIds();
      const storyCatalog = buildStoryGroups(stories, new Set(completedFakeStoryIds));
      this.setData({
        stats: {
          totalUsers: summary.totalUsers || 0,
          completedStories: summary.completedStories || 0,
          totalBadges: summary.totalBadges || 0
        },
        users,
        detailUser,
        userDetailVisible: !!detailUser && this.data.userDetailVisible,
        storyGroups: storyCatalog.groups,
        adminStorySummary: storyCatalog.summary,
        completedFakeStoryIds,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false, loadError: error.message || '后台数据加载失败' });
    }
  },
  switchTab(e) { this.setData({ activeTab: e.currentTarget.dataset.tab }); },
  openUserDetail(e) {
    const id = Number(e.currentTarget.dataset.id);
    const detailUser = this.data.users.find((user) => user.id === id) || null;
    if (!detailUser) return;
    this.setData({
      userDetailVisible: true,
      detailUser,
      showCompletedDetail: false,
      showBadgeDetail: false
    });
  },
  closeUserDetail() {
    this.setData({
      userDetailVisible: false,
      detailUser: null,
      showCompletedDetail: false,
      showBadgeDetail: false
    });
  },
  toggleUserSort() {
    this.setData({
      userSortOrder: this.data.userSortOrder === 'desc' ? 'asc' : 'desc'
    });
    this.loadDashboard();
  },
  toggleCompletedDetail() {
    this.setData({ showCompletedDetail: !this.data.showCompletedDetail });
  },
  toggleBadgeDetail() {
    this.setData({ showBadgeDetail: !this.data.showBadgeDetail });
  },
  findStory(groupid, folderid, storyid) {
    const group = this.data.storyGroups.find((item) => item.id === groupid);
    if (!group) return null;
    const folder = group.folders.find((item) => item.id === folderid);
    if (!folder) return null;
    return folder.stories.find((item) => String(item.id) === String(storyid)) || null;
  },
  toggleFolder(e) {
    const { groupid, folderid } = e.currentTarget.dataset;
    this.setData({
      storyGroups: this.data.storyGroups.map((group) => group.id !== groupid ? group : {
        ...group,
        folders: group.folders.map((folder) => folder.id !== folderid ? folder : {
          ...folder,
          expanded: !folder.expanded
        })
      })
    });
  },
  toggleStory(e) {
    const { groupid, folderid, storyid } = e.currentTarget.dataset;
    this.setData({
      storyGroups: this.data.storyGroups.map((group) => group.id !== groupid ? group : {
        ...group,
        folders: group.folders.map((folder) => folder.id !== folderid ? folder : {
          ...folder,
          stories: folder.stories.map((story) => String(story.id) === String(storyid) ? {
            ...story,
            expanded: !story.expanded
          } : story)
        })
      })
    });
  },
  openStoryPreview(e) {
    const { groupid, folderid, storyid } = e.currentTarget.dataset;
    const story = this.findStory(groupid, folderid, storyid);
    if (!story) {
      wx.showToast({ title: '故事不存在', icon: 'none' });
      return;
    }

    const nodes = story.nodes || [];
    const actionState = getPreviewActionState(story, 0, nodes.length);
    this.setData({
      previewVisible: true,
      previewStory: story,
      previewNodeIndex: 0,
      previewTotalNodes: nodes.length,
      previewIsFirst: true,
      previewIsLast: nodes.length <= 1,
      previewCompleteText: actionState.text,
      previewCompleteDisabled: actionState.disabled,
      previewNode: nodes[0] || {
        id: `${story.id}-empty`,
        character: '系统',
        text: '当前故事暂无节点。',
        isEnd: true
      }
    });
  },
  closeStoryPreview() {
    this.setData({
      previewVisible: false,
      previewStory: null,
      previewNode: null,
      previewNodeIndex: 0,
      previewTotalNodes: 0,
      previewIsFirst: true,
      previewIsLast: true,
      previewCompleteText: '下一节点',
      previewCompleteDisabled: false
    });
  },
  setPreviewNode(index) {
    const story = this.data.previewStory;
    const nodes = story && story.nodes ? story.nodes : [];
    if (!nodes.length) return;
    const safeIndex = Math.max(0, Math.min(index, nodes.length - 1));
    const actionState = getPreviewActionState(story, safeIndex, nodes.length);
    this.setData({
      previewNodeIndex: safeIndex,
      previewNode: nodes[safeIndex],
      previewIsFirst: safeIndex === 0,
      previewIsLast: safeIndex >= nodes.length - 1,
      previewCompleteText: actionState.text,
      previewCompleteDisabled: actionState.disabled
    });
  },
  markPreviewStoryCompleted() {
    const story = this.data.previewStory;
    if (!story || !story.fake || story.completed) return;

    const completedFakeStoryIds = Array.from(new Set([...this.data.completedFakeStoryIds, story.id]));
    this.saveCompletedFakeStoryIds(completedFakeStoryIds);

    const storyGroups = this.data.storyGroups.map((group) => ({
      ...group,
      folders: group.folders.map((folder) => ({
        ...folder,
        stories: folder.stories.map((item) => item.id === story.id ? {
          ...item,
          completed: true,
          status: '测试完成'
        } : item)
      }))
    }));

    this.setData({
      completedFakeStoryIds,
      storyGroups,
      previewStory: { ...story, completed: true, status: '测试完成' },
      previewCompleteText: '已完成',
      previewCompleteDisabled: true,
      adminStorySummary: this.data.adminStorySummary.replace(/后台测试完成 \d+ 个$/, `后台测试完成 ${completedFakeStoryIds.length} 个`)
    });

    wx.showToast({ title: '测试故事已完成', icon: 'success' });
  },
  prevPreviewNode() {
    if (this.data.previewNodeIndex <= 0) {
      wx.showToast({ title: '已经是第一个节点', icon: 'none' });
      return;
    }
    this.setPreviewNode(this.data.previewNodeIndex - 1);
  },
  nextPreviewNode() {
    const story = this.data.previewStory;
    const nodes = story && story.nodes ? story.nodes : [];
    if (this.data.previewNodeIndex >= nodes.length - 1) {
      if (story && story.fake && !story.completed) {
        this.markPreviewStoryCompleted();
        return;
      }
      wx.showToast({ title: story && story.completed ? '故事已完成' : '已经到达故事结尾', icon: 'none' });
      return;
    }
    const nextIndex = this.data.previewNodeIndex + 1;
    this.setPreviewNode(nextIndex);
  },
  async exportUsers() { try { await api.exportUsers(); wx.showToast({ title: '已打开导出文件', icon: 'success' }); } catch (error) { wx.showToast({ title: error.message || '导出失败', icon: 'none' }); } },
  async exportStories() {
    try {
      wx.showLoading({ title: '导出中...' });
      const result = await api.exportStories();
      wx.hideLoading();
      this.setData({
        exportTextVisible: true,
        exportTextContent: result.content || '暂无可导出的剧情内容'
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: error.message || '导出失败', icon: 'none' });
    }
  },
  closeExportText() {
    this.setData({ exportTextVisible: false });
  },
  copyExportText() {
    wx.setClipboardData({
      data: this.data.exportTextContent,
      success: () => wx.showToast({ title: '已复制全文', icon: 'success' })
    });
  },
  logout() {
    wx.showModal({
      title: '退出后台？',
      content: '将清除本机管理员登录状态。',
      success: ({ confirm }) => {
        if (!confirm) return;
        api.clearAdminState();
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack();
        } else {
          wx.reLaunch({ url: '/pages/home/home' });
        }
      }
    });
  }
});
