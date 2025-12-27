/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#007AFF';
const tintColorDark = '#0A84FF'; // System blue for both to ensure visibility

export const Colors = {
  light: {
    text: '#11181C',
    subtext: '#687076',
    background: '#ffffff',
    card: '#f9f9f9',
    secondaryCard: '#f0f2f5',
    border: '#eeeeee',
    secondaryBorder: '#f0f0f0',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    success: '#34C759',
    danger: '#FF3B30',
    peach: '#FFCC99',
    primary: '#007AFF',
    buttonText: '#ffffff',
    calendarBackground: '#1c1c1e',
  },
  dark: {
    text: '#ECEDEE',
    subtext: '#9BA1A6',
    background: '#151718',
    card: '#1c1c1e',
    secondaryCard: '#242627',
    border: '#2c2e30',
    secondaryBorder: '#323436',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    success: '#32D74B',
    danger: '#FF453A',
    peach: '#FFCC99',
    primary: '#0A84FF',
    buttonText: '#ffffff',
    calendarBackground: '#000000',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
