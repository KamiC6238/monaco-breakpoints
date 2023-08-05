import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import libcss from 'vite-plugin-libcss';
import path from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, './src/main.ts'),
			name: 'index',
			fileName: (format, entryName: string) => {
				// const fileSuffix = `${
				// 	format === 'es'
				// 		? 'js' 
				// 		: format === 'cjs'
				// 			? 'cjs' 
				// 			: 'umd.js'
				// }`;
				// return `${entryName}/${format}/index.${fileSuffix}`;
				return `index.js`;
			},
			// formats: ['es', 'cjs', 'umd']
			formats: ['es']
		},
		rollupOptions: {
			external: ['monaco-editor']
		},
		outDir: path.resolve(__dirname, 'dist')
	},
	plugins: [dts(), libcss()],
	resolve: {
		alias: [
			// {
			// 	find: 'monaco-editor',
			// 	replacement: 'monaco-editor/esm/vs/editor/editor.api.js',
			// },
			{
				find: '@',
				replacement: path.resolve(__dirname, 'src'),
			},
		],
	}
});
