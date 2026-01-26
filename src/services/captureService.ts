import * as htmlToImage from 'html-to-image';

export class CaptureService {
  private static readonly RENDER_DELAY = 300;

  static async waitForStableRender(delay = CaptureService.RENDER_DELAY) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  static async createBlob(element: HTMLElement): Promise<Blob> {
    try {
      const blob = await htmlToImage.toBlob(element, this.getExportConfig(element));
      if (!blob) {
        throw new Error('Blob 对象为空');
      }
      return blob;
    } catch (err) {
      const canvas = await htmlToImage.toCanvas(element, this.getExportConfig(element));
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(err ?? new Error('Canvas 转换为 Blob 失败'));
          }
        }, 'image/png', 1);
      });
    }
  }

  static async withHeaderScaling(imageElement: HTMLElement, task: () => Promise<void>) {
    const reset = this.applyNotesHeaderScale(imageElement);
    try {
      await task();
    } finally {
      reset();
    }
  }

  static getExportConfig(imageElement: HTMLElement) {
    return {
      quality: 1,
      pixelRatio: 4,
      skipFonts: false,
      filter: () => true,
      imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    };
  }

  private static applyNotesHeaderScale(imageElement: HTMLElement): () => void {
    const notesHeader = imageElement.querySelector('.red-notes-header') as HTMLElement | null;
    if (!notesHeader) {
      return () => {};
    }

    const zoomFactor = this.getZoomFactor(imageElement);
    if (Math.abs(zoomFactor - 1) < 0.01) {
      return () => {};
    }

    const previousScale = notesHeader.style.getPropertyValue('--red-notes-export-scale');
    const hadScale = previousScale.length > 0;
    const addedClass = !notesHeader.classList.contains('red-notes-exporting');

    notesHeader.style.setProperty('--red-notes-export-scale', zoomFactor.toString());
    notesHeader.classList.add('red-notes-exporting');

    return () => {
      if (!hadScale) {
        notesHeader.style.removeProperty('--red-notes-export-scale');
      } else {
        notesHeader.style.setProperty('--red-notes-export-scale', previousScale);
      }

      if (addedClass) {
        notesHeader.classList.remove('red-notes-exporting');
      }
    };
  }

  private static getZoomFactor(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    const layoutWidth = element.offsetWidth || element.clientWidth || rect.width;
    if (!layoutWidth) {
      return 1;
    }

    const zoom = rect.width / layoutWidth;
    return Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  }
}
