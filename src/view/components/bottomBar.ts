import type { App } from 'obsidian';
import { setIcon, Notice } from 'obsidian';
import { BackgroundSettingModal } from '../../modals/BackgroundSettingModal';
import { BackgroundManager } from '../../backgroundManager';
import { DownloadManager } from '../../downloadManager';
import type { SettingsManager } from '../../settings/settings';

export interface BottomBarOptions {
  app: App;
  container: HTMLElement;
  settingsManager: SettingsManager;
  backgroundManager: BackgroundManager;
  getPreviewElement: () => HTMLElement | null;
}

export class BottomBar {
  private copyButton: HTMLButtonElement;
  private currentExportButton: HTMLButtonElement;

  constructor(private options: BottomBarOptions) {}

  render() {
    const bottomBar = this.options.container.createEl('div', { cls: 'red-bottom-bar' });
    const controlsGroup = bottomBar.createEl('div', { cls: 'red-controls-group' });

    this.createHelpButton(controlsGroup);
    this.createBackgroundButton(controlsGroup);
    this.createExportButtons(controlsGroup);
  }

  setEnabled(enabled: boolean) {
    if (this.copyButton) {
      this.copyButton.disabled = !enabled;
    }
    if (this.currentExportButton) {
      this.currentExportButton.disabled = !enabled;
    }
  }

  setCopyButtonHint(message?: string) {
    if (!this.copyButton) return;
    if (message) {
      this.copyButton.setAttribute('title', message);
    } else {
      this.copyButton.removeAttribute('title');
    }
  }

  private createHelpButton(parent: HTMLElement) {
    const helpButton = parent.createEl('button', {
      cls: 'red-help-button',
      attr: { 'aria-label': '使用指南' }
    });
    setIcon(helpButton, 'help');
    const headingLevel = this.options.settingsManager.getSettings().headingLevel || 'h1';
    const headingLabel = headingLevel === 'h1'
      ? '一级标题(#)'
      : headingLevel === 'h2'
        ? '二级标题(##)'
        : '一级标题(#)或二级标题(##)';
    parent.createEl('div', {
      cls: 'red-help-tooltip',
      text: `使用指南：
                1. 核心用法：用${headingLabel}来分割内容，每个标题生成一张小红书配图
                2. 内容分页：在${headingLabel}下使用 --- 可将内容分割为多页，每页都会带上标题
                3. 首图制作：单独调整首节字号至20-24px，使用【下载当前页】导出
                4. 长文优化：内容较多的章节可调小字号至14-16px后单独导出
                5. 批量操作：保持统一字号时，用【导出全部页】批量生成
                6. 模板切换：顶部选择器可切换不同视觉风格
                7. 实时编辑：解锁状态(🔓)下编辑文档即时预览效果`
    });
  }

  private createBackgroundButton(parent: HTMLElement) {
    const bgButton = parent.createEl('button', {
      cls: 'red-background-button',
      attr: { 'aria-label': '设置背景图片' }
    });
    setIcon(bgButton, 'image');

    bgButton.addEventListener('click', () => {
      const previewRoot = this.options.getPreviewElement();
      if (!previewRoot) {
        new Notice('预览尚未准备就绪');
        return;
      }
      const currentSettings = this.options.settingsManager.getSettings().backgroundSettings;
      new BackgroundSettingModal(
        this.options.app,
        async (backgroundSettings) => {
          await this.options.settingsManager.updateSettings({ backgroundSettings });
          const imagePreview = previewRoot.querySelector('.red-image-preview') as HTMLElement;
          if (imagePreview) {
            this.options.backgroundManager.applyBackgroundStyles(imagePreview, backgroundSettings);
          }
        },
        previewRoot,
        this.options.backgroundManager,
        currentSettings
      ).open();
    });
  }

  private createExportButtons(parent: HTMLElement) {
    const singleDownloadButton = parent.createEl('button', {
      text: '下载当前页',
      cls: 'red-export-button'
    });

    singleDownloadButton.addEventListener('click', async () => {
      const preview = this.options.getPreviewElement();
      if (!preview) return;
      singleDownloadButton.disabled = true;
      singleDownloadButton.setText('导出中...');

      try {
        await DownloadManager.downloadSingleImage(preview);
        singleDownloadButton.setText('导出成功');
      } catch (error) {
        console.error('单页导出失败', error);
        singleDownloadButton.setText('导出失败');
      } finally {
        setTimeout(() => {
          singleDownloadButton.disabled = false;
          singleDownloadButton.setText('下载当前页');
        }, 2000);
      }
    });

    this.copyButton = parent.createEl('button', {
      text: '导出全部页',
      cls: 'red-export-button'
    });

    this.copyButton.addEventListener('click', async () => {
      const preview = this.options.getPreviewElement();
      if (!preview) return;
      this.copyButton.disabled = true;
      this.copyButton.setText('导出中...');

      try {
        await DownloadManager.downloadAllImages(preview);
        this.copyButton.setText('导出成功');
      } catch (error) {
        console.error('批量导出失败', error);
        this.copyButton.setText('导出失败');
      } finally {
        setTimeout(() => {
          this.copyButton.disabled = false;
          this.copyButton.setText('导出全部页');
        }, 2000);
      }
    });

    this.currentExportButton = singleDownloadButton;
  }
}
