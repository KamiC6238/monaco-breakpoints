// export {default as MonacoBreakpoint} from './core';

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
    glyphMargin: true,
});

const instance = new MonacoBreakpoint({
  editor,
  hoverMessage: {
    added: {
      value: 'Added breakpoint'
    },
    unAdded: {
      value: 'test test'
    }
  }
});

instance.on('breakpointChanged', breakpoints => {
    console.log('breakpointChanged: ', breakpoints);
})
