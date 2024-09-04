import mirinaeTailwind from '@cloudforet-test/mirinae/tailwind.config.cjs';

export default {
  purge: ['./src/**/*.{html,js,jsx,ts,tsx,vue}'],

  theme: {
    ...mirinaeTailwind.theme,
    // your customized theme
  },
  variants: [
    ...mirinaeTailwind.variants,
  //   // your customized variants
  ],
  plugins: [
    ...mirinaeTailwind.plugins,
    // your customized plugins
  ]
}
