import postcssPresetEnv from 'postcss-preset-env'
import postcssCustomMedia from 'postcss-custom-media'
import postcssGlobalData from '@csstools/postcss-global-data'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    postcssPresetEnv({
      autoprefixer: false,
      stage: 2,
      features: {
        'logical-properties-and-values': false,
        'prefers-color-scheme-query': false,
        'gap-properties': false,
        'custom-properties': false,
        'is-pseudo-class': false,
        'focus-within-pseudo-class': false,
        'focus-visible-pseudo-class': false,
        'color-functional-notation': false,
        'cascade-layers': false,
        'double-position-gradients': false,
        'has-pseudo-class': false,
        'place-properties': false,
        'media-query-ranges': false,
        'custom-media-queries': true,
      },
    }),

    postcssGlobalData({
      files: ['src/scss/props/_custom-media.scss'],
    }),

    postcssCustomMedia(),
    autoprefixer(),
  ],
}
