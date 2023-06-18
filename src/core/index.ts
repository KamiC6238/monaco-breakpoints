import {
	Range,
	Editor,
	BreakpointEnum,
	IEditorMouseEvent,
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

			if (
				model &&
				e.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN
			) {
				// clear previous hover breakpoint decoration
				this.clearHoverDecoration();

				// create new hover breakpoint decoration
				const decorationIds = model.deltaDecorations(
					[],
					[
						this.createBreakpointDecoration(
							e.target.range,
							BreakpointEnum.Hover
						),
					]
				);
				this.hoverDecorationId = decorationIds[0];
			} else {
				this.clearHoverDecoration();
			}
		});

		this.editor!.onMouseDown((e: IEditorMouseEvent) => {
			const model = this.editor?.getModel();

			if (
				model &&
				e.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN
			) {
				const { range, position } = e.target;
				const lineNumber = position.lineNumber;
				const decorationId =
					this.lineNumberAndDecorationIdMap.get(lineNumber);

				// If a breakpoint exists on the current line, it indicates that the current action is to remove the breakpoint
				if (decorationId) {
					this.editor?.removeDecorations([decorationId]);
					this.lineNumberAndDecorationIdMap.delete(lineNumber);
				} else {
					// If no breakpoint exists on the current line, it indicates that the current action is to add a breakpoint
					const decorationIds = model.deltaDecorations(
						[],
						[
							this.createBreakpointDecoration(
								range,
								BreakpointEnum.Exist
							),
						]
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
