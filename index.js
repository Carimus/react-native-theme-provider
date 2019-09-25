import { createTheming as _createTheming } from '@callstack/react-theme-provider';
import createWithStyleSheet from './src/createWithStyleSheet';

export function createTheming(...args) {
    // Delegate to callstack's `createTheming`
    const { withTheme, ThemeProvider, ...rest } = _createTheming(...args);
    // Create `withStyleSheet` the newly created `withTheme` and `ThemeProvider`
    const withStyleSheet = createWithStyleSheet(withTheme, ThemeProvider);
    // Mixin our new goodies into the already returned goodies from callstack
    return { withTheme, ThemeProvider, withStyleSheet, ...rest };
}
