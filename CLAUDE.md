# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Expo-based React Native application using Expo Router for file-based navigation. The project supports iOS, Android, and web platforms with automatic dark mode support and uses the React Native new architecture.

## Development Commands

### Starting the App
```bash
npx expo start          # Start development server
npm run android         # Run on Android emulator
npm run ios            # Run on iOS simulator
npm run web            # Run in web browser
```

### Code Quality
```bash
npm run lint           # Run ESLint
```

### Project Management
```bash
npm run reset-project  # Move starter code to app-example/ and create blank app/
```

## Architecture

### File-Based Routing (Expo Router)
The app uses Expo Router v6 with file-based routing and typed routes enabled:
- `app/_layout.tsx` - Root layout with theme provider and navigation stack
- `app/(tabs)/_layout.tsx` - Tab navigation layout with bottom tabs
- `app/(tabs)/index.tsx` - Home screen (default tab)
- `app/(tabs)/explore.tsx` - Explore screen
- `app/modal.tsx` - Modal screen example
- `unstable_settings.anchor` is set to `(tabs)` for deep linking

### Theming System
The app has a comprehensive theming system that automatically supports light and dark modes:
- `constants/theme.ts` - Centralized color and font definitions for both light/dark modes
- `hooks/use-color-scheme.ts` - Platform-specific color scheme detection (has web variant)
- `hooks/use-theme-color.ts` - Hook for resolving theme colors with prop overrides
- `components/themed-text.tsx` - Text component with theme support and preset types
- `components/themed-view.tsx` - View component with theme-aware backgrounds

**Pattern**: Themed components accept optional `lightColor` and `darkColor` props to override theme defaults. The `useThemeColor` hook resolves colors by checking props first, then falling back to theme constants.

### Path Aliases
TypeScript is configured with `@/*` path alias mapping to the root directory (see `tsconfig.json`). Use this consistently:
```typescript
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
```

### Component Organization
- `components/` - Reusable components (themed components, UI primitives)
- `components/ui/` - Lower-level UI components (icon-symbol with iOS variant)
- `hooks/` - Custom React hooks (platform-specific variants with `.web.ts` extension)

### Platform-Specific Files
The project uses platform extensions for targeted implementations:
- `.ios.tsx` - iOS-specific implementation (e.g., `icon-symbol.ios.tsx`)
- `.web.ts` - Web-specific implementation (e.g., `use-color-scheme.web.ts`)

### Expo Configuration
Key settings in `app.json`:
- New architecture enabled (`newArchEnabled: true`)
- Typed routes experiment enabled
- React Compiler experiment enabled
- Edge-to-edge display on Android
- Automatic user interface style (light/dark)
- Custom URL scheme: `noobdiet://`

## Development Notes

### TypeScript Configuration
- Strict mode enabled
- Extends expo/tsconfig.base
- Includes `.expo/types/**/*.ts` for generated types

### Dependencies
- React 19.1.0 and React Native 0.81.5
- React Native Reanimated 4.1.1 (requires worklets)
- Expo SDK ~54
- React Navigation v7 for bottom tabs

### Haptic Feedback
Tab navigation uses `HapticTab` component wrapper for tactile feedback on tab presses.

### Icons
Uses `expo-symbols` with `IconSymbol` component. iOS variant provides SF Symbols support, fallback for other platforms.
