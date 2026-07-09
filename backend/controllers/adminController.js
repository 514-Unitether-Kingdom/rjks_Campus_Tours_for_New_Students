const bcrypt = require('bcryptjs');
const exceljs = require('exceljs');

const db = require('../config/db');
const Admin = require('../models/Admin');
const Story = require('../models/Story');
const Badge = require('../models/Badge');
const StoryProgress = require('../models/StoryProgress');
const OperationLog = require('../models/OperationLog');
const { signAdminToken } = require('../utils/jwt');
const C = require('../utils/constants');
const dto = require('../utils/dto');
const fmt = require('../utils/format');

// =============================================================
// 管理员登录（T6，后端 A 实现，此处保持原样）
// =============================================================
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.fail(C.PARAM_MISSING, '用户名和密码不能为空');
    }

    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.fail(C.ADMIN_LOGIN_DENIED, '用户名或密码错误');
    }

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return res.fail(C.ADMIN_LOCKED, `账号已被锁定，请于 ${fmt.formatDateTime(admin.locked_until)} 后重试`);
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      const failed = (admin.failed_count || 0) + 1;
      await Admin.updateFailedCount(admin.id, failed);

      if (failed >= 5) {
        await Admin.lock(admin.id, new Date(Date.now() + 15 * 60 * 1000));
        return res.fail(C.ADMIN_LOCKED, '连续失败5次，账号已锁定15分钟');
      }
      return res.fail(C.ADMIN_LOGIN_DENIED, `用户名或密码错误，还剩 ${5 - failed} 次机会`);
    }

    await Admin.resetFailedCount(admin.id);
    res.success({ token: signAdminToken(admin.id) });
  } catch (err) {
    next(err);
  }
};

// =============================================================
// 后台统计（T7）
// =============================================================

