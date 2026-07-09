const pad = (n) => String(n).padStart(2, '0');

// 导出文件名用的时间戳：20260709_143022（待澄清事项 Q-12 的结论）
exports.timestampForFilename = (date = new Date()) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_` +
  `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

// 人类可读时间：2026-07-09 14:30:22
exports.formatDateTime = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// 防 Excel 公式注入（CSV Injection）
//
// 若用户把姓名填成 =HYPERLINK("http://evil.com","点我") 或 =cmd|'/c calc'!A1，
// 导出的 xlsx 在 Excel 中打开会被当作公式求值。以 = + - @ 制表符 回车 开头的
// 单元格值一律加单引号前缀，强制 Excel 按文本处理。
const DANGEROUS_PREFIX = /^[=+\-@\t\r]/;
exports.sanitizeForExcel = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return value;
  return DANGEROUS_PREFIX.test(value) ? `'${value}` : value;
};

// TXT 导出：Windows 记事本以 UTF-8 无 BOM 打开中文会乱码，故加 BOM；
// 换行统一 CRLF。剧情文案内部自带的 \n 原样保留（FN-16-05）。
exports.UTF8_BOM = String.fromCharCode(0xFEFF); // U+FEFF，不写字面字符以免被编辑器吞掉
exports.toCRLF = (text) => text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
