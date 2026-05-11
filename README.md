<h1 align="center">
🎵 Edge TTS Cloudflare Worker
</h1>

<p align="center">
    <br> <a href="README-EN.md">English</a> | 中文
</p>
<p align="center">

> 把微软 Edge 的神经网络语音合成能力，包装成 OpenAI TTS API 兼容格式，部署在 Cloudflare Workers 上。免费、快速、无需服务器！

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/snakeying/edge-tts-worker)

## ✨ 特性

- 🆓 **完全免费** - 基于 Edge TTS，无需付费 API
- 🚀 **超低延迟** - Cloudflare 全球边缘网络加速
- 🔌 **OpenAI 兼容** - 直接替换 OpenAI TTS API，无缝迁移
- 🎭 **多种音色** - 6 种预设音色 + 支持所有 Edge TTS 原生音色
- 🛡️ **安全可控** - 自定义 API Key 保护
- 📱 **自带 WebUI** - 浏览器直接测试，无需写代码

## 🚀 快速部署

### 方式一：Cloudflare Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Create Application** → **Create Worker**
3. 随便起个名字，点击 **Deploy**
4. 点击 **Edit code**，删除默认代码，粘贴 `worker.js` 的内容
5. 点击 **Save and Deploy** 🎉

### 方式二：Wrangler CLI

```bash
git clone https://github.com/EucWang/edge-tts-worker.git
cd edge-tts-worker
npx wrangler deploy
```

### 设置 API Key（重要！）

部署后，进入 Worker 设置：

**Settings** → **Variables** → **Add variable**

| Variable name | Value |
|---------------|-------|
| `API_KEY` | 你的自定义密钥（如 `sk-my-secret-key`） |
| `MAX_TEXT_LENGTH` | （可选）输入文本最大字符数，默认 `1200` |

> ⚠️ 不设置 API Key 的话，API 会返回 500 错误哦！

## 📖 API 使用

### 端点

```
POST https://your-worker.your-subdomain.workers.dev/v1/audio/speech
```

### 请求格式

