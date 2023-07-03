import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, './src/main.ts'),
			name: 'index',
			fileName: 'index'
		},
		rollupOptions: {
			external: ['monaco-editor'],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					'monaco-editor': 'monaco',
				},
			},
		},
		outDir: path.resolve(__dirname, 'dist')
	},
	resolve: {
		alias: [
			{
				find: 'monaco-editor',
				replacement: 'monaco-editor/esm/vs/editor/editor.api.js',
			},
			{
				find: '@',
				replacement: path.resolve(__dirname, 'src'),
			},
		],
	}
});
