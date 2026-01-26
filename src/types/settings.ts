import type { Theme } from './theme';

export interface BackgroundSettings {
  imageUrl: string;
  scale: number;
  position: { x: number; y: number };
}

export interface FontOption {
  value: string;
  label: string;
  isPreset?: boolean;
}

export interface RedSettings {
  templateId: string;
  themeId: string;
  fontFamily: string;
  fontSize: number;
  backgroundId: string;
  themes: Theme[];
  customThemes: Theme[];
  userAvatar: string;
  userName: string;
  notesTitle: string;
  userId: string;
  showTime: boolean;
  timeFormat: string;
  showFooter?: boolean;
  footerLeftText: string;
  footerRightText: string;
  headingLevel: 'h1' | 'h2' | 'h1-h2';
  customFonts: FontOption[];
  backgroundSettings: BackgroundSettings;
}

export const DEFAULT_SETTINGS: RedSettings = {
  templateId: 'default',
  themeId: 'default',
  fontFamily: 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC"',
  fontSize: 16,
  backgroundId: '',
  themes: [],
  customThemes: [],
  userAvatar: '',
  userName: '夜半',
  notesTitle: '备忘录',
  userId: '@Yeban',
  showTime: true,
  timeFormat: 'zh-CN',
  showFooter: true,
  headingLevel: 'h2',
  footerLeftText: '夜半过后，光明便启程',
  footerRightText: '欢迎关注公众号：夜半',
  customFonts: [
    {
      value: 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC", Cambria, Cochin, Georgia, Times, "Times New Roman", serif',
      label: '默认字体',
      isPreset: true
    },
    {
      value: 'SimSun, "宋体", serif',
      label: '宋体',
      isPreset: true
    },
    {
      value: 'SimHei, "黑体", sans-serif',
      label: '黑体',
      isPreset: true
    },
    {
      value: 'KaiTi, "楷体", serif',
      label: '楷体',
      isPreset: true
    },
    {
      value: '"Microsoft YaHei", "微软雅黑", sans-serif',
      label: '雅黑',
      isPreset: true
    }
  ],
  backgroundSettings: {
    imageUrl: '',
    scale: 1,
    position: { x: 0, y: 0 }
  }
};
