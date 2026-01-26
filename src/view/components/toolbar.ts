import { setIcon } from 'obsidian';
import type { SettingsManager } from '../../settings/settings';
import type { ThemeManager } from '../../themeManager';
import type { ImgTemplateManager } from '../../imgTemplateManager';
import type { RedSettings } from '../../types/settings';

interface SelectOption {
  value: string;
  label: string;
}

export interface ToolbarOptions {
  container: HTMLElement;
  settingsManager: SettingsManager;
  themeManager: ThemeManager;
  templateManager: ImgTemplateManager;
  refreshPreview: () => Promise<void>;
  getPreviewElement: () => HTMLElement | null;
  onToggleLock: () => void;
}

/**
 * Encapsulates the logic for building and controlling the toolbar controls.
 */
export class Toolbar {
  private lockButton: HTMLButtonElement;
  private fontSizeInput: HTMLInputElement;
  private templateSelect: HTMLElement;
  private themeSelect: HTMLElement;
  private fontSelect: HTMLElement;
  private readonly options: ToolbarOptions;

  constructor(options: ToolbarOptions) {
    this.options = options;
  }

  async render() {
    const toolbar = this.options.container.createEl('div', { cls: 'red-toolbar' });
    const controlsGroup = toolbar.createEl('div', { cls: 'red-controls-group' });

    this.createLockButton(controlsGroup);
    await this.createTemplateSelect(controlsGroup);
    await this.createThemeSelect(controlsGroup);
    await this.createFontSelect(controlsGroup);
    this.createFontSizeControls(controlsGroup);
  }

  async restore(settings: RedSettings) {
    const previewEl = this.options.getPreviewElement();
    const applyThemeIfReady = () => {
      if (previewEl) {
        this.options.themeManager.applyTheme(previewEl);
      }
    };

    if (settings.themeId) {
      this.options.themeManager.setCurrentTheme(settings.themeId);
      await this.restoreSelect(this.themeSelect, () => this.getThemeOptions(), settings.themeId);
      applyThemeIfReady();
    }

    if (settings.fontFamily) {
      this.options.themeManager.setFont(settings.fontFamily);
      await this.restoreSelect(this.fontSelect, () => Promise.resolve(this.getFontOptions()), settings.fontFamily);
      applyThemeIfReady();
    }

    if (settings.fontSize) {
      this.setFontSize(settings.fontSize);
      applyThemeIfReady();
    }

    if (settings.templateId) {
      this.options.templateManager.setCurrentTemplate(settings.templateId);
      await this.restoreSelect(this.templateSelect, () => this.getTemplateOptions(), settings.templateId);
    }
  }

  setLockState(isLocked: boolean) {
    if (!this.lockButton) return;
    setIcon(this.lockButton, isLocked ? 'lock' : 'unlock');
    const label = isLocked ? '开启实时预览状态' : '关闭实时预览状态';
    this.lockButton.setAttribute('aria-label', label);
  }

  setEnabled(enabled: boolean) {
    if (this.lockButton) {
      this.lockButton.disabled = !enabled;
    }
    [this.templateSelect, this.themeSelect, this.fontSelect].forEach(select => {
      const selectEl = select?.querySelector('.red-select') as HTMLElement | null;
      if (selectEl) {
        selectEl.setAttribute('style', `pointer-events: ${enabled ? 'auto' : 'none'}`);
      }
    });

    if (this.fontSizeInput) {
      this.fontSizeInput.disabled = !enabled;
    }

    this.options.container.querySelectorAll('.red-font-size-btn').forEach(button => {
      (button as HTMLButtonElement).disabled = !enabled;
    });
  }

  private createLockButton(parent: HTMLElement) {
    this.lockButton = parent.createEl('button', {
      cls: 'red-lock-button',
      attr: { 'aria-label': '关闭实时预览状态' }
    });
    setIcon(this.lockButton, 'lock');
    this.lockButton.addEventListener('click', () => this.options.onToggleLock());
  }

  private async createTemplateSelect(parent: HTMLElement) {
    this.templateSelect = this.createCustomSelect(parent, 'red-template-select', await this.getTemplateOptions());
    this.templateSelect.id = 'template-select';
    this.templateSelect.querySelector('.red-select')?.addEventListener('change', async (e: any) => {
      const value = e.detail.value;
      this.options.templateManager.setCurrentTemplate(value);
      await this.options.settingsManager.updateSettings({ templateId: value });
      const previewEl = this.options.getPreviewElement();
      if (previewEl) {
        this.options.templateManager.applyTemplate(previewEl, this.options.settingsManager.getSettings());
      }
      await this.options.refreshPreview();
    });
  }

  private async createThemeSelect(parent: HTMLElement) {
    this.themeSelect = this.createCustomSelect(parent, 'red-theme-select', await this.getThemeOptions());
    this.themeSelect.id = 'theme-select';
    this.themeSelect.querySelector('.red-select')?.addEventListener('change', async (e: any) => {
      const value = e.detail.value;
      this.options.themeManager.setCurrentTheme(value);
      await this.options.settingsManager.updateSettings({ themeId: value });
      const previewEl = this.options.getPreviewElement();
      if (previewEl) {
        this.options.themeManager.applyTheme(previewEl);
      }
    });
  }

