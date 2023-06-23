import {
	Range,
	Disposable,
	MonacoEditor,
	BreakpointEnum,
	EditorMouseEvent,
	MonacoBreakpointProps,
	ModelDecoration
} from '@/types';

import { MouseTargetType, BREAKPOINT_OPTIONS } from '@/config';
import { getMouseEventTarget, createBreakpointDecoration } from '@/utils';

export default class MonacoBreakpoint {
	private preLineCount = 0;
	private hoverDecorationId = '';
	private editor: MonacoEditor | null = null;
	
	private mouseMoveDisposable: Disposable | null = null;
	private mouseDownDisposable: Disposable | null = null;
	private contentChangedDisposable: Disposable | null = null;

	private decorationIdAndRangeMap = new Map<string, Range>();
	private lineNumberAndDecorationIdMap = new Map<number, string>();

	constructor(params: MonacoBreakpointProps) {
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
		this.initEditorEvent();
	}

	private initMouseEvent() {
		this.mouseMoveDisposable = this.editor!.onMouseMove(
			(e: EditorMouseEvent) => {
				const model = this.getModel();
				const { range, detail, type } = getMouseEventTarget(e);

				// This indicates that the current position of the mouse is over the total number of lines in the editor
				if (detail?.isAfterLines) {
					this.removeHoverDecoration();
					return;
				}

				if (model && type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
					// remove previous hover breakpoint decoration
					this.removeHoverDecoration();

					// create new hover breakpoint decoration
					const newDecoration = createBreakpointDecoration(
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
					this.removeHoverDecoration();
				}
			}
		);

		this.mouseDownDisposable = this.editor!.onMouseDown(
			(e: EditorMouseEvent) => {
				const model = this.getModel();
				const { type, range, detail, position } = getMouseEventTarget(e);

				if (model && type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
					// This indicates that the current position of the mouse is over the total number of lines in the editor
					if (detail.isAfterLines) {
						return;
					}

					const lineNumber = position.lineNumber;
					const decorationId =
						this.lineNumberAndDecorationIdMap.get(lineNumber);

					/**
					 * If a breakpoint exists on the current line,
					 * it indicates that the current action is to remove the breakpoint
					 */
					if (decorationId) {
						this.removeSpecifyDecoration(decorationId, lineNumber);
					} else {
						this.createSpecifyDecoration(range);
					}
				}
			}
		);
	}

	private initEditorEvent() {
		this.preLineCount = this.getLineCount();
		this.contentChangedDisposable = this.editor!.onDidChangeModelContent((e) => {
			const model = this.getModel();
			const isUndoing = e.isUndoing;
			const curLineCount = this.getLineCount();
			const decorations = this.getAllDecorations();
			const isLineCountChanged = curLineCount !== this.preLineCount;
			this.preLineCount = curLineCount;

			/**
			 * 1. 光标在行头回车 - 完成
			 * 2. 光标在行尾回车 - 完成
			 * 3. 光标在行中回车 - 完成
			 * 4. 粘贴代码
			 * 5. 撤销代码
			 *
			 * 需要针对这上述情况对断点进行重新渲染，预期效果参考 vscode
			 */

			if (model && isLineCountChanged) {
				for (let decoration of decorations) {
					const curRange = decoration.range;
					const preRange = this.decorationIdAndRangeMap.get(decoration.id);

					if (!isUndoing) {
						if (curRange.startLineNumber === curRange.endLineNumber) {
							this.replaceSpecifyLineNumberAndIdMap(curRange, decoration);
						} else if (preRange) {
							// range.endColumn always === lineLength + 1
							const preLineLength = model.getLineLength(preRange.startLineNumber) + 1;
							const lineBreakInHead = preLineLength === 1;

							this.removeSpecifyDecoration(decoration.id, preRange.startLineNumber);
							this.createSpecifyDecoration({
								...curRange,
								...(lineBreakInHead ? {
									startLineNumber: curRange.endLineNumber,
									endColumn: model.getLineLength(curRange.endLineNumber) + 1
								} : {
									endLineNumber: curRange.startLineNumber,
									endColumn: model.getLineLength(curRange.startLineNumber) + 1
								})
							});
						}
					} else if (curRange.startLineNumber === curRange.endLineNumber) {
						this.replaceSpecifyLineNumberAndIdMap(curRange, decoration);
					}
				}
			} else {
				// if there is no line break, update the latest decoration range
				for (let decoration of decorations) {
					this.decorationIdAndRangeMap.set(decoration.id, decoration.range);
				}
			}
		});
	}

	private getModel() {
		return this.editor?.getModel();
	}

	private getLineCount() {
		return this.getModel()?.getLineCount() ?? 0;
	}

	private getLineDecoration(lineNumber: number) {
		return (
			this.getModel()
				?.getLineDecorations(lineNumber)
				?.filter(
					(decoration) =>
						decoration.options.glyphMarginClassName ===
						BREAKPOINT_OPTIONS.glyphMarginClassName
				)?.[0] ?? null
		);
	}

	private getAllDecorations() {
		return (
			this.getModel()
				?.getAllMarginDecorations()
				?.filter(
					(decoration) =>
						decoration.options.glyphMarginClassName ===
						BREAKPOINT_OPTIONS.glyphMarginClassName
				) ?? []
		);
	}

	private removeHoverDecoration() {
		const model = this.getModel();

		if (model && this.hoverDecorationId) {
			model.deltaDecorations([this.hoverDecorationId], []);
			this.hoverDecorationId = '';
		}
	}

	private removeAllDecorations() {
		const decorationsId = [];
		const model = this.getModel();

		for (let [_, decorationId] of this.lineNumberAndDecorationIdMap) {
			decorationsId.push(decorationId);
		}

		// clear all rendered breakpoint decoration
		model?.deltaDecorations(decorationsId, []);
		this.removeHoverDecoration();
	}

	private removeSpecifyDecoration(decorationId: string, lineNumber: number) {
		this.editor?.removeDecorations([decorationId]);
		this.decorationIdAndRangeMap.delete(decorationId);
		this.lineNumberAndDecorationIdMap.delete(lineNumber);
	}

	private createSpecifyDecoration(range: Range) {
		const model = this.getModel();

		if (model) {
			/**
			 * If no breakpoint exists on the current line,
			 * it indicates that the current action is to add a breakpoint.
			 * create breakpoint decoration
			 */
			const newDecoration = createBreakpointDecoration(
				range,
				BreakpointEnum.Exist
			);
			// render decoration
			const newDecorationId = model.deltaDecorations(
				[],
				[newDecoration]
			)[0];

			// record the new breakpoint decoration id
			this.lineNumberAndDecorationIdMap.set(
				range.endLineNumber,
				newDecorationId
			);

			// record the new decoration
			const decoration = this.getLineDecoration(range.endLineNumber);

			if (decoration) {
				this.decorationIdAndRangeMap.set(newDecorationId, decoration.range);
			}
		}
	}

	private replaceSpecifyLineNumberAndIdMap(curRange: Range, decoration: ModelDecoration) {
		this.decorationIdAndRangeMap.set(decoration.id, decoration.range);

		for (let [lineNumber, decorationId] of this.lineNumberAndDecorationIdMap) {
			if (decorationId === decoration.id) {
				this.lineNumberAndDecorationIdMap.delete(lineNumber);
				break;
			}
		}

		this.lineNumberAndDecorationIdMap.set(curRange.startLineNumber, decoration.id);
	}

	dispose() {
		this.editor = null;
		this.removeAllDecorations();

		this.mouseMoveDisposable?.dispose();
		this.mouseDownDisposable?.dispose();
		this.contentChangedDisposable?.dispose();

		this.decorationIdAndRangeMap.clear();
		this.lineNumberAndDecorationIdMap.clear();
	}
}
