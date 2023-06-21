import {
	Range,
	BreakpointEnum,
	EditorMouseEvent,
	EditorMouseTarget,
	ModelDeltaDecoration,
} from '@/types';

import { BREAKPOINT_OPTIONS, BREAKPOINT_HOVER_OPTIONS } from '@/config';

export function createBreakpointDecoration(
	range: Range,
	breakpointEnum: BreakpointEnum
): ModelDeltaDecoration {
	return {
		range,
		options:
			breakpointEnum === BreakpointEnum.Exist
				? BREAKPOINT_OPTIONS
				: BREAKPOINT_HOVER_OPTIONS,
	};
}

export function getMouseEventTarget(e: EditorMouseEvent) {
	return { ...(e.target as EditorMouseTarget) };
}
