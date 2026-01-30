# Note to RED (小红书笔记转换器)

![downloads](https://img.shields.io/badge/dynamic/json?color=brightgreen&label=downloads&query=%24%5B%22note-to-red%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&style=flat) ![version](https://img.shields.io/github/v/tag/Yeban8090/note-to-red?color=blue&label=version&style=flat) ![license](https://img.shields.io/badge/license-MIT-green) 

> **一键将 Obsidian 笔记转换为精美的小红书风格图片**
> 
> 让你的笔记内容轻松分享到社交平台，无需繁琐的排版和截图。

## ✨ 核心功能演示

<p align="center">
  <img src="src/assets/introduce/p1.png" alt="功能演示1" width="100%" style="margin:8px;">
  <img src="src/assets/introduce/p2.png" alt="功能演示2" width="100%" style="margin:8px;">
  <img src="src/assets/introduce/p3.png" alt="功能演示3" width="100%" style="margin:8px;">
</p>

## 🚀 功能特点

### 📝 智能分页
- **自动分割**：根据设置的一级标题（#）或二级标题（##）自动将长笔记分割成多张卡片。
- **灵活控制**：支持针对不同长度的内容调整字号，确保每张图片的排版完美。

### 🎨 深度定制
- **多款精美模板**：内置 Cyber、Elegant、Forest、Minimal 等多种风格模板，一键切换。
- **自定义主题**：
    - 全面控制文字颜色、背景、边距、圆角等细节。
    - 自定义字体（支持系统字体及导入字体）。
    - 调整段落间距、行高，优化阅读体验。
- **个性化品牌**：
    - 支持上传自定义头像。
    - 设置昵称、ID 和认证标识（如蓝V、黄V）。
    - 自定义页脚文案，增加品牌辨识度。

### ⚡️ 高效工作流
- **实时预览**：在 Obsidian 侧边栏实时查看生成效果，所见即所得。
- **批量导出**：一键导出所有切片，或选择性导出单页。
- **锁定模式**：在编辑时锁定预览界面，避免频繁刷新打断思路。

## 📖 使用指南

### 基础流程
1.  **开启预览**：点击侧边栏的 "image" 图标或使用命令面板搜索 "打开小红书图片预览"。
2.  **选择分割方式**：在插件设置中选择按一级标题或二级标题分割。
3.  **调整样式**：在预览界面顶部工具栏选择喜欢的主题模板。
4.  **导出图片**：点击预览图下方的下载按钮，保存为 PNG 图片。

### 进阶技巧
*   **首图制作**：建议将第一张卡片的字号调整为 **20-24px**，作为封面图，更具视觉冲击力。
*   **正文排版**：正文内容较多时，字号建议设置为 **14-16px**，保持清晰易读。
*   **长文优化**：如果某个章节内容过长，可以手动添加标题进行强制分割，或适当调小字号。
*   **主题微调**：不仅可以使用预设主题，还可以在设置中创建自己的 "Custom Theme"，保存你最满意的配色方案。

## 📦 安装方法

### 方式一：Obsidian 社区插件（推荐）
1.  打开 Obsidian **设置** > **第三方插件**。
2.  关闭 **安全模式**。
3.  点击 **浏览**，搜索 `Note to RED`。
4.  点击 **安装** 并 **启用**。

### 方式二：手动安装
1.  访问 [GitHub Releases](https://github.com/Yeban8090/note-to-red/releases) 页面下载最新版本。
2.  解压文件，将包含 `main.js`, `manifest.json`, `styles.css` 的文件夹放入你的库目录：`{vault}/.obsidian/plugins/note-to-red/`。
3.  重启 Obsidian 并在设置中启用插件。

## ⚙️ 详细配置说明

在 Obsidian 设置面板中找到 **Note to RED**，你可以配置：

*   **基础设置**：
    *   **分割标题级别**：H1 或 H2。
    *   **默认字体**：选择全局默认字体。
    *   **默认字号**：设置基础文字大小。
*   **用户信息**：
    *   **头像**：上传本地图片或使用网络链接。
    *   **昵称 / ID**：显示在卡片顶部的用户信息。
    *   **认证标识**：可选显示 verified icon。
*   **主题管理**：
    *   查看、编辑、删除自定义主题。
    *   切换预设主题的可见性。




---

# 💻 开发者文档 (Developer Documentation)

如果你想为这个项目贡献代码，或者想了解其内部原理，请参考以下文档。

## 项目概览 (Project Overview)

**Note to RED** 是一个基于 TypeScript 开发的 Obsidian 插件。它利用 Obsidian API 获取笔记内容，并通过 Web 技术将其渲染为特定样式的 DOM 元素，最后转换为图片。

### 技术栈 (Tech Stack)
*   **核心语言**: TypeScript
*   **框架**: Obsidian Plugin API
*   **构建工具**: esbuild
*   **图片生成**:
    *   `dom-to-image` / `html-to-image`: 用于将 DOM 节点转换为 Canvas/Image。
    *   `html2canvas`: 辅助渲染。
*   **工具库**: `jszip` (用于批量导出打包)。

## 架构与核心文件 (Architecture)

项目遵循标准的 Obsidian 插件架构：

*   **`src/main.ts`**: 插件入口。负责初始化 `SettingsManager`、`ThemeManager`，注册视图 (`RedView`) 和命令。
*   **`src/view.ts`**: 核心视图逻辑。处理预览界面的渲染、事件监听和用户交互。
*   **`src/settings/`**: 设置模块。
    *   `settings.ts`: 处理配置的持久化存储和读取。
    *   `SettingTab.ts`: 渲染 Obsidian 设置面板的 UI。
*   **`src/themeManager.ts`**: 主题管理器。负责加载、解析和应用 CSS 样式到预览组件。它将 JSON 格式的主题配置转换为具体的 DOM 样式。
*   **`src/converter.ts`**: 内容转换器。负责解析 Markdown 文本，根据标题分割内容，并生成 HTML 结构。
*   **`src/templates/`**: 内置主题模板文件。

## 构建与运行 (Building and Running)

### 环境要求
*   Node.js (推荐 v16+)
*   npm 或 yarn

### 常用命令

1.  **安装依赖**:
    ```bash
    npm install
    ```

2.  **开发模式 (Watch Mode)**:
    ```bash
    npm run dev
    ```
    此命令会启动 `esbuild` 并在文件修改时自动重新编译。编译产物通常为 `main.js`。

3.  **生产构建**:
    ```bash
    npm run build
    ```
    生成压缩后的 `main.js`，准备发布。

### 调试方法
1.  执行 `npm run dev`。
2.  将编译生成的 `main.js`, `manifest.json`, `styles.css` 复制到你的测试库插件目录：
    `path/to/your/vault/.obsidian/plugins/note-to-red/`
3.  在 Obsidian 中按下 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Option+I` (Mac) 打开开发者工具，查看 Console 输出。

## 开发规范 (Conventions)

*   **代码风格**: 遵循 TypeScript 标准规范。
*   **异步处理**: 文件 I/O 和图片生成等耗时操作必须使用 `async/await`。
*   **样式隔离**: 插件 UI 样式应尽量使用特定的 CSS 类名前缀 (如 `.red-preview-container`)，避免污染 Obsidian 全局样式。
*   **类型安全**: 尽量定义清晰的 Interface (如 `src/types/theme.ts`)，减少 `any` 的使用。

## 许可证 (License)
MIT License
