# 🚀 快速开始 - 3步启动

## ⚡ 最快启动方式

```bash
# 双击运行这个文件即可！
start_all.bat
```

这会自动：
1. ✅ 检查环境
2. ✅ 安装依赖
3. ✅ 启动 TTS 服务器
4. ✅ 启动前端服务器
5. ✅ 打开浏览器

---

## 📋 手动启动（可选）

### 方式 1: 只启动前端（使用原有音频）
```bash
node server.js
```
访问: http://localhost:3000

### 方式 2: 启动 TTS + 前端（推荐）

**终端 1 - 启动 TTS 服务:**
```bash
start_tts_server.bat
```

**终端 2 - 启动前端:**
```bash
node server.js
```

---

## 🧪 测试 Edge TTS

1. 启动 TTS 服务器
2. 打开: http://localhost:3000/test_tts.html
3. 输入英文文本，点击"播放"

---

## ❓ 常见问题

### Q: 如何知道 TTS 服务是否启动？
**A:** 
- 方法1: 访问 http://localhost:5000/health
- 方法2: 查看浏览器控制台（F12），看到 "✓ Edge TTS 服务可用" 即成功

### Q: 音频播放失败？
**A:** 
1. 确认 TTS 服务器已启动（看到窗口显示 "Running on http://0.0.0.0:5000"）
2. 检查 5000 端口是否被占用
3. 查看后端控制台的错误信息

### Q: 如何切换语音？
**A:** 
在 `audio_edge.js` 中修改:
```javascript
voice: 'female',  // 改为: male, female-uk, male-uk
```

### Q: 没有 Python？
**A:**
下载安装: https://www.python.org/downloads/
- ⚠️ 安装时勾选 "Add Python to PATH"

### Q: 没有 Node.js？
**A:**
下载安装: https://nodejs.org/

---

## 📊 服务状态检查

```bash
# 检查 TTS 服务
curl http://localhost:5000/health

# 查看可用语音
curl http://localhost:5000/voices

# 清理缓存
curl -X POST http://localhost:5000/cache/clear
```

---

## 🎯 下一步

1. ✅ 启动服务: `start_all.bat`
2. ✅ 测试 TTS: 访问 test_tts.html
3. ✅ 使用应用: 访问 http://localhost:3000
4. ✅ 查看详细文档: 阅读 `TTS_SETUP.md`

---

## 💡 提示

- 首次使用需要联网下载语音模型（几秒钟）
- 相同文本会被缓存，第二次播放秒开
- 如果 TTS 服务未启动，会自动降级到原有方案
- 两个服务可以分别启动，互不影响

---

**🎉 祝你使用愉快！**
