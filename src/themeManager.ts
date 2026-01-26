import { App } from 'obsidian';
import { SettingsManager } from './settings/settings';
import type { Theme, ThemeStyles } from './types/theme';

export class ThemeManager {
    private currentTheme: Theme;
    private currentFont: string = '-apple-system';
    private currentFontSize: number = 16;
    private app: App;
    private settingsManager: SettingsManager;

    constructor(app: App, settingsManager: SettingsManager) {
        this.app = app;
        this.settingsManager = settingsManager;
    }

    public setCurrentTheme(id: string): boolean {
        const theme = this.settingsManager.getTheme(id);
        if (theme) {
            this.currentTheme = theme;
            return true;
        }
        console.error('主题未找到:', id);
        return false;
    }

    public applyTheme(element: HTMLElement, theme?: Theme): void {
        const styles = theme ? theme.styles : this.currentTheme.styles;
        this.applyPreviewContainerStyles(element, styles);
        this.applyHeaderStyles(element, styles);
        this.applyFooterStyles(element, styles);
        this.prepareHeadingStructure(element);
        this.applyHeadingStyles(element, styles);
        this.applyParagraphStyles(element, styles);
        this.applyListStyles(element, styles);
        this.applyQuoteStyles(element, styles);
        this.applyCodeStyles(element, styles);
        this.applyLinkAndEmphasisStyles(element, styles);
        this.applyTableStyles(element, styles);
        this.applyDividerAndFootnoteStyles(element, styles);
        this.applyImageStyles(element, styles);
    }

    // 移除不再需要的方法
    public setFont(fontFamily: string) {
        this.currentFont = fontFamily;
    }

    public setFontSize(size: number) {
        this.currentFontSize = size;
    }

    private applyPreviewContainerStyles(element: HTMLElement, styles: ThemeStyles) {
        const imagePreview = element.querySelector('.red-image-preview') as HTMLElement;
        if (!imagePreview) return;
        const styleProperties = styles.imagePreview.split(';');
        styleProperties.forEach(property => {
            const [key, value] = property.split(':').map(item => item.trim());
            if (key && value) {
                imagePreview.style[key as any] = value;
            }
        });
    }

    private applyHeaderStyles(element: HTMLElement, styles: ThemeStyles) {
        const header = element.querySelector('.red-preview-header');
        if (!header) return;

        header.querySelectorAll('.red-user-avatar').forEach(el => el.setAttribute('style', styles.header.avatar.container));
        header.querySelectorAll('.red-avatar-placeholder').forEach(el => el.setAttribute('style', styles.header.avatar.placeholder));
        header.querySelectorAll('.red-user-avatar img').forEach(el => el.setAttribute('style', styles.header.avatar.image));
        header.querySelectorAll('.red-user-name-container').forEach(el => el.setAttribute('style', styles.header.nameContainer));
        header.querySelectorAll('.red-user-name').forEach(el => el.setAttribute('style', styles.header.userName));
        header.querySelectorAll('.red-user-id').forEach(el => el.setAttribute('style', styles.header.userId));
        header.querySelectorAll('.red-post-time').forEach(el => el.setAttribute('style', styles.header.postTime));
        header.querySelectorAll('.red-verified-icon').forEach(el => el.setAttribute('style', styles.header.verifiedIcon));
    }

    private applyFooterStyles(element: HTMLElement, styles: ThemeStyles) {
        const footer = element.querySelector('.red-preview-footer');
        if (!footer) return;
        footer.setAttribute('style', styles.footer.container);
        footer.querySelectorAll('.red-footer-text').forEach(el => el.setAttribute('style', styles.footer.text));
        footer.querySelectorAll('.red-footer-separator').forEach(el => el.setAttribute('style', styles.footer.separator));
    }

