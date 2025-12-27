/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#37352F'; // Dark Grey (Notion-like primary)
const tintColorDark = '#EBECED'; // Light Grey

export const Colors = {
  light: {
    text: '#37352F',
    subtext: '#787774', // Muted grey
    background: '#FBFBFA', // Paper White // warm off-white
    card: '#FFFFFF', // Clean white for cards to pop against paper
    secondaryCard: '#F1F1EF', // Light grey for secondary items
    border: '#E9E9E7', // Very subtle border
    secondaryBorder: '#E0E0E0', 
    tint: tintColorLight,
    icon: '#9A9A95',
    tabIconDefault: '#ACABA9',
    tabIconSelected: tintColorLight,
    success: '#448361', // Sage Green
    danger: '#D44C47', // Soft Red
    peach: '#FFCC99', // Keep as legacy or update if needed
    primary: '#37352F', // Main action color
    buttonText: '#FFFFFF',
    calendarBackground: '#F7F7F5',
    macroProtein: '#448361', // Moss/Sage
    macroCarbs: '#D9730D', // Goldenrod/Clay
    macroFat: '#E16259', // Terra Cotta
    macroCircleBg: '#F1F1EF',
  },
  dark: {
    text: '#EBECED',
    subtext: '#979A9B',
    background: '#191919', // Deep Charcoal
    card: '#202020', // Slightly lighter charcoal
    secondaryCard: '#2C2C2C',
    border: '#2F2F2F',
    secondaryBorder: '#373737',
    tint: tintColorDark,
    icon: '#707070',
    tabIconDefault: '#707070',
    tabIconSelected: tintColorDark,
    success: '#5DAF84', // Lighter Sage
    danger: '#FF6F69', // Soft Coral
    peach: '#FFCC99',
    primary: '#EBECED',
    buttonText: '#191919',
    calendarBackground: '#202020',
    macroProtein: '#6AB28A', // Pale Green
    macroCarbs: '#E6A35C', // Pale Gold
    macroFat: '#E88C83', // Pale Terra Cotta
    macroCircleBg: '#373737',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'System', // Clean sans-serif
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'Georgia', // Elegant serif for headings
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'System', 
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'Menlo',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  web: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol'",
    serif: "Lyon-Text, Georgia, YuMincho, 'Yu Mincho', 'Hiragino Mincho ProN', 'Hiragino Mincho Pro', 'Songti TC', 'Songti SC', 'SimSun', 'Nanum Myeongjo', NanumMyeongjo, Batang, serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "iawriter-mono, Nitti, Menlo, Courier, monospace",
  },
});
