import React from 'react';
import { StyleSheet } from 'react-native';
import hoistNonReactStatics from 'hoist-non-react-statics';

/**
 * Creates a function from an already-created withTheme HOC that -- when given a react-native StyleSheet source object
 * or a function that returns one given the current theme and (optionally) props as an argument -- returns a HOC that
 * will pass the compiled stylesheet to the wrapped component in the `styleSheet` prop (by default).
 *
 * Important note: if you opt-into props forwarding (withProps set to true) then this disables memoization of the
 * compiled stylesheet.
 *
 * @param withTheme the HOC returned by `createTheming`
 * @param ThemeProvider the ContextProvider returned by `createTheming`
 * @return {
 *  function(styleSheetOrCreator: object|(function(theme: object, props: object): object), options: object):
 *      function(function|React.Component):
 *          function|React.Component
 * }
 */
export default function createWithStyleSheet(withTheme, ThemeProvider) {
    return function(
        styleSheetOrCreator,
        {
            name = null,
            propName = 'styleSheet',
            forwardTheme = true,
            withProps = false,
            propagate = true,
        } = {},
    ) {
        /**
         * The compiled style sheet is a direct result of the theme so we use a WeakMap as a memoization cache which
         * allows us to hold onto references to the theme without stopping them from being garbage collected.
         *
         * @type {WeakMap<object, object>}
         */
        const cache = new WeakMap();

        /**
         * If the user ops into forwarding props through to their style sheet creator function, then we can't cache
         * based on the theme.
         *
         * TODO Support complex caching/memoization based on theme AND props when withProps is true
         *
         * @type {boolean}
         */
        const useCache = !withProps;

        /**
         * Returns a compiled stylesheet given the theme. If the provided style sheet creator function is a function,
         * it will be called with the theme to get the stylesheet source. Otherwise it's assumed it's already a static
         * stylesheet so we precompile it and our function will just return that compiled stylesheet always no matter
         * what the theme is.
         *
         * @type {function(theme: object): object}
         */
        const getStyleSheetForTheme =
            typeof styleSheetOrCreator === 'function'
                ? (theme, props) => {
                      if (useCache && cache.has(theme)) {
                          return cache.get(theme);
                      }
                      const styleSheet = StyleSheet.create(
                          withProps
                              ? styleSheetOrCreator(theme, props)
                              : styleSheetOrCreator(theme),
                      );
                      if (useCache) {
                          cache.set(theme, styleSheet);
                      }
                      return styleSheet;
                  }
                : // Note this is a self-executing function to give us a scope to precompile our static StyleSheet in.
                  (() => {
                      const styleSheet = StyleSheet.create(styleSheetOrCreator);
                      return () => styleSheet;
                  })();

        /**
         * A component wrapped in the withTheme HOC that fetches (maybe compiling, maybe from cache, maybe precompiled)
         * the style sheet and calls its render prop with the stylesheet, the theme, and the remaining props that should
         * be forwarded on.
         *
         * As of @callstack/react-theme-provider@^3.0.0, we need to manually wrap the inner component in a
         * `ThemeProvider` as well (which was done by withTheme in <3.0.0). We allow the developer to opt out
         * via the `propagate` option.
         */
        const CachedWithStyleSheetWrapper = withTheme(
            ({
                theme,
                _renderInnerComponent,
                _propsWithDefault,
                ...restProps
            }) => {
                const innerComponent = _renderInnerComponent({
                    theme,
                    styleSheet: getStyleSheetForTheme(theme, _propsWithDefault),
                    restProps,
                });
                return propagate ? (
                    <ThemeProvider theme={theme}>
                        {innerComponent}
                    </ThemeProvider>
                ) : (
                    innerComponent
                );
            },
        );
        CachedWithStyleSheetWrapper.displayName = 'CachedWithStyleSheetWrapper';

        // We finally return the HOC itself, ensuring we forward any non-react statics as well as refs.
        return function(Comp) {
            const Result = React.forwardRef((props, ref) => (
                <CachedWithStyleSheetWrapper
                    {...props}
                    _propsWithDefault={{
                        ...(Comp.defaultProps || {}),
                        ...props,
                    }}
                    _renderInnerComponent={({
                        theme,
                        styleSheet,
                        restProps,
                    }) => {
                        const finalProps = { [propName]: styleSheet };
                        if (forwardTheme) {
                            finalProps.theme = theme;
                        }
                        return (
                            <Comp {...restProps} ref={ref} {...finalProps} />
                        );
                    }}
                />
            ));
            Result.displayName = `withStyleSheet()(${name ||
                Comp.displayName ||
                Comp.name})`;
            hoistNonReactStatics(Result, Comp);
            return Result;
        };
    };
}
