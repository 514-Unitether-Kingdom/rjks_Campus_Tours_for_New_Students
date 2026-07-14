const axios = require('axios');

// DeepSeek 对话补全。接口与 OpenAI 兼容。
// 从国内（腾讯云）能直接访问 api.deepseek.com。
// key 未配置或调用失败时抛错，由上层（askController）降级处理，不让请求崩。
const API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

exports.chat = async (messages, { temperature = 0.3, maxTokens = 800, timeout = 20000 } = {}) => {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    const e = new Error('DEEPSEEK_API_KEY 未配置');
    e.code = 'NO_KEY';
    throw e;
  }
  // temperature 调低（0.3）让回答更贴事实、少发挥
  const resp = await axios.post(
    API_URL,
    { model: MODEL, messages, temperature, max_tokens: maxTokens, stream: false },
    { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, timeout }
  );
  const content = resp.data && resp.data.choices && resp.data.choices[0]
    && resp.data.choices[0].message && resp.data.choices[0].message.content;
  if (!content) throw new Error('模型返回为空');
  return content.trim();
};

// 流式对话补全：边生成边回调 onDelta(文字块)，返回完整答案。
// 解析 DeepSeek 的 SSE（每行 `data: {json}`，结尾 `data: [DONE]`）。
// key 未配置或网络失败抛错，由上层降级（同 chat）。
exports.chatStream = async (messages, onDelta, { temperature = 0.3, maxTokens = 800, timeout = 30000 } = {}) => {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    const e = new Error('DEEPSEEK_API_KEY 未配置');
    e.code = 'NO_KEY';
    throw e;
  }
  const resp = await axios.post(
    API_URL,
    { model: MODEL, messages, temperature, max_tokens: maxTokens, stream: true },
    {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      timeout,
      responseType: 'stream'
    }
  );

  // StringDecoder 会把切在网络分片边界的多字节字符（中文/emoji）暂存到下次，
  // 避免 chunk.toString('utf8') 对半个字符产生替换符 �（曾导致答案里出现乱码）。
  const { StringDecoder } = require('string_decoder');
  const decoder = new StringDecoder('utf8');

  let full = '';
  await new Promise((resolve, reject) => {
    let buf = '';
    resp.data.on('data', (chunk) => {
      buf += decoder.write(chunk);
      let nl;
      // 按行拆；网络分片可能切断一行，剩余留在 buf 下次拼
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const obj = JSON.parse(payload);
          const delta = obj.choices && obj.choices[0] && obj.choices[0].delta && obj.choices[0].delta.content;
          if (delta) { full += delta; onDelta(delta); }
        } catch (e) { /* 分片未成完整 JSON，忽略 */ }
      }
    });
    resp.data.on('end', resolve);
    resp.data.on('error', reject);
  });

  if (!full.trim()) throw new Error('模型流式返回为空');
  return full.trim();
};

exports.hasKey = () => !!process.env.DEEPSEEK_API_KEY;
