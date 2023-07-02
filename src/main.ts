import * as monaco from 'monaco-editor';
import MonacoBreakpoint from '@/core';
import '@/style/index.css';
import '@/style/global.css';

const democode = [
	'function foo() {\n',
	'\treturn 1;\n',
	'}\n',
	'function bar() {\n',
	'\treturn 1;\n',
	'}',
].join('')

const editor = monaco.editor.create(document.getElementById('app')!, {
    value: democode,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: {
        enabled: false,
    },
    glyphMargin: true,
});

const mncBreakpoint = new MonacoBreakpoint({ editor })

window.mncBreakpoint = mncBreakpoint;
