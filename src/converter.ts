import { App } from 'obsidian';
import RedPlugin from './main';

type HeadingMode = 'h1' | 'h2' | 'h1-h2';

interface PreviewShell {
    previewContainer: HTMLElement;
    imagePreview: HTMLElement;
    headerArea: HTMLElement;
    contentArea: HTMLElement;
    footerArea: HTMLElement;
    copyButton: HTMLButtonElement;
}

export class RedConverter {
    private static app: App;
    private static plugin: RedPlugin;

    static initialize(app: App, plugin: RedPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    private static getHeadingMode(): HeadingMode {
        const settings = this.plugin?.settingsManager?.getSettings();
        return (settings?.headingLevel as HeadingMode) || 'h1';
    }

    private static getHeadingSelector(mode: HeadingMode): string {
        return mode === 'h1-h2' ? 'h1, h2' : mode;
    }

    private static getHeadingStopTags(mode: HeadingMode): string[] {
        return mode === 'h1-h2'
            ? ['H1', 'H2']
            : [mode.toUpperCase()];
    }

    private static getHeadingMessages(mode: HeadingMode) {
        if (mode === 'h1') {
            return {
                selection: '一级标题(#)',
                noun: '一级标题'
            };
        }
        if (mode === 'h2') {
            return {
                selection: '二级标题(##)',
                noun: '二级标题'
            };
        }
        return {
            selection: '一级标题(#)或二级标题(##)',
            noun: '一级或二级标题'
        };
    }

    static hasValidContent(element: HTMLElement): boolean {
        const headingMode = this.getHeadingMode();
        const headers = element.querySelectorAll(this.getHeadingSelector(headingMode));
        return headers.length > 0;
    }

    static formatContent(element: HTMLElement): void {
        const headingMode = this.getHeadingMode();
        const headers = this.collectHeaders(element, headingMode);

        if (headers.length === 0) {
            this.emitValidationChange(element, false);
            this.renderEmptyState(element, headingMode);
            return;
        }

        this.emitValidationChange(element, true);

        const preview = this.createPreviewShell();
        const contentContainer = this.buildContentContainer(headers, headingMode);
        preview.contentArea.appendChild(contentContainer);
        preview.imagePreview.appendChild(preview.headerArea);
        preview.imagePreview.appendChild(preview.contentArea);
        preview.imagePreview.appendChild(preview.footerArea);
        preview.previewContainer.appendChild(preview.imagePreview);
        this.replaceWithPreview(element, preview.previewContainer, preview.copyButton);
    }

    private static buildContentContainer(headers: Element[], headingMode: HeadingMode) {
        const container = document.createElement('div');
        container.className = 'red-content-container';
        let hasActiveSection = false;

        headers.forEach((header, index) => {
            const sections = this.createSectionsForHeader(header, index, headingMode);
            sections.forEach(section => {
                if (!hasActiveSection) {
                    section.classList.add('red-section-active');
                    hasActiveSection = true;
                }
                container.appendChild(section);
            });
        });

        return container;
    }

    private static createPreviewShell(): PreviewShell {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'red-preview-container';

        const imagePreview = document.createElement('div');
        imagePreview.className = 'red-image-preview';

        const headerArea = document.createElement('div');
        headerArea.className = 'red-preview-header';

        const contentArea = document.createElement('div');
        contentArea.className = 'red-preview-content';

        const footerArea = document.createElement('div');
        footerArea.className = 'red-preview-footer';

        const copyButton = this.createCopyButton();
        previewContainer.appendChild(copyButton);

        return { previewContainer, imagePreview, headerArea, contentArea, footerArea, copyButton };
    }

    private static createCopyButton(): HTMLButtonElement {
        const copyButton = document.createElement('button');
        copyButton.className = 'red-copy-button';
        copyButton.innerHTML = '<?xml version="1.0" encoding="UTF-8"?><svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 12.4316V7.8125C13 6.2592 14.2592 5 15.8125 5H40.1875C41.7408 5 43 6.2592 43 7.8125V32.1875C43 33.7408 41.7408 35 40.1875 35H35.5163" stroke="#9b9b9b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.1875 13H7.8125C6.2592 13 5 14.2592 5 15.8125V40.1875C5 41.7408 6.2592 43 7.8125 43H32.1875C33.7408 43 35 41.7408 35 40.1875V15.8125C35 14.2592 33.7408 13 32.1875 13Z" fill="none" stroke="#9b9b9b" stroke-width="4" stroke-linejoin="round"/></svg>';
        copyButton.title = '复制图片';
        copyButton.setAttribute('aria-label', '复制图片到剪贴板');
        return copyButton;
    }

    private static replaceWithPreview(element: HTMLElement, previewContainer: HTMLElement, copyButton: HTMLButtonElement) {
        element.empty();
        element.appendChild(previewContainer);

        const copyEvent = new CustomEvent('copy-button-added', {
            detail: { copyButton },
            bubbles: true
        });
        element.dispatchEvent(copyEvent);
    }

    private static collectHeaders(element: HTMLElement, headingMode: HeadingMode): Element[] {
        const headingSelector = this.getHeadingSelector(headingMode);
        return Array.from(element.querySelectorAll(headingSelector));
    }

    private static emitValidationChange(element: HTMLElement, isValid: boolean) {
        element.dispatchEvent(new CustomEvent('content-validation-change', {
            detail: { isValid },
            bubbles: true
        }));
    }

    private static renderEmptyState(element: HTMLElement, headingMode: HeadingMode) {
        const headingMessages = this.getHeadingMessages(headingMode);
        element.empty();
        element.createEl('div', {
            cls: 'red-empty-message',
            text: `⚠️ 温馨提示
                        请使用${headingMessages.selection}来分割内容
                        每个${headingMessages.noun}将生成一张独立的图片
                        现在编辑文档，实时预览效果`
        });
    }

    private static createSectionsForHeader(header: Element, index: number, headingMode: HeadingMode): HTMLElement[] {
        const stopTags = this.getHeadingStopTags(headingMode);
        
        // 获取当前标题到下一个标题之间的所有内容
        let content: Element[] = [];
        let current = header.nextElementSibling;
        
        while (current && !stopTags.includes(current.tagName)) {
            content.push(current.cloneNode(true) as Element);
            current = current.nextElementSibling;
        }

        // 检查内容中是否有水平分割线
        const pages: Element[][] = [[]];
        let currentPage = 0;
        
        content.forEach((el: Element) => {
            // 检查是否为水平分割线
            if (el.tagName === 'HR') {
                // 创建新页面
                currentPage++;
                pages[currentPage] = [];
            } else {
                // 如果当前页面数组不存在，创建一个
                if (!pages[currentPage]) {
                    pages[currentPage] = [];
                }
                // 添加元素到当前页面
                pages[currentPage].push(el);
            }
        });
        const sections: HTMLElement[] = [];

        if (pages.length === 1 && !content.some(el => el.tagName === 'HR')) {
            const section = this.createSection(header, index.toString(), content);
            sections.push(section);
            return sections;
        }

        pages.forEach((pageContent, pageIndex) => {
            if (pageContent.length === 0) return;
            const section = this.createSection(header, `${index}-${pageIndex}`, pageContent);
            sections.push(section);
        });

        return sections;
    }

    private static createSection(header: Element, index: string, content: Element[]): HTMLElement {
        const section = document.createElement('section');
        section.className = 'red-content-section';
        section.setAttribute('data-index', index);
        section.appendChild(header.cloneNode(true));
        content.forEach(el => section.appendChild(el));
        this.processElements(section);
        return section;
    }

    private static processElements(container: HTMLElement | null): void {
        if (!container) return;

        // 处理强调文本
        container.querySelectorAll('strong, em').forEach(el => {
            el.classList.add('red-emphasis');
        });

        // 处理链接
        container.querySelectorAll('a').forEach(el => {
            el.classList.add('red-link');
        });

        // 处理表格
        container.querySelectorAll('table').forEach(el => {
            if (el === container.closest('table')) return;
            el.classList.add('red-table');
        });

        // 处理分割线
        container.querySelectorAll('hr').forEach(el => {
            el.classList.add('red-hr');
        });

        // 处理删除线
        container.querySelectorAll('del').forEach(el => {
            el.classList.add('red-del');
        });

        // 处理任务列表
        container.querySelectorAll('.task-list-item').forEach(el => {
            el.classList.add('red-task-list-item');
        });

        // 处理脚注
        container.querySelectorAll('.footnote-ref, .footnote-backref').forEach(el => {
            el.classList.add('red-footnote');
        });

        // 处理代码块
        container.querySelectorAll('pre code').forEach(el => {
            const pre = el.parentElement;
            if (pre) {
                pre.classList.add('red-pre');
                
                // 添加 macOS 风格的窗口按钮
                const dots = document.createElement('div');
                dots.className = 'red-code-dots';

                ['red', 'yellow', 'green'].forEach(color => {
                    const dot = document.createElement('span');
                    dot.className = `red-code-dot red-code-dot-${color}`;
                    dots.appendChild(dot);
                });

                pre.insertBefore(dots, pre.firstChild);
                
                // 移除原有的复制按钮
                const copyButton = pre.querySelector('.copy-code-button');
                if (copyButton) {
                    copyButton.remove();
                }
            }
        });

        // 处理图片
        container.querySelectorAll('span.internal-embed[alt][src]').forEach(async el => {
            const originalSpan = el as HTMLElement;
            const src = originalSpan.getAttribute('src');
            const alt = originalSpan.getAttribute('alt');
            
            if (!src) return;
            
            try {
                const linktext = src.split('|')[0];
                const file = this.app.metadataCache.getFirstLinkpathDest(linktext, '');
                if (file) {
                    const absolutePath = this.app.vault.adapter.getResourcePath(file.path);
                    const newImg = document.createElement('img');
                    newImg.src = absolutePath;
                    if (alt) newImg.alt = alt;
                    newImg.className = 'red-image';
                    originalSpan.parentNode?.replaceChild(newImg, originalSpan);
                }
            } catch (error) {
                console.error('图片处理失败:', error);
            }
        });

        // 处理引用块
        container.querySelectorAll('blockquote').forEach(el => {
            el.classList.add('red-blockquote');
            el.querySelectorAll('p').forEach(p => {
                p.classList.add('red-blockquote-p');
            });
        });
    }
}
