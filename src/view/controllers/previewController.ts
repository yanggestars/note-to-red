import type { App, TFile, ItemView } from 'obsidian';
import { MarkdownRenderer } from 'obsidian';
import { RedConverter } from '../../converter';
import type { ThemeManager } from '../../themeManager';
import type { SettingsManager } from '../../settings/settings';
import type { ImgTemplateManager } from '../../imgTemplateManager';
import { BackgroundManager } from '../../backgroundManager';

interface PreviewControllerOptions {
  app: App;
  component: ItemView;
  settingsManager: SettingsManager;
  themeManager: ThemeManager;
  templateManager: ImgTemplateManager;
  backgroundManager: BackgroundManager;
  onContentStateChange: (enabled: boolean) => void;
}

interface NavigationControls {
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  indicator: HTMLElement;
}

/**
 * Handles preview rendering, navigation, and file lifecycle for the custom view.
 */
export class PreviewController {
  private readonly options: PreviewControllerOptions;
  private previewEl: HTMLElement | null = null;
  private navigation?: NavigationControls;
  private currentFile: TFile | null = null;
  private updateTimer: number | null = null;
  private currentImageIndex = 0;
  private isLocked = false;

  constructor(options: PreviewControllerOptions) {
    this.options = options;
  }

  mount(container: HTMLElement) {
    const wrapper = container.createEl('div', { cls: 'red-preview-wrapper' });
    this.previewEl = wrapper.createEl('div', { cls: 'red-preview-container' });

    const navContainer = wrapper.createEl('div', { cls: 'red-nav-container' });
    const prevButton = navContainer.createEl('button', { cls: 'red-nav-button', text: '←' });
    const indicator = navContainer.createEl('span', { cls: 'red-page-indicator', text: '1/1' });
    const nextButton = navContainer.createEl('button', { cls: 'red-nav-button', text: '→' });

    prevButton.addEventListener('click', () => this.navigate('prev'));
    nextButton.addEventListener('click', () => this.navigate('next'));

    this.navigation = { prev: prevButton, next: nextButton, indicator };
  }

  getElement(): HTMLElement | null {
    return this.previewEl;
  }

  setLocked(value: boolean) {
    this.isLocked = value;
  }

  async toggleLock(): Promise<boolean> {
    this.isLocked = !this.isLocked;
    if (!this.isLocked) {
      await this.refresh();
    }
    return this.isLocked;
  }

  async openFile(file: TFile | null): Promise<boolean> {
    this.currentFile = file;
    this.currentImageIndex = 0;

    if (!this.previewEl) {
      return false;
    }

    if (!file || file.extension !== 'md') {
      this.previewEl.empty();
      this.previewEl.createEl('div', {
        text: '只能预览 markdown 文本文档',
        cls: 'red-empty-state'
      });
      this.options.onContentStateChange(false);
      return false;
    }

    this.isLocked = false;
    this.options.onContentStateChange(true);
    return this.refresh();
  }

  handleFileModify(file: TFile) {
    if (file !== this.currentFile || this.isLocked) {
      return;
    }

    if (this.updateTimer) {
      window.clearTimeout(this.updateTimer);
    }

    this.updateTimer = window.setTimeout(() => {
      this.refresh();
    }, 500);
  }

  async refresh(): Promise<boolean> {
    if (!this.currentFile || !this.previewEl) {
      return false;
    }

    this.previewEl.empty();
    const content = await this.options.app.vault.cachedRead(this.currentFile);
    await MarkdownRenderer.render(
      this.options.app,
      content,
      this.previewEl,
      this.currentFile.path,
      this.options.component
    );

    RedConverter.formatContent(this.previewEl);
    const hasValidContent = RedConverter.hasValidContent(this.previewEl);

    if (hasValidContent) {
      this.options.templateManager.applyTemplate(this.previewEl, this.options.settingsManager.getSettings());
      const settings = this.options.settingsManager.getSettings();
      if (settings.backgroundSettings.imageUrl) {
        const previewContainer = this.previewEl.querySelector('.red-image-preview');
        if (previewContainer) {
          this.options.backgroundManager.applyBackgroundStyles(previewContainer as HTMLElement, settings.backgroundSettings);
        }
      }
    }

    this.options.onContentStateChange(hasValidContent);
    this.updateNavigationState();
    return hasValidContent;
  }

  private navigate(direction: 'prev' | 'next') {
    if (!this.previewEl) return;
    const sections = this.previewEl.querySelectorAll('.red-content-section');
    if (direction === 'prev' && this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else if (direction === 'next' && this.currentImageIndex < sections.length - 1) {
      this.currentImageIndex++;
    }
    this.updateNavigationState();
  }

  private updateNavigationState() {
    if (!this.previewEl || !this.navigation) return;
    const sections = this.previewEl.querySelectorAll('.red-content-section');

    sections.forEach((section, index) => {
      (section as HTMLElement).classList.toggle('red-section-active', index === this.currentImageIndex);
    });

    const totalSections = Math.max(sections.length, 1);
    const currentIndex = sections.length === 0 ? 1 : this.currentImageIndex + 1;
    this.navigation.prev.classList.toggle('red-nav-hidden', this.currentImageIndex === 0);
    this.navigation.next.classList.toggle('red-nav-hidden', this.currentImageIndex === sections.length - 1);
    this.navigation.indicator.textContent = `${currentIndex}/${totalSections}`;
  }
}
