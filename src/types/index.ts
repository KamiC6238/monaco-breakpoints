import type * as monaco from 'monaco-editor';

export type Range = monaco.IRange;
export type Position = monaco.IPosition;
export type Disposable = monaco.IDisposable;
export type MonacoEditor = monaco.editor.IStandaloneCodeEditor;

export type EditorMouseEvent = monaco.editor.IEditorMouseEvent;
export type EditorMouseTarget = monaco.editor.IMouseTargetMargin;
export type CursorPositionChangedEvent = monaco.editor.ICursorPositionChangedEvent;

export type ModelDecoration = monaco.editor.IModelDecoration;
export type ModelDeltaDecoration = monaco.editor.IModelDeltaDecoration;
export type ModelDecorationOptions = monaco.editor.IModelDecorationOptions;

/**
 * The meaning of 'Exist' is that the current breakpoint is actually present
 */
export enum BreakpointEnum {
	Exist,
	Hover,
}

export interface MonacoBreakpointProps {
	editor: MonacoEditor;
}

export type Handler<T = any> = (data: T) => void;

export interface BreakpointEvents {
	breakpointChanged: number[];
}