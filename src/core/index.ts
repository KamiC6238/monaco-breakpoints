import {
	Range,
	Handler,
	Position,
	Disposable,
	MonacoEditor,
	BreakpointEnum,
	ModelDecoration,
	EditorMouseEvent,
	BreakpointEvents,
	EditorMouseTarget,
	ModelDeltaDecoration,
	MonacoBreakpointProps,
	CursorPositionChangedEvent,
  HoverMessage
} from '../types';

import {
	MouseTargetType,
	CursorChangeReason,
	HIGHLIGHT_OPTIONS,
	BREAKPOINT_OPTIONS,
	BREAKPOINT_HOVER_OPTIONS
} from '@/config';

import { EventEmitter } from '@/eventEmitter';
import '@/style/index.css';

export default class MonacoBreakpoint {
	private preLineCount = 0;
	private hoverDecorationId = '';
	private highlightDecorationId = '';
	private editor: MonacoEditor | null = null;
	private eventEmitter = new EventEmitter();
	
	private isUndoing = false;
	private isLineCountChanged = false;
	private lineContent: string | null = null;

	private mouseMoveDisposable: Disposable | null = null;
	private mouseDownDisposable: Disposable | null = null;
	private contentChangedDisposable: Disposable | null = null;
	private cursorPositionChangedDisposable: Disposable | null = null;

	private decorationIdAndRangeMap = new Map<string, Range>();
	private lineNumberAndDecorationIdMap = new Map<number, string>();

  private hoverMessage: HoverMessage | null = null

	constructor(params: MonacoBreakpointProps) {
		if (!params?.editor) {
			throw new Error("Missing 'editor' parameter");
		}

		const { editor, hoverMessage = null } = params;

		this.editor = editor;
    this.hoverMessage = hoverMessage
		this.initMouseEvent();
		this.initEditorEvent();
	}

