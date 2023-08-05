# monaco-breakpoints

## A typesafe library support breakpoints in monaco-editor like vscode

## Installing
```
> npm i monaco-breakpoints
> npm i monaco-editor@latest
```

## Usage
```typescript
import * as monaco from 'monaco-editor';
import { MonacoBreakpoint } from 'monaco-breakpoints';

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

const instance = new MonacoBreakpoint({ editor });

instance.on('breakpointChanged', breakpoints => {
    console.log('breakpointChanged: ', breakpoints);
})
```

## Packages
Please make sure your `monaco-editor` version is greater than or equal to `0.39.0`.

## example
https://codesandbox.io/p/sandbox/lingering-frost-53pjww?file=%2Fsrc%2FApp.vue%3A8%2C9

## License
Licensed under the MIT License.
