import {
    defineConfig,
    presetIcons,
    presetUno,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'

export default defineConfig({
    presets: [
        presetUno(),
        presetIcons({
            scale: 1.2,
            warn: true,
            extraProperties: {
                'display': 'inline-block',
                'vertical-align': 'middle',
            },
        }),
    ],
    transformers: [
        transformerDirectives(),
        transformerVariantGroup(),
    ],
})
