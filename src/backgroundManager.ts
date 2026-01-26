import type { BackgroundSettings } from './types/settings';

export class BackgroundManager {
    public applyBackgroundStyles(element: HTMLElement, settings: BackgroundSettings) {
        const styles = this.computeStyles(settings);
        Object.entries(styles).forEach(([property, value]) => {
            element.style.setProperty(property, value);
        });
    }

    public clearBackgroundStyles(element: HTMLElement) {
        ['background-image', 'background-size', 'background-position', 'background-repeat'].forEach(property => {
            element.style.removeProperty(property);
        });
    }

    private computeStyles(settings: BackgroundSettings) {
        if (!settings.imageUrl) {
            return {};
        }

        return {
            'background-image': `url(${settings.imageUrl})`,
            'background-size': `${settings.scale * 100}%`,
            'background-position': `${settings.position.x}px ${settings.position.y}px`,
            'background-repeat': 'no-repeat'
        } as Record<string, string>;
    }
}
