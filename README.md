# `@carimus/react-native-theme-provider`

A React Native package that wraps [`@callstack/react-theme-provider`](https://github.com/callstack/react-theme-provider)
to add in some React Native-specific goodies.

See the `react-theme-provider`'s docs for usage details.

## Additions

### `withStyleSheet`

When you call `createTheming`, the returned object will also contain a `withStyleSheet` property which creates a
HOC when called with styles that injects a `styleSheet` into the component props.

In short this allows you to declare a component's stylesheet as a function of the theme, analogous to Material UI's
[`withStyles`](https://material-ui.com/styles/api/#withstyles-styles-options-higher-order-component).

#### Usage

```
withStyleSheet(styles, [options]) => ((YourComponent) => ThemedComponent)
```

Calling `withStyleSheet` returns a higher order component which you call with your component in order to inject
a stylesheet based on the theme into your component.

#### Arguments

1.  `styles` (`(function(theme: object, props?: object): object) | object`): If an object, `styles` is passed through
    `StyleSheet.create()` and given straight to the wrapped component as `styleSheet`. If it's a function, it will be
    called with the `theme` (and possibly the props as the second arg if `options.withProps` is set to `true`, **not
    the default**) and it should return an object which will be passed through `StyleSheet.create()` and given to the
    wrapped component as `styleSheet`.
2.  `options` (`object` _optional_):
    -   `options.name` (`string`; _optional_): Used when generating the display name of the wrapper component, otherwise
        `YourComponent.displayName || YourComponent.name` is used.
    -   `options.propName` (`string`; _optional_, defaults to `'styleSheet'`): The name of the prop to pass the
        generated and compiled stylesheet as to `YourComponent`
    -   `options.forwardTheme` (`boolean`; _optional_, defaults to `true`): If `true` (the default), the theme will be
        passed into `YourComponent` on the `theme` prop.
    -   `options.withProps` (`boolean`; _optional_, defaults to `false`): This has no effect if `styles` is an object.
        If `true`, the incoming props will be passed to your `styles` function as the second argument.
        **Important note:** this disables caching of the compiled stylesheet. The performance hit is marginal but if
        performance is crucial to this component, you should instead prefer to conditionally apply styles in your
        styleSheet in the render function of your component based on the props of interest, and, of course,
        appropriately implement `shouldComponentUpdate` or similar.
    -   `options.propagate` (`boolean`; _optional_, defaults to `true`): If `true` (the default), will also wrap
        `YourComponent` in the `ThemeProvider` so that the final theme (i.e. including any merged in styles) will
        propagate into the subtree. This isn't strictly necessary if the theme is never modified and you have the
        `ThemeProvider` at the root of your app, but if you manually update the `theme` by providing a `theme` prop
        which will be merged into the contextual theme per the behaviour of `withTheme`, then you need to leave this
        as `true` in order for themed components in the subtree to use the same modified theme. If you don't want this
        (i.e. if you want components in the subtree to use the original theme), set this to `false`.

#### Notes

-   The returned function is a HOC which you use to wrap your component. All props will be forwarded to your component
    with the addition of the `styleSheet` and `theme` props (both are configurable via `options`).
-   `theme` is the original theme object that was passed to `createTheming`
-   `styleSheet` is the result of `StyleSheet.create()` called on the `styles` object (or the result of calling
    `styles` if it's a function given the `theme` and optionally the `props`).
-   If `styles` is a function and `options.withProps` is false, the result of calling `styles` with a given theme
    is cached. `styles` won't be called again to generate the `styleSheet` on future renders unless the `theme` changes.
-   `withStyleSheet` implies `withTheme` so all behaviour that `withTheme` exhibits applies to `withStyleSheet` as well.
    For example, the component can be called with a `theme` prop and that `theme` will be merged into the contextual
    theme.

#### Example

**`theme.js`**

```js
import { createTheming } from '@carimus/react-native-theme-provider';

const theme = {
    palette: {
        background: '#000000',
        foreground: '#FFFFFF',
    },
};

export const {
    ThemeProvider,
    withTheme,
    useTheme,
    withStyleSheet,
} = createTheming(theme);
```

**`FooComponent.js`**

```js
import { View, Text } from 'react-native';

import { withStyleSheet } from './theme';

const styles = (theme) => ({
    root: {
        backgroundColor: theme.palette.background,
    },
    text: {
        color: theme.palette.foreground,
    },
});

function FooComponent({ styleSheet, children }) {
    return (
        <View style={styleSheet.root}>
            <Text style={styleSheet.text}>{children}</Text>
        </View>
    );
}

export default withStyleSheet(styles)(FooComponent);
```

## TODO

-   [ ] \[`withStyleSheet`\] Advanced caching in order to cache compiled styleSheets even when `withProps` is `true`.
-   [ ] Some generic HOC that isn't dependent on a `theme` (i.e. isn't a result of `createTheming`) that can still
        somehow accept a theme dynamically from context and apply/merge it in to a default theme. For generic components
        to except a theme somehow but have sane defaults.