// GET /api/admin/stats
//
// 「剧情完成数」的口径：待澄清事项 Q-13 已定为「历史累计数，不包含重复计数」。
// story_progress 有 uk_progress(user_id, story_id)，一人一剧情至多一行，
// 因此 COUNT(*) 就是不含重复的历史累计完成数。
// 注意不是 COUNT(DISTINCT user_id)——那统计的是「完成过任意剧情的人数」，是另一个指标。
exports.getStats = async (req, res, next) => {
  try {
    const [[users]] = await db.query('SELECT COUNT(*) AS total FROM users');
    const completedStories = await StoryProgress.countCompleted();
    const totalBadges = await Badge.countAllObtained();

    res.success({
      totalUsers: users.total,
      completedStories,
      totalBadges
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users?page=1&pageSize=20
// 不返回 openid：NFR-17 最小必要原则，且与 userController.getProfile 的处理保持一致。
exports.getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const offset = (page - 1) * pageSize;

    const [rows] = await db.query(
      `SELECT id, name, gender, grade, college, major, register_time
       FROM users ORDER BY id DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    const [[total]] = await db.query('SELECT COUNT(*) AS total FROM users');

    res.success({
      list: rows.map(dto.toAdminUser),
      total: total.total,
      page,
      pageSize
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/stories
// F-12 剧情内容预览：树形展示全部剧情节点，含 disabled 的后续迭代剧情。
exports.getStories = async (req, res, next) => {
  try {
    const stories = await Story.listAll();
    const tree = [];
    for (const s of stories) {
      const nodes = await Story.listNodes(s.id);
      tree.push({
        id: s.code,
        name: s.name,
        // 前端 admin-dashboard.wxml 用 item.type === '长故事' 判断样式，
        // 故此处直接下发中文标签，另附 rawType 供程序判断。
        type: s.type === 'long' ? '长故事' : '短故事',
        rawType: s.type,
        status: s.status,
        nodeCount: nodes.length,
        nodes: nodes.map(dto.toNode)
      });
    }
    res.success(tree);
  } catch (err) {
    next(err);
  }
};

// =============================================================
// 导出（T7）
//
// 文件名：users_YYYYMMDD_HHmmss.xlsx / stories_YYYYMMDD_HHmmss.txt（Q-12）
// 导出人不写进文件名，改记入 operation_logs（《软件设计说明》5.5）
//
// 微信小程序读不到 Content-Disposition 里的 filename，也不能像浏览器那样
// 自动下载，必须 wx.downloadFile + wx.openDocument / wx.saveFileToDisk。
// 因此额外通过 X-Filename 响应头下发文件名，并用
// Access-Control-Expose-Headers 允许前端读取。
// =============================================================

const exposeFilename = (res, filename) => {
  const encoded = encodeURIComponent(filename);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`);
  res.setHeader('X-Filename', encoded);
  res.setHeader('Access-Control-Expose-Headers', 'X-Filename, Content-Disposition');
};

// GET /api/admin/export/users.xlsx
exports.exportUsersExcel = async (req, res, next) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, gender, grade, college, major, register_time
       FROM users ORDER BY id`
    );

    // BR-36 / FN-15-05：无数据时不生成空文件
    if (!users.length) return res.fail(C.EXPORT_NO_DATA, '暂无用户数据可导出');

    const workbook = new exceljs.Workbook();

    const summary = workbook.addWorksheet('统计');
    summary.columns = [
      { header: '统计项', key: 'k', width: 20 },
      { header: '数值', key: 'v', width: 20 }
    ];
    summary.addRow({ k: '总注册人数', v: users.length });
    summary.addRow({ k: '导出时间', v: fmt.formatDateTime(new Date()) });

    const sheet = workbook.addWorksheet('用户数据');
    sheet.columns = [
      { header: '序号', key: 'idx', width: 8 },
      { header: '姓名', key: 'name', width: 16 },
      { header: '性别', key: 'gender', width: 10 },
      { header: '年级', key: 'grade', width: 12 },
      { header: '学院', key: 'college', width: 24 },
      { header: '专业', key: 'major', width: 24 },
      { header: '注册时间', key: 'registerTime', width: 22 }
    ];

    users.forEach((u, i) => {
      sheet.addRow({
        idx: i + 1,
        // 用户可控字段一律做公式注入转义（姓名填 =HYPERLINK(...) 会被 Excel 当公式执行）
        name: fmt.sanitizeForExcel(u.name),
        gender: fmt.sanitizeForExcel(u.gender),
        grade: fmt.sanitizeForExcel(u.grade),
        college: fmt.sanitizeForExcel(u.college),
        major: fmt.sanitizeForExcel(u.major),
        registerTime: fmt.formatDateTime(u.register_time)
      });
    });

    const filename = `users_${fmt.timestampForFilename()}.xlsx`;
    await OperationLog.record({
      operatorId: req.admin.id,
      action: 'EXPORT_USERS',
      targetType: 'users',
      targetId: String(users.length),
      ip: req.ip
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    exposeFilename(res, filename);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/export/stories.txt
exports.exportStoriesTxt = async (req, res, next) => {
  try {
    const stories = await Story.listAll();
    if (!stories.length) return res.fail(C.EXPORT_NO_DATA, '暂无剧情内容可导出');

    const lines = [];
    lines.push('探校之旅 —— 剧情内容导出');
    lines.push(`导出时间：${fmt.formatDateTime(new Date())}`);
    lines.push('');

    let nodeTotal = 0;
    for (const s of stories) {
      const nodes = await Story.listNodes(s.id);
      nodeTotal += nodes.length;

      lines.push('='.repeat(60));
      lines.push(`【${s.name}】`);
      lines.push(`剧情编码：${s.code}　类型：${s.type === 'long' ? '长故事' : '短故事'}　状态：${s.status}`);
      lines.push(`简介：${s.description || '（无）'}`);
      lines.push(`节点数：${nodes.length}`);
      lines.push('-'.repeat(60));

      nodes.forEach((n) => {
        const speaker = n.speaker ? `${n.speaker}：` : '';
        // 对话文案内部自带的换行原样保留（FN-16-05），不转义、不压缩
        lines.push(`${n.sort_order}. [${n.node_key}] ${speaker}${n.dialogue_text}`);
        if (n.is_end) lines.push('   （本节点为剧情结束节点，触发勋章发放）');
        lines.push('');
      });
    }

    if (nodeTotal === 0) return res.fail(C.EXPORT_NO_DATA, '暂无剧情内容可导出');

    // UTF-8 BOM + CRLF：不加 BOM 时 Windows 记事本打开中文会乱码
    const content = fmt.UTF8_BOM + fmt.toCRLF(lines.join('\n'));
    const filename = `stories_${fmt.timestampForFilename()}.txt`;

    await OperationLog.record({
      operatorId: req.admin.id,
      action: 'EXPORT_STORIES',
      targetType: 'stories',
      targetId: String(stories.length),
      ip: req.ip
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    exposeFilename(res, filename);
    res.send(Buffer.from(content, 'utf8'));
  } catch (err) {
    next(err);
  }
};
