import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import libcss from 'vite-plugin-libcss';
import path from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, './src/index.ts'),
			name: 'index',
			fileName: 'index',
			// fileName: (format, entryName: string) => {
				// const fileSuffix = `${
				// 	format === 'es'
				// 		? 'js' 
				// 		: format === 'cjs'
				// 			? 'cjs' 
				// 			: 'umd.js'
				// }`;
				// return `${format}/index.js`;
			// },
			// formats: ['es', 'cjs', 'umd']
			formats: ['es'],
		},
		rollupOptions: {
			external: ['monaco-editor'],
			// output: {
				// assetFileNames: ({name}) => {
				// 	// fix css output path
				// 	if (/\.css$/.test(name ?? '')) {
				// 		return 'es/[name][extname]';   
				// 	}
				// 	return '[name][extname]'
				// }
			// }
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
