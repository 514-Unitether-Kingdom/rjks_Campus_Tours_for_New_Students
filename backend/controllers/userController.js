const User = require('../models/User');
const C = require('../utils/constants');

const GRADE_LIST = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博一', '博二', '博三', '博四及以上'];
const COLLEGE_MAJOR_MAP = {
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
};
const OPTIONAL_EMPTY_VALUE = '未选择';

const normalizeText = (value) => String(value || '').trim();

exports.getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { openid, register_time, update_time, ...rest } = user;
    res.success({
      ...rest,
      registerTime: register_time,
      updateTime: update_time
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const name = normalizeText(req.body.name);
    const gender = normalizeText(req.body.gender);
    const grade = normalizeText(req.body.grade);
    const college = normalizeText(req.body.college);
    const major = normalizeText(req.body.major);

    if (!name || !gender) {
      return res.fail(C.PARAM_MISSING, '姓名和性别为必填项');
    }

    // 字段长度校验（防止数据库异常）
    const nameLen = (name || '').length;
    const genderLen = (gender || '').length;
    const gradeLen = (grade || '').length;
    const collegeLen = (college || '').length;
    const majorLen = (major || '').length;

    if (nameLen > 50) return res.fail(C.PARAM_INVALID, '姓名长度不能超过50个字符');
    if (genderLen > 10) return res.fail(C.PARAM_INVALID, '性别长度不能超过10个字符');
    if (gradeLen > 20) return res.fail(C.PARAM_INVALID, '年级长度不能超过20个字符');
    if (collegeLen > 100) return res.fail(C.PARAM_INVALID, '学院长度不能超过100个字符');
    if (majorLen > 100) return res.fail(C.PARAM_INVALID, '专业长度不能超过100个字符');

    if (grade && grade !== OPTIONAL_EMPTY_VALUE && !GRADE_LIST.includes(grade)) {
      return res.fail(C.PARAM_INVALID, '学员信息无效：年级不在合法名录中');
    }

    if (college && college !== OPTIONAL_EMPTY_VALUE && !COLLEGE_MAJOR_MAP[college]) {
      return res.fail(C.PARAM_INVALID, '学员信息无效：学院不在合法名录中');
    }

    if (major && major !== OPTIONAL_EMPTY_VALUE) {
      if (!college || college === OPTIONAL_EMPTY_VALUE) {
        return res.fail(C.PARAM_INVALID, '学员信息无效：选择专业前必须先选择学院');
      }
      if (!COLLEGE_MAJOR_MAP[college].includes(major)) {
        return res.fail(C.PARAM_INVALID, '学员信息无效：专业与学院不匹配');
      }
    }

    const updatedUser = await User.updateProfile(req.user.id, {
      name, gender, grade, college, major
    });

    const { openid, register_time, update_time, ...rest } = updatedUser;
    res.success({
      ...rest,
      registerTime: register_time,
      updateTime: update_time
    });
  } catch (err) {
    next(err);
  }
};
