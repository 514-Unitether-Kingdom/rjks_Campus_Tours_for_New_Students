const KbEntry = require('../models/KbEntry');
const QaRecord = require('../models/QaRecord');
const C = require('../utils/constants');

// 后台：知识库管理（增删改查）+ 问答记录查看。
// 均需 adminToken（路由上挂 adminAuth）。

// GET /api/admin/kb
exports.listKb = async (req, res, next) => {
  try {
    res.success(await KbEntry.listAll());
  } catch (err) { next(err); }
};

// POST /api/admin/kb
exports.createKb = async (req, res, next) => {
  try {
    const { category, question, answer } = req.body;
    if (!category || !question || !answer) {
      return res.fail(C.PARAM_MISSING, 'category、question、answer 为必填');
    }
    const id = await KbEntry.create(req.body);
    res.success({ id });
  } catch (err) { next(err); }
};

// PUT /api/admin/kb/:id
exports.updateKb = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cur = await KbEntry.findById(id);
    if (!cur) return res.fail(C.KB_ENTRY_NOT_FOUND, '知识条目不存在');
    // 允许只传要改的字段，其余沿用原值
    await KbEntry.update(id, { ...cur, ...req.body });
    res.success({ id });
  } catch (err) { next(err); }
};

// DELETE /api/admin/kb/:id
exports.removeKb = async (req, res, next) => {
  try {
    const ok = await KbEntry.remove(Number(req.params.id));
    if (!ok) return res.fail(C.KB_ENTRY_NOT_FOUND, '知识条目不存在');
    res.success({ deleted: true });
  } catch (err) { next(err); }
};

// GET /api/admin/qa-records?page=1&pageSize=20
exports.listQaRecords = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const list = await QaRecord.listRecent(pageSize, (page - 1) * pageSize);
    const total = await QaRecord.countAll();
    res.success({ list, total, page, pageSize });
  } catch (err) { next(err); }
};
