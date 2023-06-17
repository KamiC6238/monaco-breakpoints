import { Editor, IEditorMouseEvent, IMonacoBreakpointPlugin } from '@/types';

import {
	MouseTargetType,
	BREAKPOINT_OPTIONS,
	BREAKPOINT_HOVER_OPTIONS,
} from '@/config';

export default class MonacoBreakpointPlugin {
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
		if (!this.editor) return;

		this.editor.onMouseMove((e: IEditorMouseEvent) => {
			const model = this.editor?.getModel();

			if (
				model &&
				e.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN
			) {
				if (this.hoverDecorationId) {
					model.deltaDecorations([this.hoverDecorationId], []);
				}

				const newDecoration = {
					range: e.target.range,
					options: BREAKPOINT_HOVER_OPTIONS,
				};

				const decorationIds = model.deltaDecorations(
					[],
					[newDecoration]
				);
				this.hoverDecorationId = decorationIds[0];
			}
		});

		this.editor.onMouseDown((e: IEditorMouseEvent) => {
			if (!this.editor) return;

			if (e.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
				const model = this.editor.getModel();
				const { range, position } = e.target;
				const lineNumber = position.lineNumber;

				if (!model) return;

				const newDecoration = {
					range,
					options: BREAKPOINT_OPTIONS,
				};

				const decorationId =
					this.lineNumberAndDecorationIdMap.get(lineNumber);

				if (decorationId) {
					this.editor.removeDecorations([decorationId]);
					this.lineNumberAndDecorationIdMap.delete(lineNumber);
				} else {
					const decorationIds = model.deltaDecorations(
						[],
						[newDecoration]
					);
					this.lineNumberAndDecorationIdMap.set(
						lineNumber,
						decorationIds[0]
					);
				}
			}
		});
	}
}
