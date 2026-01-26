import type { Theme } from '../types/theme';

/**
 * Loads preset themes from the bundled JSON templates.
 */
export async function loadPresetThemes(): Promise<Theme[]> {
  const { templates } = await import('../templates');
  const presetThemes = Object.values(templates) as Theme[];
  return presetThemes.map(theme => ({
    ...theme,
    isPreset: true,
    isVisible: theme.isVisible !== false
  }));
}

/**
 * Merges themes saved by the user with the predefined presets.
 * Saved visibility is preserved while ensuring all presets exist once.
 */
export function mergeThemes(savedThemes: Theme[] | undefined, presets: Theme[]): Theme[] {
  if (!savedThemes || savedThemes.length === 0) {
    return presets;
  }

  const map = new Map<string, Theme>(savedThemes.map(theme => [theme.id, theme]));

  presets.forEach(theme => {
    const stored = map.get(theme.id);
    map.set(theme.id, {
      ...theme,
      isVisible: stored?.isVisible ?? theme.isVisible,
      isPreset: true
    });
  });

  return Array.from(map.values());
}
