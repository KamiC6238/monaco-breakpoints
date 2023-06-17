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
	private hoverDecorationsCollection: DecorationsCollection | null = null;
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
			const data = {
				ranges: this.getHoverBreakpointRanges(),
				breakpointEnum: BreakpointEnum.Hover,
			};

			if (e.target.type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
				const { range, position } = e.target;
				const lineNumber = position.lineNumber;

				if (this.getLineDecorationId(lineNumber)) {
					this.clearDecorations(data);
					return;
				}

				this.createHoverBreakpoint(range);
			} else {
				this.clearDecorations(data);
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

	private createHoverBreakpoint(range: Range) {
		if (!this.editor) return;

		const decorations: ModelDeltaDecoration[] = [
			{
				range,
				options: BREAKPOINT_HOVER_OPTIONS,
			},
		];

		if (this.hoverDecorationsCollection) {
			this.hoverDecorationsCollection.set(decorations);
		} else {
			this.hoverDecorationsCollection =
				this.editor.createDecorationsCollection(decorations);
		}
	}

	private getHoverBreakpointRanges() {
		return this.hoverDecorationsCollection?.getRanges() ?? [];
	}

	// private createBreakpoint(range: Range) {
	// 	if (!this.editor) return;

	// 	const model = this.editor.getModel();

	// 	if (model) {
	// 		const previousDecorations = this.existDecorationsId.map(
	// 			(decorationId) => ({
	// 				range: model.getDecorationRange(decorationId)!,
	// 				options: model.getDecorationOptions(decorationId)!,
	// 			})
	// 		);

	// 		const decorations: ModelDeltaDecoration[] = [
	// 			{
	// 				range,
	// 				options: BREAKPOINT_OPTIONS,
	// 			},
	// 			...previousDecorations,
	// 		];

	// 		console.log(decorations);

	// 		this.existDecorationsId = model.deltaDecorations([], decorations);
	// 	}
	// }

	private clearDecorations(params: ClearDecorations) {
		if (!this.editor) return;

		const decorationIds = [];
		const { ranges, breakpointEnum } = params;
		const classname = this.getGlypyMarginClassName(breakpointEnum);

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

	private getLineDecorationId(
		lineNumber: number,
		breakpointEnum: BreakpointEnum = BreakpointEnum.Exist
	) {
		const decorations = this.editor?.getLineDecorations(lineNumber);
		const classname = this.getGlypyMarginClassName(breakpointEnum);
		return decorations?.find(
			(decoration) =>
				decoration.options.glyphMarginClassName === classname
		)?.id;
	}

	// private getAllDecorations(
	// 	breakpointEnum: BreakpointEnum = BreakpointEnum.Exist
	// ) {
	// 	const classname = this.getGlypyMarginClassName(breakpointEnum);
	// 	const model = this.editor?.getModel();
	// 	return (
	// 		model
	// 			?.getAllDecorations()
	// 			.filter(
	// 				(decoration) =>
	// 					decoration.options.glyphMarginClassName === classname
	// 			) ?? []
	// 	);
	// }

	private getGlypyMarginClassName(breakpointEnum: BreakpointEnum) {
		return breakpointEnum === BreakpointEnum.Exist
			? BREAKPOINT_OPTIONS.glyphMarginClassName
			: BREAKPOINT_HOVER_OPTIONS.glyphMarginClassName;
	}
}