  private async createFontSelect(parent: HTMLElement) {
    this.fontSelect = this.createCustomSelect(parent, 'red-font-select', this.getFontOptions());
    this.fontSelect.id = 'font-select';
    this.fontSelect.querySelector('.red-select')?.addEventListener('change', async (e: any) => {
      const value = e.detail.value;
      this.options.themeManager.setFont(value);
      await this.options.settingsManager.updateSettings({ fontFamily: value });
      const previewEl = this.options.getPreviewElement();
      if (previewEl) {
        this.options.themeManager.applyTheme(previewEl);
      }
    });
  }

  private createFontSizeControls(parent: HTMLElement) {
    const fontSizeGroup = parent.createEl('div', { cls: 'red-font-size-group' });

    const decreaseButton = fontSizeGroup.createEl('button', {
      cls: 'red-font-size-btn',
      text: '-'
    });

    this.fontSizeInput = fontSizeGroup.createEl('input', {
      cls: 'red-font-size-input',
      type: 'text',
      value: '16',
      attr: {
        style: 'border: none; outline: none; background: transparent;'
      }
    });

    const increaseButton = fontSizeGroup.createEl('button', {
      cls: 'red-font-size-btn',
      text: '+'
    });

    const updateFontSize = async () => {
      const size = parseInt(this.fontSizeInput.value, 10);
      this.options.themeManager.setFontSize(size);
      await this.options.settingsManager.updateSettings({ fontSize: size });
      const previewEl = this.options.getPreviewElement();
      if (previewEl) {
        this.options.themeManager.applyTheme(previewEl);
      }
    };

    decreaseButton.addEventListener('click', () => {
      const currentSize = parseInt(this.fontSizeInput.value, 10);
      if (currentSize > 12) {
        this.fontSizeInput.value = (currentSize - 1).toString();
        updateFontSize();
      }
    });

    increaseButton.addEventListener('click', () => {
      const currentSize = parseInt(this.fontSizeInput.value, 10);
      if (currentSize < 30) {
        this.fontSizeInput.value = (currentSize + 1).toString();
        updateFontSize();
      }
    });

    this.fontSizeInput.addEventListener('change', updateFontSize);
  }

  private async restoreSelect(selectContainer: HTMLElement, getOptions: () => Promise<SelectOption[]>, value: string) {
    if (!selectContainer) return;
    const selectEl = selectContainer.querySelector('.red-select') as HTMLElement | null;
    const textEl = selectContainer.querySelector('.red-select-text');
    const dropdown = selectContainer.querySelector('.red-select-dropdown');
    if (!selectEl || !textEl || !dropdown) return;

    const options = await getOptions();
    const match = options.find(option => option.value === value);
    if (match) {
      textEl.textContent = match.label;
      selectEl.dataset.value = match.value;
      dropdown.querySelectorAll('.red-select-item').forEach(el => {
        el.classList.toggle('red-selected', el.getAttribute('data-value') === match.value);
      });
    }
  }

  private createCustomSelect(parent: HTMLElement, className: string, options: SelectOption[]) {
    const container = parent.createEl('div', { cls: `red-select-container ${className}` });
    const select = container.createEl('div', { cls: 'red-select' });
    const selectedText = select.createEl('span', { cls: 'red-select-text' });
    select.createEl('span', { cls: 'red-select-arrow', text: '▾' });

    const dropdown = container.createEl('div', { cls: 'red-select-dropdown' });

    options.forEach(option => {
      const item = dropdown.createEl('div', {
        cls: 'red-select-item',
        text: option.label
      });

      item.dataset.value = option.value;
      item.addEventListener('click', () => {
        dropdown.querySelectorAll('.red-select-item').forEach(el => el.classList.remove('red-selected'));
        item.classList.add('red-selected');
        selectedText.textContent = option.label;
        select.dataset.value = option.value;
        dropdown.classList.remove('red-show');
        select.dispatchEvent(new CustomEvent('change', {
          detail: { value: option.value }
        }));
      });
    });

    if (options.length > 0) {
      selectedText.textContent = options[0].label;
      select.dataset.value = options[0].value;
      dropdown.querySelector('.red-select-item')?.classList.add('red-selected');
    }

    select.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('red-show');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('red-show');
    });

    return container;
  }

  private async getThemeOptions(): Promise<SelectOption[]> {
    const templates = this.options.settingsManager.getVisibleThemes();
    return templates.length > 0
      ? templates.map(t => ({ value: t.id, label: t.name }))
      : [{ value: 'default', label: '默认主题' }];
  }

  private async getTemplateOptions(): Promise<SelectOption[]> {
    return this.options.templateManager.getImgTemplateOptions();
  }

  private getFontOptions(): SelectOption[] {
    return this.options.settingsManager.getFontOptions();
  }

  private setFontSize(size: number) {
    if (!this.fontSizeInput) return;
    this.fontSizeInput.value = size.toString();
    this.options.themeManager.setFontSize(size);
  }
}
