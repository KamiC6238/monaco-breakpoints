import type * as monaco from 'monaco-editor';

export type Range = monaco.IRange;
export type Position = monaco.IPosition;
export type Disposable = monaco.IDisposable;
export type Model = monaco.editor.ITextModel
export type MonacoEditor = monaco.editor.IStandaloneCodeEditor;

export type EditorMouseEvent = monaco.editor.IEditorMouseEvent;
export type EditorMouseTarget = monaco.editor.IMouseTargetMargin;
export type CursorPositionChangedEvent = monaco.editor.ICursorPositionChangedEvent;

export type ModelDecoration = monaco.editor.IModelDecoration;
export type ModelDeltaDecoration = monaco.editor.IModelDeltaDecoration;
export type ModelDecorationOptions = monaco.editor.IModelDecorationOptions;

export type IMarkdownString = monaco.IMarkdownString

/**
 * The meaning of 'Exist' is that the current breakpoint is actually present
 */
export enum BreakpointEnum {
	Exist,
	Hover,
}

export type HoverMessage = {
  /** Hover message for added breakpoint. Defaults to empty. */
  added?: IMarkdownString | IMarkdownString[]
  /** Hover message for unadded breakpoints. Defaults to 'Click to add a breakpoint'. */
  unAdded?: IMarkdownString | IMarkdownString[]
}

export interface MonacoBreakpointProps {
	editor: MonacoEditor;
  /**
   * Hover message for added/unadded breakpoint
   */
  hoverMessage?: HoverMessage
}

export type Handler<T = any> = (data: T) => void;

export interface BreakpointEvents {
	breakpointChanged: number[];
}
