import { ModelDecorationOptions } from '@/types';
import * as monaco from 'monaco-editor';

export const MouseTargetType = monaco.editor.MouseTargetType;

export const BREAKPOINT_OPTIONS: ModelDecorationOptions = {
	glyphMarginClassName: 'monaco-breakpoint',
};

export const BREAKPOINT_HOVER_OPTIONS: ModelDecorationOptions = {
	glyphMarginClassName: 'monaco-hover-breakpoint',
};
