import RedPlugin from '../main';
import { EventEmitter } from 'events';
import type { Theme } from '../types/theme';
import { DEFAULT_SETTINGS, RedSettings, FontOption } from '../types/settings';
import { loadPresetThemes, mergeThemes } from './themeLoader';

/**
 * Lightweight persistence wrapper that keeps I/O isolated from the manager logic.
 */
class SettingsStore {
    constructor(private plugin: RedPlugin) {}

    async load(): Promise<Partial<RedSettings>> {
        const saved = await this.plugin.loadData();
        return saved ?? {};
    }

    async save(settings: RedSettings) {
        await this.plugin.saveData(settings);
    }
}

export class SettingsManager extends EventEmitter {
    private readonly store: SettingsStore;
    private settings: RedSettings = DEFAULT_SETTINGS;

    constructor(plugin: RedPlugin) {
        super();
        this.store = new SettingsStore(plugin);
    }

    /**
     * Loads persisted data, merges it with defaults, and rehydrates preset themes.
     */
    async loadSettings() {
        const savedData = await this.store.load();
        const presetThemes = await loadPresetThemes();
        const mergedThemes = mergeThemes(savedData.themes as Theme[] | undefined, presetThemes);
        const customThemes = (savedData.customThemes ?? []).map(theme => ({ ...theme }));
        const customFonts = (savedData.customFonts ?? DEFAULT_SETTINGS.customFonts).map(font => ({ ...font }));

        this.settings = {
            ...DEFAULT_SETTINGS,
            ...savedData,
            themes: mergedThemes,
            customThemes,
            customFonts,
            backgroundSettings: {
                ...DEFAULT_SETTINGS.backgroundSettings,
                ...(savedData.backgroundSettings ?? {})
            }
        };
    }

    // 主题相关方法
    getAllThemes(): Theme[] {
        return [...this.settings.themes, ...this.settings.customThemes];
    }

    // 新增：获取可见主题
    getVisibleThemes(): Theme[] {
        return this.getAllThemes().filter(theme => theme.isVisible !== false);
    }

    getTheme(themeId: string): Theme | undefined {
        return this.settings.themes.find(theme => theme.id === themeId) 
            || this.settings.customThemes.find(theme => theme.id === themeId);
    }

    async addCustomTheme(theme: Theme) {
        theme.isPreset = false;
        theme.isVisible = true;
        this.settings.customThemes.push(theme);
        await this.persist();
        this.emit('theme-visibility-changed');
    }

    async updateTheme(themeId: string, updatedTheme: Partial<Theme>) {
        const presetThemeIndex = this.settings.themes.findIndex(t => t.id === themeId);
        if (presetThemeIndex !== -1) {
            if ('isVisible' in updatedTheme) {
                this.settings.themes[presetThemeIndex] = {
                    ...this.settings.themes[presetThemeIndex],
                    isVisible: updatedTheme.isVisible
                };
                await this.persist();
                this.emit('theme-visibility-changed');
                return true;
            }
            return false;
        }

        const customThemeIndex = this.settings.customThemes.findIndex(t => t.id === themeId);
        if (customThemeIndex !== -1) {
            this.settings.customThemes[customThemeIndex] = {
                ...this.settings.customThemes[customThemeIndex],
                ...updatedTheme
            };
            await this.persist();
            this.emit('theme-visibility-changed');
            return true;
        }
        
        return false;
    }

    async removeTheme(themeId: string): Promise<boolean> {
        const theme = this.getTheme(themeId);
        if (theme && !theme.isPreset) {
            this.settings.customThemes = this.settings.customThemes.filter(t => t.id !== themeId);
            if (this.settings.themeId === themeId) {
                this.settings.themeId = 'default';
            }
            await this.persist();
            this.emit('theme-visibility-changed');
            return true;
        }
        return false;
    }

    private async persist() {
        await this.store.save(this.settings);
    }

    getSettings(): RedSettings {
        return this.settings;
    }

    async updateSettings(settings: Partial<RedSettings>) {
        this.settings = { ...this.settings, ...settings };
        await this.persist();
    }

    getFontOptions(): FontOption[] {
        return this.settings.customFonts;
    }

    async addCustomFont(font: { value: string; label: string }) {
        this.settings.customFonts.push({ ...font, isPreset: false });
        await this.persist();
    }

    async removeFont(value: string) {
        const font = this.settings.customFonts.find(f => f.value === value);
        if (font && !font.isPreset) {
            this.settings.customFonts = this.settings.customFonts.filter(f => f.value !== value);
            await this.persist();
        }
    }

    async updateFont(oldValue: string, newFont: { value: string; label: string }) {
        const index = this.settings.customFonts.findIndex(f => f.value === oldValue);
        if (index !== -1 && !this.settings.customFonts[index].isPreset) {
            this.settings.customFonts[index] = { ...newFont, isPreset: false };
            await this.persist();
        }
    }
}
