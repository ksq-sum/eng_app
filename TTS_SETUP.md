# Edge TTS 音频服务集成指南

## 🎯 方案说明

使用 **Python 后端 + Edge TTS** 方案替代原有音频源：
- ✅ **完全免费**，无 API 限制
- ✅ **高质量语音**，微软 Edge 浏览器同款
- ✅ **支持多种语音**，美式/英式，男声/女声
- ✅ **本地缓存**，相同文本只生成一次
- ✅ **跨平台支持**，Windows/Mac/Linux

## 📦 安装步骤

### 1. 安装 Python（如果还没有）
- 下载: https://www.python.org/downloads/
- 版本要求: Python 3.8+
- **重要**: 安装时勾选 "Add Python to PATH"

### 2. 启动 TTS 服务器

**Windows 用户（推荐）:**
```bash
# 双击运行
start_tts_server.bat
```

**手动启动（所有平台）:**
```bash
# 创建虚拟环境（首次）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
python tts_server.py
```

服务启动后会显示：
```
Edge TTS 服务器启动中...
可用语音:
  female: en-US-JennyNeural
  male: en-US-GuyNeural
  ...
访问 http://localhost:5000/health 检查服务状态
```

### 3. 集成到前端

在 `app.js` 中导入并使用新的音频播放器：

```javascript
// 导入 Edge TTS 播放器
import { createEdgeAudioPlayer, checkTTSService } from './audio_edge.js';

// 检查服务是否可用
const isServiceAvailable = await checkTTSService();

if (isServiceAvailable) {
  // 使用 Edge TTS
  const player = createEdgeAudioPlayer(reportCallback);
  player.speak("Hello, how are you?", 0.85);
} else {
  // 降级到原有方案
  const player = createAudioPlayer(reportCallback);
  player.speak("Hello, how are you?", 0.85);
}
```

## 🔧 API 文档

### POST /tts
文本转语音

**请求:**
```json
{
  "text": "Hello, how are you?",
  "voice": "female",  // female/male/female-uk/male-uk
  "speed": 0.85       // 0.5-2.0
}
```

**响应:** MP3 音频文件

### GET /voices
获取可用语音列表

**响应:**
```json
{
  "voices": {
    "female": "en-US-JennyNeural",
    "male": "en-US-GuyNeural",
    "female-uk": "en-GB-SoniaNeural",
    "male-uk": "en-GB-RyanNeural"
  },
  "default": "female"
}
```

### GET /health
健康检查

### POST /cache/clear
清理音频缓存

## 🎨 可用语音

| 语音类型 | 语音名称 | 描述 |
|---------|---------|------|
| `female` | en-US-JennyNeural | 美式英语女声（推荐） |
| `male` | en-US-GuyNeural | 美式英语男声 |
| `female-uk` | en-GB-SoniaNeural | 英式英语女声 |
| `male-uk` | en-GB-RyanNeural | 英式英语男声 |

## 📁 文件说明

```
eng_app/
├── tts_server.py          # Python TTS 服务器
├── audio_edge.js          # 前端 Edge TTS 播放器
├── requirements.txt       # Python 依赖
├── start_tts_server.bat   # Windows 启动脚本
├── audio_cache/           # 音频缓存目录（自动创建）
└── venv/                  # Python 虚拟环境（自动创建）
```

## 🚀 使用流程

1. **启动后端服务**: 运行 `start_tts_server.bat`
2. **启动前端**: 运行 `npm start` 或 `node server.js`
3. **测试**: 打开浏览器访问应用，点击播放按钮

## ⚠️ 注意事项

1. **首次使用**: 需要联网下载语音模型（约几秒钟）
2. **缓存机制**: 相同文本会缓存，第二次播放秒开
3. **端口占用**: 默认使用 5000 端口，如冲突可修改 `tts_server.py`
4. **服务依赖**: 前端需要后端服务运行，建议同时启动

## 🔍 故障排查

### 问题：后端服务启动失败
```bash
# 检查 Python 版本
python --version  # 需要 3.8+

# 手动安装依赖
pip install flask flask-cors edge-tts
```

### 问题：前端无法连接后端
1. 检查后端是否启动: 访问 http://localhost:5000/health
2. 检查防火墙是否拦截
3. 检查浏览器控制台错误信息

### 问题：音频播放失败
1. 确认后端服务正常运行
2. 检查网络连接（首次需要下载模型）
3. 查看后端控制台错误日志

## 💡 性能优化建议

1. **预加载**: 应用启动时预先生成常用句子的音频
2. **缓存**: 保留 `audio_cache` 目录，避免重复生成
3. **批量生成**: 可以写脚本批量生成所有课程音频

## 📝 与原方案对比

| 特性 | 原方案 | Edge TTS 方案 |
|-----|--------|---------------|
| 成本 | 需要预录音频 | 完全免费 |
| 音质 | 取决于录音质量 | 高质量 AI 语音 |
| 灵活性 | 内容固定 | 可动态生成任意文本 |
| 离线 | 支持（需预下载） | 首次需联网 |
| 维护成本 | 高（需要录音） | 低（自动生成） |

## 🎉 完成！

现在你的应用已经接入了免费的 Edge TTS 服务。享受高质量的语音播放吧！

如有问题，请查看后端控制台日志或前端浏览器控制台。
