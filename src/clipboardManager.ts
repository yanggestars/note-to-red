import { CaptureService } from './services/captureService';

export class ClipboardManager {
    static async copyImageToClipboard(element: HTMLElement): Promise<boolean> {
        try {
            const imageElement = element.querySelector('.red-image-preview') as HTMLElement;
            if (!imageElement) {
                throw new Error('找不到预览区域');
            }

            await CaptureService.waitForStableRender();
            const blob = await CaptureService.createBlob(imageElement);
            const clipboardItem = new ClipboardItem({
                'image/png': blob
            });
            await navigator.clipboard.write([clipboardItem]);
            return true;
        } catch (error) {
            console.error('复制图片失败:', error);
            return false;
        }
    }
}
