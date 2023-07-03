import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, './src/main.ts'),
			name: 'index',
			fileName: (format, entryName: string) => {
				const fileSuffix = `${
					format === 'es'
						? 'js' 
						: format === 'cjs'
							? 'cjs' 
							: 'umd.js'
				}`;

				return `${entryName}/${format}/index.${fileSuffix}`;
			},
			formats: ['es', 'cjs', 'umd']
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
