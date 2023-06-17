import type * as monaco from 'monaco-editor';

export type ModelDeltaDecoration = monaco.editor.IModelDeltaDecoration;
export type ModelDecorationOptions = monaco.editor.IModelDecorationOptions;

export type Editor = monaco.editor.IStandaloneCodeEditor;

export interface IMonacoBreakpointPlugin {
	editor: Editor;
}

export type DecorationsCollection = monaco.editor.IEditorDecorationsCollection;

export type IEditorMouseEvent = monaco.editor.IEditorMouseEvent;

export type Range = monaco.Range;

/**
 * The meaning of 'Exist' is that the current breakpoint is actually present
 */
export enum BreakpointEnum {
	Exist,
	Hover,
}

export interface ClearDecorations {
	ranges: Range[];
	breakpointEnum: BreakpointEnum;
}
