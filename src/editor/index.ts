import * as monaco from 'monaco-editor';

console.log(monaco);

export function createEditor(id: string) {
	const element = document.getElementById(id);

	if (element) {
		return monaco.editor.create(element, {
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
