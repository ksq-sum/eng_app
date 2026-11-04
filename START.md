# 快速启动指南

## 方法1：自动启动（推荐）

### 步骤1：首次设置
```bash
双击运行: setup.bat
```
这会自动安装所有 Python 依赖。

### 步骤2：启动服务
```bash
双击运行: start_all.bat
```
这会启动 TTS 服务器和前端服务器，并自动打开浏览器。

---

## 方法2：手动启动

### 终端1 - 启动 TTS 服务器
```bash
双击运行: start_tts_server.bat
```

### 终端2 - 启动前端服务器
```bash
node server.js
```

### 访问应用
```
http://localhost:3000
```

---

## 方法3：仅启动前端（使用原有音频）

如果不想使用 Edge TTS，直接运行：
```bash
node server.js
```

应用会自动降级到原有的音频方案。

---

## 测试 Edge TTS

启动 TTS 服务器后，访问：
```
http://localhost:3000/test_tts.html
```

---

## 故障排查

### 问题1：Python 未找到
下载安装: https://www.python.org/downloads/
- ⚠️ 安装时勾选 "Add Python to PATH"

### 问题2：端口被占用
修改 tts_server.py 最后一行：
```python
app.run(host='0.0.0.0', port=5001, debug=False)  # 改为其他端口
```

### 问题3：依赖安装失败
手动安装：
```bash
pip install flask flask-cors edge-tts
```

---

## 检查服务状态

### 检查 TTS 服务
在浏览器打开: http://localhost:5000/health

### 检查前端
在浏览器打开: http://localhost:3000

---

## 文件说明

- `setup.bat` - 首次设置脚本（安装依赖）
- `start_all.bat` - 一键启动所有服务
- `start_tts_server.bat` - 单独启动 TTS 服务
- `test_tts.html` - TTS 测试页面

---

**开始使用: 双击 setup.bat → 双击 start_all.bat**
