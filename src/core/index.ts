import {
	Range,
	Editor,
	BreakpointEnum,
	IEditorMouseEvent,
	IEditorMouseTarget,
	ModelDeltaDecoration,
	IMonacoBreakpointPlugin,
} from '@/types';

import {
	MouseTargetType,
	BREAKPOINT_OPTIONS,
	BREAKPOINT_HOVER_OPTIONS,
} from '@/config';

export default class MonacoBreakpoint {
	private hoverDecorationId = '';
	private editor: Editor | null = null;
	private lineNumberAndDecorationIdMap = new Map<number, string>();

	constructor(params: IMonacoBreakpointPlugin) {
		if (!params?.editor) {
			throw new Error("Missing 'editor' parameter");
		}

		/**
		 * TODO: 需要对传入的参数做类型校验，
		 * 如果类型不正确，就抛出错误
		 */

		const { editor } = params;

		this.editor = editor;
		this.initMouseEvent();
	}

	private initMouseEvent() {
		this.editor!.onMouseMove((e: IEditorMouseEvent) => {
			const model = this.editor?.getModel();
			const { range, detail } = this.getMouseEventTarget(e);

			// This indicates that the current position of the mouse is over the total number of lines in the editor
			const isAfterLines = detail.isAfterLines;

			if (
				model &&
				!isAfterLines &&
				e.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN
			) {
				// remove previous hover breakpoint decoration
				this.clearHoverDecoration();

				// create new hover breakpoint decoration
				const newDecoration = this.createBreakpointDecoration(
					range,
					BreakpointEnum.Hover
				);
				// render decoration
				const decorationIds = model.deltaDecorations(
					[],
					[newDecoration]
				);
				// record the hover decoraion id
				this.hoverDecorationId = decorationIds[0];
			} else {
				this.clearHoverDecoration();
			}
		});

		this.editor!.onMouseDown((e: IEditorMouseEvent) => {
			const model = this.editor?.getModel();
			const { range, position, detail } = this.getMouseEventTarget(e);

			// This indicates that the current position of the mouse is over the total number of lines in the editor
			const isAfterLines = detail.isAfterLines;
			if (isAfterLines) return;

			if (
				model &&
				e.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN
			) {
				const lineNumber = position.lineNumber;
				const decorationId =
					this.lineNumberAndDecorationIdMap.get(lineNumber);

				// If a breakpoint exists on the current line, it indicates that the current action is to remove the breakpoint
				if (decorationId) {
					this.editor?.removeDecorations([decorationId]);
					this.lineNumberAndDecorationIdMap.delete(lineNumber);
				} else {
					// If no breakpoint exists on the current line, it indicates that the current action is to add a breakpoint
					// create breakpoint decoration
					const newDecoration = this.createBreakpointDecoration(
						range,
						BreakpointEnum.Exist
					);
					// render decoration
					const decorationIds = model.deltaDecorations(
						[],
						[newDecoration]
					);

					// record the new breakpoint decoration id
					this.lineNumberAndDecorationIdMap.set(
						lineNumber,
						decorationIds[0]
					);
				}
			}
		});
	}

	private getMouseEventTarget(e: IEditorMouseEvent) {
		return { ...(e.target as IEditorMouseTarget) };
	}

	private clearHoverDecoration() {
		const model = this.editor?.getModel();

		if (model && this.hoverDecorationId) {
			model.deltaDecorations([this.hoverDecorationId], []);
		}
	}

	private createBreakpointDecoration(
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
}
