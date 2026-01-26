import JSZip from 'jszip';
import { CaptureService } from './services/captureService';

export class DownloadManager {
    static async downloadAllImages(element: HTMLElement): Promise<void> {
        try {
            const zip = new JSZip();
            const previewContainer = element.querySelector('.red-preview-container');
            if (!previewContainer) throw new Error('找不到预览容器');

            // 定义 CSS 类名常量
            const VISIBLE_CLASS = 'red-section-visible';
            const HIDDEN_CLASS = 'red-section-hidden';

            const sections = previewContainer.querySelectorAll<HTMLElement>('.red-content-section');
            const totalSections = sections.length;

            // 保存原始可见状态（基于类名）
            const originalVisibility = Array.from(sections).map(section => ({
                visible: section.classList.contains(VISIBLE_CLASS),
                hidden: section.classList.contains(HIDDEN_CLASS)
            }));

            for (let i = 0; i < totalSections; i++) {
                // 使用 classList API 批量操作
                sections.forEach(section => {
                    section.classList.add(HIDDEN_CLASS);
                    section.classList.remove(VISIBLE_CLASS);
                });

                sections[i].classList.remove(HIDDEN_CLASS);
                sections[i].classList.add(VISIBLE_CLASS);

                const imageElement = element.querySelector<HTMLElement>('.red-image-preview')!;
                await CaptureService.waitForStableRender();
                await CaptureService.withHeaderScaling(imageElement, async () => {
                    const blob = await CaptureService.createBlob(imageElement);
                    zip.file(`小红书笔记_第${i + 1}页.png`, blob);
                });
            }

            // 恢复原始类名状态
            sections.forEach((section, index) => {
                section.classList.toggle(VISIBLE_CLASS, originalVisibility[index].visible);
                section.classList.toggle(HIDDEN_CLASS, originalVisibility[index].hidden);
            });

            // 创建下载
            const content = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            });

            if (!(content instanceof Blob)) {
                throw new Error('生成的压缩文件不是有效的 Blob 对象');
            }

            const url = URL.createObjectURL(content);
            const link = Object.assign(document.createElement('a'), {
                href: url,
                download: `小红书笔记_${Date.now()}.zip`
            });

            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('导出图片失败:', error);
            throw error;
        }
    }

    static async downloadSingleImage(element: HTMLElement): Promise<void> {
        try {
            const imageElement = element.querySelector('.red-image-preview') as HTMLElement;
            if (!imageElement) {
                throw new Error('找不到预览区域');
            }

            await CaptureService.waitForStableRender();
            await CaptureService.withHeaderScaling(imageElement, async () => {
                const blob = await CaptureService.createBlob(imageElement);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `小红书笔记_${new Date().getTime()}.png`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            });
        } catch (error) {
            console.error('导出图片失败:', error);
            throw error;
        }
    }
}
