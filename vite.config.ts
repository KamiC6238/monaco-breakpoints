import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
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
	},
});
