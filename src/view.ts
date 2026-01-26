import { ItemView, WorkspaceLeaf, Notice, TFile } from 'obsidian';
import { ClipboardManager } from './clipboardManager';
import { ImgTemplateManager } from './imgTemplateManager';
import { BackgroundManager } from './backgroundManager';
import type { ThemeManager } from './themeManager';
import type { SettingsManager } from './settings/settings';
import { Toolbar } from './view/components/toolbar';
import { BottomBar } from './view/components/bottomBar';
import { PreviewController } from './view/controllers/previewController';

export const VIEW_TYPE_RED = 'rednote-format';

export class RedView extends ItemView {
  private previewController!: PreviewController;
  private toolbar!: Toolbar;
  private bottomBar!: BottomBar;
  private backgroundManager: BackgroundManager;
  private imgTemplateManager: ImgTemplateManager;
  private isPreviewLocked = false;

  constructor(
    leaf: WorkspaceLeaf,
    private themeManager: ThemeManager,
    private settingsManager: SettingsManager
  ) {
    super(leaf);
    this.backgroundManager = new BackgroundManager();
    this.imgTemplateManager = new ImgTemplateManager(
      this.settingsManager,
      async () => {
        if (this.previewController) {
          await this.previewController.refresh();
        }
      },
      this.themeManager
    );
    const templateId = this.settingsManager.getSettings().templateId || 'default';
    this.imgTemplateManager.setCurrentTemplate(templateId);
  }

  getViewType() {
    return VIEW_TYPE_RED;
  }

  getDisplayText() {
    return '小红书预览';
  }

  getIcon() {
    return 'image';
  }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.className = 'red-view-content';

    await this.buildLayout(container);
    this.initializeEventListeners();

    const currentFile = this.app.workspace.getActiveFile();
    await this.handleFileOpen(currentFile);
  }

  private async buildLayout(container: HTMLElement) {
    this.previewController = new PreviewController({
      app: this.app,
      component: this,
      settingsManager: this.settingsManager,
      themeManager: this.themeManager,
      templateManager: this.imgTemplateManager,
      backgroundManager: this.backgroundManager,
      onContentStateChange: (enabled) => this.handleContentStateChange(enabled)
    });

    this.toolbar = new Toolbar({
      container,
      settingsManager: this.settingsManager,
      themeManager: this.themeManager,
      templateManager: this.imgTemplateManager,
      refreshPreview: async () => {
        if (this.previewController) {
          await this.previewController.refresh();
        }
      },
      getPreviewElement: () => this.previewController?.getElement() ?? null,
      onToggleLock: () => this.handleToggleLock()
    });
    await this.toolbar.render();

    this.previewController.mount(container);

    this.bottomBar = new BottomBar({
      app: this.app,
      container,
      settingsManager: this.settingsManager,
      backgroundManager: this.backgroundManager,
      getPreviewElement: () => this.previewController?.getElement() ?? null
    });
    this.bottomBar.render();

    await this.toolbar.restore(this.settingsManager.getSettings());
    this.toolbar.setLockState(false);
    this.toolbar.setEnabled(false);
    this.bottomBar.setEnabled(false);
  }

  private initializeEventListeners() {
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        if (file instanceof TFile || file === null) {
          void this.handleFileOpen(file);
        } else {
          void this.handleFileOpen(null);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          this.previewController?.handleFileModify(file);
        }
      })
    );
    this.initializeCopyButtonListener();
  }

  private async handleFileOpen(file: TFile | null) {
    await this.previewController.openFile(file);
    this.isPreviewLocked = false;
    this.toolbar.setLockState(false);
  }

  private handleContentStateChange(enabled: boolean) {
    this.toolbar.setEnabled(enabled);
    this.bottomBar.setEnabled(enabled);
    this.bottomBar.setCopyButtonHint(enabled ? undefined : '请先添加一级标题内容');
  }

  private async handleToggleLock() {
    const locked = await this.previewController.toggleLock();
    this.isPreviewLocked = locked;
    this.toolbar.setLockState(locked);
  }

  private initializeCopyButtonListener() {
    const copyButtonHandler = async (e: CustomEvent) => {
      const { copyButton } = e.detail;
      if (copyButton) {
        copyButton.addEventListener('click', async () => {
          copyButton.disabled = true;
          try {
            const preview = this.previewController?.getElement();
            if (preview) {
              await ClipboardManager.copyImageToClipboard(preview);
              new Notice('图片已复制到剪贴板');
            }
          } catch (error) {
            new Notice('复制失败');
            console.error('复制图片失败:', error);
          } finally {
            setTimeout(() => {
              copyButton.disabled = false;
            }, 1000);
          }
        });
      }
    };

    this.containerEl.addEventListener('copy-button-added', copyButtonHandler as EventListener);
    this.register(() => {
      this.containerEl.removeEventListener('copy-button-added', copyButtonHandler as EventListener);
    });
  }
}