	private initMouseEvent() {
		this.mouseMoveDisposable?.dispose();
		this.mouseMoveDisposable = this.editor!.onMouseMove(
			(e: EditorMouseEvent) => {
				const model = this.getModel();
				const { range, detail, type, position } = this.getMouseEventTarget(e);

				// This indicates that the current position of the mouse is over the total number of lines in the editor
				if (detail?.isAfterLines) {
					this.removeHoverDecoration();
					return;
				}

				if (model && type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
					// remove previous hover breakpoint decoration
					this.removeHoverDecoration();

          if (this.checkIfBreakpointExistInLine(position.lineNumber)) {
            return
          }

					// create new hover breakpoint decoration
					const newDecoration = this.createBreakpointDecoration(
						range,
						BreakpointEnum.Hover
					);
					// render decoration
					const decorationIds = model.deltaDecorations(
						[],
						[
              {
                range: newDecoration.range,
                options: {
                  ...newDecoration.options,
                  glyphMarginHoverMessage: this.hoverMessage?.unAdded ?? null
                }
              }
            ]
					);
					// record the hover decoraion id
					this.hoverDecorationId = decorationIds[0];
				} else {
					this.removeHoverDecoration();
				}
			}
		);

		this.mouseDownDisposable?.dispose();
		this.mouseDownDisposable = this.editor!.onMouseDown(
			(e: EditorMouseEvent) => {
				const model = this.getModel();
				const { type, range, detail, position } = this.getMouseEventTarget(e);

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

		// Execute onDidChangeModelContent callback first
		this.contentChangedDisposable?.dispose();
		this.contentChangedDisposable = this.editor!.onDidChangeModelContent((e) => {
			const curLineCount = this.getLineCount();

			this.isUndoing = e.isUndoing;
			this.isLineCountChanged = curLineCount !== this.preLineCount;
			this.preLineCount = curLineCount;
		});

		// Execute onDidChangeCursorPosition callback second
		this.cursorPositionChangedDisposable?.dispose();
		this.cursorPositionChangedDisposable = this.editor!.onDidChangeCursorPosition(e => {
			const model = this.getModel();
			const decorations = this.getAllDecorations();

			if (model && this.isLineCountChanged) {
				for (let decoration of decorations) {
					const curRange = decoration.range;
					const preRange = this.decorationIdAndRangeMap.get(decoration.id);

					const isPaste = e.reason === CursorChangeReason.Paste;
					// vscode breakpoint logic
					const needRenderDecorationInEndLineNumber =
						!isPaste &&
						this.isUndoing &&
						curRange.startLineNumber !== curRange.endLineNumber

					if (!this.isUndoing || needRenderDecorationInEndLineNumber) {
						/**
						 * if startLineNumber equals to endLineNumber,
						 * only need to update the record map (decorationIdAndRangeMap & lineNumberAndDecorationIdMap)
						 */
						if (curRange.startLineNumber === curRange.endLineNumber) {
							this.replaceSpecifyLineNumberAndIdMap(curRange, decoration);
						} else if (preRange) {
							const lineBreakInHead = this.checkIfLineBreakInHead(e, curRange, preRange);

							// remove old decoration before re render the new breakpoint decoration
							this.removeSpecifyDecoration(decoration.id, preRange.startLineNumber);
							/**
							 * if line break in head, render the breakpoint decoration in endLineNumber,
							 * if current line has breakpoint decoration & isUndoing & not paste & cur startLineNumber & cur endLineNumber
							 * else render in startLineNumber
							 */
							this.createSpecifyDecoration({
								...curRange,
								...(lineBreakInHead || needRenderDecorationInEndLineNumber ? {
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
				/**
				 * there is no line break and startLineNumber equals to endLineNumber,
				 * only need to update the record map (decorationIdAndRangeMap & lineNumberAndDecorationIdMap)
				 */
				for (let decoration of decorations) {
					this.decorationIdAndRangeMap.set(decoration.id, decoration.range);
				}
			}

			/**
			 * remove extra decoration which not in
			 */
			this.removeExtraDecoration();

			/**
			 * reset isUndoing && isLineCountChanged status
			 */
			this.isUndoing = false;
			this.isLineCountChanged = false;
			/**
			 * In order to judge that the change of the code starts from the beginning of the line,
			 * record the text of the line where the current cursor is located
			 */
			this.lineContent = this.getLineContentAtPosition(e.position);
		});
	}

	private getModel() {
		return this.editor?.getModel();
	}

	private getLineCount() {
		return this.getModel()?.getLineCount() ?? 0;
	}

	private getMouseEventTarget(e: EditorMouseEvent) {
		return { ...(e.target as EditorMouseTarget) };
	}

	private getBreankpointDecorationInLine(lineNumber: number) {
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
		}
		this.hoverDecorationId = '';
	}

	private removeHighlightDecoration() {
		const model = this.getModel();

		if (model && this.highlightDecorationId) {
			model.deltaDecorations([this.highlightDecorationId], []);
		}
		this.highlightDecorationId = '';
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

	/**
	 * Remove extra decoration after re render new breakpoint decoration,
	 * The purpose is to synchronize with decorationIdAndRangeMap & lineNumberAndDecorationIdMap
	 */
	private removeExtraDecoration() {
		const model = this.getModel();
		const decorations = this.getAllDecorations();

		for (let decoration of decorations) {
			if (!this.decorationIdAndRangeMap.has(decoration.id)) {
				model?.deltaDecorations([decoration.id], []);
			}
		}
	}

	private removeSpecifyDecoration(decorationId: string, lineNumber: number) {
		const model = this.getModel();
		model?.deltaDecorations([decorationId], []);
		this.decorationIdAndRangeMap.delete(decorationId);
		this.lineNumberAndDecorationIdMap.delete(lineNumber);
		this.emitBreakpointChanged();
	}

	private createSpecifyDecoration(range: Range) {
		const model = this.getModel();

		if (model) {
			/**
			 * If no breakpoint exists on the current line,
			 * it indicates that the current action is to add a breakpoint.
			 * create breakpoint decoration
			 */
			const newDecoration = this.createBreakpointDecoration(
				range,
				BreakpointEnum.Exist
			);
			// render decoration
			const newDecorationId = model.deltaDecorations(
				[],
				[
          {
            range: { ...newDecoration.range },
            options: {
              ...newDecoration.options,
              glyphMarginHoverMessage: this.hoverMessage?.added ?? null
            }
          }
        ]
			)[0];

			// record the new breakpoint decoration id
			this.lineNumberAndDecorationIdMap.set(
				range.endLineNumber,
				newDecorationId
			);
			this.emitBreakpointChanged();

			// record the new decoration
			const decoration = this.getBreankpointDecorationInLine(range.endLineNumber);

			if (decoration) {
				this.decorationIdAndRangeMap.set(newDecorationId, decoration.range);
			}
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

	private replaceSpecifyLineNumberAndIdMap(curRange: Range, decoration: ModelDecoration) {
		for (let [decorationId, range] of this.decorationIdAndRangeMap) {
			// remove duplicated range in map
			if (JSON.stringify(range) === JSON.stringify(decoration.range)) {
				this.decorationIdAndRangeMap.delete(decorationId);
				break;
			}
		}
		
		this.decorationIdAndRangeMap.set(decoration.id, decoration.range);

		for (let [lineNumber, decorationId] of this.lineNumberAndDecorationIdMap) {
			// remove duplicated range in map
			if (decorationId === decoration.id) {
				this.lineNumberAndDecorationIdMap.delete(lineNumber);
				break;
			}
		}

		this.lineNumberAndDecorationIdMap.set(curRange.startLineNumber, decoration.id);
		this.emitBreakpointChanged();
	}

	/**
	 * 
	 * @param position monaco.IPosition
	 * @param needFullContent if set true, return the full line content from column 1
	 * @returns 
	 */
	private getLineContentAtPosition(position: Position, needFullContent: boolean = true) {
		const model = this.getModel();

		if (model) {
			const { lineNumber, column } = position;

			return model.getValueInRange({
				startLineNumber: lineNumber,
				endLineNumber: lineNumber,
				startColumn: needFullContent ? 1 : column,
				endColumn: model.getLineLength(lineNumber) + 1
			}).trim();
		}
		return '';
	}

	/**
	 * @description when decoration changed, check if line break in head.
	 * @returns Boolean
	 */
	private checkIfLineBreakInHead(e: CursorPositionChangedEvent, curRange: Range, preRange: Range) {
		const { reason, position } = e;
		const isPaste = reason === CursorChangeReason.Paste;
		const lineContent = this.getLineContentAtPosition(position, false);

		let lineBreakInHead =
			!isPaste && 
			preRange.endColumn === curRange.endColumn &&
			preRange.startColumn === curRange.startColumn &&
			preRange.endLineNumber !== curRange.endLineNumber &&
			preRange.startLineNumber === curRange.startLineNumber;

		/**
		 * if pasted and lineContent in current cursor position equals to this.lineContent (preLineContent),
		 * indicate paste in pre lineContent head.
		 */
		if (isPaste && lineContent === this.lineContent) {
			lineBreakInHead = true;
		}

		return lineBreakInHead;
	}

  private checkIfBreakpointExistInLine(lineNumber: number) {
    const decorationInLine = this.getBreankpointDecorationInLine(lineNumber)
    const decorationIdInLine = this.lineNumberAndDecorationIdMap.get(lineNumber)

    return (
      decorationInLine &&
      decorationIdInLine &&
      decorationInLine.id === decorationIdInLine
    )
  }

	private emit<T extends keyof BreakpointEvents>(event: T, data: BreakpointEvents[T]) {
		this.eventEmitter.emit(event, data);
	}

	private emitBreakpointChanged() {
		this.emit('breakpointChanged', this.getBreakpoints());
	}

	on<T extends keyof BreakpointEvents>(event: T, handler: Handler<BreakpointEvents[T]>) {
		this.eventEmitter.on(event, handler);
	}

	off<T extends keyof BreakpointEvents>(event: T, handler: Handler<BreakpointEvents[T]>) {
		this.eventEmitter.off(event, handler);
	}

	/**
	 * @description set background highlight for lineNumber
	 * @param lineNumber 
	 */
	setLineHighlight(lineNumber: number) {
		const model = this.getModel();

		if (model) {
			if (model.getLineCount() < lineNumber) {
				throw Error('The lineNumber is greater than the total lineNumber');
			}

			this.removeHighlightDecoration();

			const decorationIds = model.deltaDecorations([], [{
				options: HIGHLIGHT_OPTIONS,
				range: {
					startLineNumber: lineNumber,
					startColumn: 1,
					endLineNumber: lineNumber,
					endColumn: 1
				}
			}]);

			this.highlightDecorationId = decorationIds[0];
		}
	}

	/**
	 * @description remove the exist highlight line
	 */
	removeHighlight() {
		this.removeHighlightDecoration();
	}

	/**
	 * @returns The set of line numbers where the breakpoint is located
	 */
	getBreakpoints() {
		const breakpoints: number[] = [];

		for (let [lineNumber, _] of this.lineNumberAndDecorationIdMap) {
			breakpoints.push(lineNumber);
		}
		return breakpoints;
	}

	/**
	 * @returns Remove all breakpoints
	 */
	clearBreakpoints() {
		this.removeAllDecorations();
		this.decorationIdAndRangeMap.clear();
		this.lineNumberAndDecorationIdMap.clear();
	}

	dispose() {
		this.editor = null;
		this.preLineCount = 0;
		this.isUndoing = false;
		this.isLineCountChanged = false;

		this.removeAllDecorations();
		this.removeHoverDecoration();
		this.removeHighlightDecoration();

		this.mouseMoveDisposable?.dispose();
		this.mouseDownDisposable?.dispose();
		this.contentChangedDisposable?.dispose();
		this.cursorPositionChangedDisposable?.dispose();

		this.decorationIdAndRangeMap.clear();
		this.lineNumberAndDecorationIdMap.clear();
	}
}
