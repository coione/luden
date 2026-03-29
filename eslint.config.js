import js from '@eslint/js';
import ts from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    prettier,
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
            },
        },
    },
    {
        files: ['**/*.ts', '**/*.vue'],
        rules: {
            'no-undef': 'off',
        },
    },
    {
        files: ['**/Pages/**/*.vue', '**/Components/**/*.vue'],
        rules: {
            'vue/multi-word-component-names': 'off',
        },
    },
    {
        ignores: ['vendor/**', 'node_modules/**', 'public/**', 'bootstrap/**'],
    },
);
