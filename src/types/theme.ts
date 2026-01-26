export interface ThemeTitleStyle {
  base: string;
  content: string;
  after: string;
}

export interface ThemeStyles {
  imagePreview: string;
  header: {
    avatar: {
      container: string;
      placeholder: string;
      image: string;
    };
    nameContainer: string;
    userName: string;
    userId: string;
    postTime: string;
    verifiedIcon: string;
  };
  footer: {
    container: string;
    text: string;
    separator: string;
  };
  title: {
    h1?: ThemeTitleStyle;
    h2?: ThemeTitleStyle;
    h3?: ThemeTitleStyle;
    base: ThemeTitleStyle;
  };
  paragraph: string;
  list: {
    container: string;
    item: string;
    taskList: string;
  };
  quote: string;
  code: {
    block: string;
    inline: string;
  };
  image: string;
  link: string;
  emphasis: {
    strong: string;
    em: string;
    del: string;
  };
  table: {
    container: string;
    header: string;
    cell: string;
  };
  hr: string;
  footnote: {
    ref: string;
    backref: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  isPreset?: boolean;
  isVisible?: boolean;
  styles: ThemeStyles;
}