完全兼容 [OpenAI TTS API](https://platform.openai.com/docs/api-reference/audio/createSpeech)：

```json
{
  "model": "tts-1",
  "input": "你好，世界！",
  "voice": "alloy",
  "speed": 1.0
}
```

### cURL 示例

**基础用法** 🎯

```bash
curl -X POST "https://your-worker.workers.dev/v1/audio/speech" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "你好，这是一段测试语音。",
    "voice": "alloy"
  }' \
  --output speech.mp3
```

**调整语速** 🏃

```bash
curl -X POST "https://your-worker.workers.dev/v1/audio/speech" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "这段话会说得比较快！",
    "voice": "nova",
    "speed": 1.5
  }' \
  --output fast.mp3
```

**使用原生 Edge TTS 音色** 🎭

```bash
curl -X POST "https://your-worker.workers.dev/v1/audio/speech" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello, this is a test with English voice.",
    "voice": "en-US-JennyNeural"
  }' \
  --output english.mp3
```

**高级参数** 🔧

```bash
curl -X POST "https://your-worker.workers.dev/v1/audio/speech" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "这是一段**带格式**的文本，包含链接 https://example.com 和表情 😊",
    "voice": "shimmer",
    "speed": 1.2,
    "pitch": 1.1,
    "style": "cheerful",
    "cleaning_options": {
      "remove_markdown": true,
      "remove_emoji": true,
      "remove_urls": true
    }
  }' \
  --output advanced.mp3
```

### 获取可用模型

```bash
curl "https://your-worker.workers.dev/v1/models" \
  -H "Authorization: Bearer your-api-key"
```

## 🎭 预设音色

| Voice | 描述 | Edge TTS 音色 |
|-------|------|---------------|
| `shimmer` | 温柔女声 | zh-CN-XiaoxiaoNeural |
| `alloy` | 专业男声 | zh-CN-YunyangNeural |
| `fable` | 激情男声 | zh-CN-YunjianNeural |
| `onyx` | 活泼女声 | zh-CN-XiaoyiNeural |
| `nova` | 阳光男声 | zh-CN-YunxiNeural |
| `echo` | 东北女声 | zh-CN-liaoning-XiaobeiNeural |

> 💡 也可以直接使用任何 [Edge TTS 原生音色](https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/language-support?tabs=tts)，如 `en-US-JennyNeural`、`ja-JP-NanamiNeural` 等

## ⚙️ 完整参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `model` | string | `tts-1` | 模型名称（兼容用，实际不影响） |
| `input` | string | **必填** | 要转换的文本（最大 1200 字符） |
| `voice` | string | `shimmer` | 音色名称 |
| `speed` | number | `1.0` | 语速 (0.5 - 2.0) |
| `pitch` | number | `1.0` | 音调 (0.5 - 1.5) |
| `style` | string | `general` | 语音风格 |
| `role` | string | - | 角色扮演 |
| `styleDegree` | number | `1.0` | 风格强度 (0.01 - 2.0) |
| `stream` | boolean | `false` | 流式输出 |
| `cleaning_options` | object | - | 文本清理选项 |

### cleaning_options

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `remove_markdown` | boolean | `true` | 移除 Markdown 格式 |
| `remove_emoji` | boolean | `true` | 移除 Emoji |
| `remove_urls` | boolean | `true` | 移除 URL |
| `remove_line_breaks` | boolean | `false` | 移除换行符 |
| `remove_citation_numbers` | boolean | `true` | 移除引用标记 `[1]` |
| `custom_keywords` | string | - | 自定义移除关键词（逗号分隔） |

## 🖥️ WebUI

部署后直接访问 Worker 根路径即可使用内置测试页面：

```
https://your-worker.workers.dev/
```

![WebUI Screenshot](screenshot.png)

## 🔗 在其他应用中使用

### OpenAI SDK (Python)

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="https://your-worker.workers.dev/v1"
)

response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",
    input="你好，世界！"
)

response.stream_to_file("output.mp3")
```

### OpenAI SDK (Node.js)

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'https://your-worker.workers.dev/v1',
});

const mp3 = await openai.audio.speech.create({
  model: 'tts-1',
  voice: 'alloy',
  input: '你好，世界！',
});

const buffer = Buffer.from(await mp3.arrayBuffer());
await fs.promises.writeFile('output.mp3', buffer);
```

## ❓ FAQ

**Q: 免费额度够用吗？**

A: Cloudflare Workers 免费版每天 10 万次请求，个人使用绑绑有余 ✌️

**Q: 支持哪些语言？**

A: Edge TTS 支持 100+ 种语言和地区变体，[完整列表看这里](https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/language-support?tabs=tts)

**Q: 为什么返回 500 错误？**

A: 大概率是没设置 `API_KEY` 环境变量，去 Worker Settings 里加上就好

**Q: 长文本会被截断吗？**

A: 输入文本限制为 1200 字符（可通过环境变量 `MAX_TEXT_LENGTH` 调整）。超过限制会返回 400 错误。代码会自动按句子边界智能分块，然后拼接成完整音频 🧠

**Q: 输入文本长度有限制吗？**

A: 是的，默认限制 1200 字符。这是为了确保服务稳定性和响应速度。如需调整，可在 Worker 环境变量中设置 `MAX_TEXT_LENGTH`。

## 📄 License

MIT License - 随便用，开心就好 😄

## 🙏 致谢

- [Microsoft Edge TTS](https://azure.microsoft.com/en-us/products/ai-services/text-to-speech) - 提供高质量语音合成
- [Cloudflare Workers](https://workers.cloudflare.com/) - 提供免费边缘计算平台

---

**如果觉得有用，给个 ⭐ Star 呗~**
