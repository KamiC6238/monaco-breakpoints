import {
	Range,
	Editor,
	BreakpointEnum,
	ClearDecorations,
	IEditorMouseEvent,
	ModelDeltaDecoration,
	DecorationsCollection,
	IMonacoBreakpointPlugin,
} from '@/types';

import {
	MouseTargetType,
	BREAKPOINT_OPTIONS,
	BREAKPOINT_HOVER_OPTIONS,
} from '@/config';

export default class MonacoBreakpointPlugin {
	/** monaco editor */
	private editor: Editor | null = null;
	private existDecorationsCollection: DecorationsCollection | null = null;
	private hoverDecorationsCollection: DecorationsCollection | null = null;

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
			if (e.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
				this.createHoverBreakpoint(e.target.range);
			} else {
				this.clearDecorations({
					ranges: this.getHoverBreakpointRanges(),
					breakpointEnum: BreakpointEnum.Hover,
				});
			}
		});

		this.editor.onMouseDown((e: IEditorMouseEvent) => {
			if (e.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
			}
		});
	}

	private createHoverBreakpoint(range: Range) {
		if (!this.editor) return;

		const decorations: ModelDeltaDecoration[] = [
			{
				range,
				options: BREAKPOINT_HOVER_OPTIONS,
			},
		];

		if (!this.hoverDecorationsCollection) {
			this.hoverDecorationsCollection =
				this.editor.createDecorationsCollection(decorations);
		} else {
			this.hoverDecorationsCollection.set(decorations);
		}
	}

	private getHoverBreakpointRanges() {
		return this.hoverDecorationsCollection?.getRanges() ?? [];
	}

	private clearDecorations(params: ClearDecorations) {
		if (!this.editor) return;

		const decorationIds = [];
		const { ranges, breakpointEnum } = params;
		const classname =
			breakpointEnum === BreakpointEnum.Exist
				? BREAKPOINT_OPTIONS.glyphMarginClassName
				: BREAKPOINT_HOVER_OPTIONS.glyphMarginClassName;

		for (let range of ranges) {
			const decorations = this.editor.getDecorationsInRange(range) ?? [];

			for (let decoration of decorations) {
				if (decoration.options.glyphMarginClassName === classname) {
					decorationIds.push(decoration.id);
				}
			}
		}

		this.editor.removeDecorations(decorationIds);
	}
}
