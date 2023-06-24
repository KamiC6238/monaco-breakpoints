import * as monaco from 'monaco-editor';

const democode = [
	'functino foo() {\n',
	'\treturn 1;\n',
	'}\n'
].join('')

export function createEditor(id: string) {
	const element = document.getElementById(id);

	if (element) {
		return monaco.editor.create(element, {
			value: democode,
			theme: 'vs-dark',
			automaticLayout: true,
			minimap: {
				enabled: false,
			},
			glyphMargin: true,
		});
	}

	return null;
}