    private prepareHeadingStructure(element: HTMLElement) {
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            element.querySelectorAll(tag).forEach(el => {
                if (!el.querySelector('.content')) {
                    const content = document.createElement('span');
                    content.className = 'content';
                    while (el.firstChild) {
                        content.appendChild(el.firstChild);
                    }
                    el.appendChild(content);

                    const after = document.createElement('span');
                    after.className = 'after';
                    el.appendChild(after);
                }
            });
        });
    }

    private applyHeadingStyles(element: HTMLElement, styles: ThemeStyles) {
        const tags: Array<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        tags.forEach(tag => {
            element.querySelectorAll(tag).forEach(el => {
                let styleKey: keyof typeof styles.title = 'base';
                if (tag === 'h1' && styles.title.h1) styleKey = 'h1';
                else if (tag === 'h2' && styles.title.h2) styleKey = 'h2';
                else if (tag === 'h3' && styles.title.h3) styleKey = 'h3';

                const titleStyle = styles.title[styleKey] || styles.title.base;
                el.setAttribute('style', `${titleStyle.base}; font-family: ${this.currentFont};`);
                el.querySelector('.content')?.setAttribute('style', titleStyle.content);
                el.querySelector('.after')?.setAttribute('style', titleStyle.after);
            });
        });
    }

    private applyParagraphStyles(element: HTMLElement, styles: ThemeStyles) {
        element.querySelectorAll('p').forEach(el => {
            if (!el.parentElement?.closest('p') && !el.parentElement?.closest('blockquote')) {
                el.setAttribute('style', `${styles.paragraph}; font-family: ${this.currentFont}; font-size: ${this.currentFontSize}px;`);
            }
        });
    }

    private applyListStyles(element: HTMLElement, styles: ThemeStyles) {
        element.querySelectorAll('ul, ol').forEach(el => el.setAttribute('style', styles.list.container));
        element.querySelectorAll('li').forEach(el => {
            el.setAttribute('style', `${styles.list.item}; font-family: ${this.currentFont}; font-size: ${this.currentFontSize}px;`);
        });
        element.querySelectorAll('.task-list-item').forEach(el => {
            el.setAttribute('style', `${styles.list.taskList}; font-family: ${this.currentFont}; font-size: ${this.currentFontSize}px;`);
        });
    }

    private applyQuoteStyles(element: HTMLElement, styles: ThemeStyles) {
        element.querySelectorAll('blockquote').forEach(el => {
            el.setAttribute('style', `${styles.quote}; font-family: ${this.currentFont}; font-size: ${this.currentFontSize}px;`);
        });
    }

    private applyCodeStyles(element: HTMLElement, styles: ThemeStyles) {
        element.querySelectorAll('pre').forEach(el => {
            el.setAttribute('style', `${styles.code.block}; font-size: ${this.currentFontSize}px;`);
        });
        element.querySelectorAll('code:not(pre code)').forEach(el => {
            el.setAttribute('style', `${styles.code.inline}; font-size: ${this.currentFontSize}px;`);
        });
    }

    private applyLinkAndEmphasisStyles(element: HTMLElement, styles: ThemeStyles) {
        element.querySelectorAll('a').forEach(el => el.setAttribute('style', styles.link));
        element.querySelectorAll('strong').forEach(el => el.setAttribute('style', styles.emphasis.strong));
        element.querySelectorAll('em').forEach(el => el.setAttribute('style', styles.emphasis.em));
        element.querySelectorAll('del').forEach(el => el.setAttribute('style', styles.emphasis.del));
    }

    private applyTableStyles(element: HTMLElement, styles: ThemeStyles) {
        element.querySelectorAll('table').forEach(el => el.setAttribute('style', styles.table.container));
        element.querySelectorAll('th').forEach(el => {
            el.setAttribute('style', `${styles.table.header}; font-family: ${this.currentFont}; font-size: ${this.currentFontSize}px;`);
        });
        element.querySelectorAll('td').forEach(el => {
            el.setAttribute('style', `${styles.table.cell}; font-family: ${this.currentFont}; font-size: ${this.currentFontSize}px;`);
        });
    }

    private applyDividerAndFootnoteStyles(element: HTMLElement, styles: ThemeStyles) {
        element.querySelectorAll('hr').forEach(el => el.setAttribute('style', styles.hr));
        element.querySelectorAll('.footnote-ref').forEach(el => el.setAttribute('style', styles.footnote.ref));
        element.querySelectorAll('.footnote-backref').forEach(el => el.setAttribute('style', styles.footnote.backref));
    }

    private applyImageStyles(element: HTMLElement, styles: ThemeStyles) {
        element.querySelectorAll('img').forEach(el => {
            el.setAttribute('style', styles.image);
            const parent = el.parentElement;
            if (parent && parent.tagName.toLowerCase() === 'p' && parent.childNodes.length === 1) {
                parent.classList.add('red-image-container');
            }
        });
    }
}

export const themeManager = (app: App, settingsManager: SettingsManager) => new ThemeManager(app, settingsManager);
