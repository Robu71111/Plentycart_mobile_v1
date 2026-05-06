# Plentycart — Project Conventions for Claude Code

## Babel Configuration

The Babel plugin `react-native-worklets/plugin` MUST always remain the
LAST entry in the `plugins` array of `babel.config.js`. This is a
hard requirement from react-native-reanimated and react-native-worklets.

When adding new Babel plugins:
- Add them BEFORE `'react-native-worklets/plugin'`
- Never reorder the array such that worklets is not last
- Never remove this plugin unless explicitly removing reanimated/worklets dependencies

If you (Claude Code) ever need to modify `babel.config.js`, verify this
rule is preserved before saving.

Current required shape:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      // ... any new plugins go here ...
      'react-native-worklets/plugin', // MUST be last
    ],
  };
};
```
