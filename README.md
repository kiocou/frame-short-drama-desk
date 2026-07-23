# FRAME · 短剧工作台

Tauri 2 + TypeScript 云母桌面工作台，后端保留 Python 解析器与 FFmpeg 下载/合并管线。采用半透明云母、轻微模糊与编辑台式信息层级，不使用浏览器服务端。

## 功能

### 片库搜索

- 红果短剧、红果漫剧、爱奇艺短剧、FlexTV、熊猫短剧、趣看看短剧与全网聚合
- 分类过滤、分页、详情跳转和 CSV 导出
- 选中结果后解析全集并加入下载队列

### 下载与合并

- 支持短剧 ID 与 NovelQuickApp 分享链接
- 2 / 4 / 6 / 8 并发可调，默认 4 线程
- FFmpeg 网络重连、超时保护和旧版本兼容回退
- 下载失败指数退避，失败原因保留在任务列表
- 同规格分集优先直接流复制，通常可接近磁盘速度完成合并
- 不兼容素材自动使用 NVIDIA NVENC 标准化，并回退 CPU `ultrafast`
- 支持暂停、失败重试、复制链接和任务导出

### 系统设置

- device_id / install_id / platform
- 自动合并开关
- 下载保存目录与并发任务数

## 文件位置

默认媒体目录：

```text
%USERPROFILE%\Videos\短剧下载
```

- 下载中的分集暂存在 `.parts`，合并完成后自动清理。
- 合集保存为 `剧名\剧名_全集.mp4`。
- 可在“系统设置”中更改保存位置。

## 运行

```powershell
npm install
npm run tauri dev
```

前端单独预览：`npm run dev`，地址为 `http://localhost:1420`。

旧版 Tk 启动脚本仍保留在 `start.ps1`，用于兼容已有部署。

## 打包 EXE

```powershell
py -3.12 -m PyInstaller --clean --noconfirm "短剧下载神器桌面版.spec"
```

Tauri 安装包：

```powershell
npm run tauri build
```

安装包输出到 `src-tauri/target/release/bundle/nsis/`。

发布目录会包含 FFmpeg、ffprobe、解析模块和界面资源。

## 依赖

- Python 3.12+
- FFmpeg（项目根目录 `ffmpeg.exe`）
- NVIDIA GPU + NVENC 驱动（可选，无 GPU 自动回退 CPU）

## 文件说明

| 文件 | 用途 |
|------|------|
| `ui/` | Tauri 云母前端页面、交互与动画 |
| `src-tauri/` | Tauri 2 窗口、命令与打包配置 |
| `tauri_bridge.py` | Tauri 与 Python 下载 worker 的 JSON 桥接 |
| `desktop_app.py` | 旧版 Tk 控制器与任务调度 |
| `desktop_downloads.py` | 快速合并与兼容转码管线 |
| `desktop_state.py` | 队列领取和任务恢复 |
| `app.py` | 搜索、分享链识别和配置 |
| `1.py` | 视频解析、下载和 CENC 处理 |

## 不要提交

- `build/` `dist/` `.env` `config.json` `desktop_tasks.json`
- 真实 device_id / install_id
