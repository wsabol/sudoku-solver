import { cloneBoard, assertBoardShape, parseBoardString, duplicateValues, boxNumber } from "./utils.js";
import { ValidationReason, ValidationResult, pushUniqueReason } from "./validate.js";
import type { Board } from "./boardGeo.js";
import type { Move, PlacementMove, EliminationMove } from "./move.js";

export type Algorithm =
    | "Last Digit"
    | "Full House"
    | "Naked Single"
    | "Hidden Single"
    | "Pointing Pair"
    | "Pointing Triple"
    | "X-Wing"
    | "XY-Wing"
    | "Swordfish"
    | "Naked Pair"
    | "Naked Triple"
    | "Naked Quad"
    | "Hidden Pair"
    | "Hidden Triple"
    | "Hidden Quad";

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Diabolical" | "Impossible";

export type ValidationReasonType =
    | "duplicate_in_row"
    | "duplicate_in_column"
    | "duplicate_in_box"
    | "invalid_value"
    | "invalid_board_length"
    | "invalid_board_characters"
    | "empty_cell_no_candidates"
    | "too_many_empty_cells";

/** Drives `findBestMove` order; not the same as `Move.algorithm` (specific technique on the move). */
type SearchPhase =
    | "NakedSingle"
    | "HiddenSingle"
    | "Pointing"
    | "NakedSubset"
    | "HiddenSubset"
    | "Fish"
    | "XYWing"
    | "Swordfish"
    | "NakedHiddenQuads";

const COMPLETE = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Row/column/box label for a set of cells that all lie in one house. */
type HouseKind = "row" | "column" | "box";

function uniqueCellCoordinates(items: ReadonlyArray<{ row: number; col: number }>): { row: number; col: number }[] {
    const seen = new Set<string>();
    const out: { row: number; col: number }[] = [];
    for (const { row, col } of items) {
        const k = `${row},${col}`;
        if (!seen.has(k)) {
            seen.add(k);
            out.push({ row, col });
        }
    }
    return out;
}

/**
 * If every cell lies in the same row, same column, or same 3×3 box, return that house.
 * Row wins over column when both apply (e.g. a single cell). Otherwise `null`.
 */
function sharedHouseContainingCells(
    cells: ReadonlyArray<{ row: number; col: number }>
): { kind: HouseKind; wherePhrase: string } | null {
    if (cells.length === 0) {
        return null;
    }
    const first = cells[0]!;
    if (cells.every((c) => c.row === first.row)) {
        return { kind: "row", wherePhrase: `row ${first.row + 1}` };
    }
    if (cells.every((c) => c.col === first.col)) {
        return { kind: "column", wherePhrase: `column ${first.col + 1}` };
    }
    const box = boxNumber(first.row, first.col);
    if (cells.every((c) => boxNumber(c.row, c.col) === box)) {
        return { kind: "box", wherePhrase: `box ${box}` };
    }
    return null;
}

export default class SudokuSolver {
    private static readonly SEARCH_PHASES: SearchPhase[] = [
        "NakedSingle",
        "HiddenSingle",
        "Pointing",
        "NakedSubset",
        "HiddenSubset",
        "Fish",
        "XYWing",
        "Swordfish",
        "NakedHiddenQuads",
    ];

    private board: Board;
    private possiblesGrid: number[][][];

    constructor(input: string | Board) {
        this.board = [];
        this.possiblesGrid = [];
        let inputBoard = typeof input === "string" ? parseBoardString(input) : cloneBoard(input);
        this.setBoard(inputBoard);
    }

    setBoard(board: Board): void {
        this.board = cloneBoard(board);
        assertBoardShape(this.board);
        this.possiblesGrid = Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () => [] as number[])
        );
        this.calcPossibles();
    }

    toArray(): Board {
        return cloneBoard(this.board);
    }

    getPossibles(row: number, col: number): number[] {
        return [...this.possiblesGrid[row][col]];
    }

    setPossibles(row: number, col: number, possibles: number[]): void {
        this.possiblesGrid[row][col] = possibles.filter((v) => v > 0 && v <= 9).sort((a, b) => a - b);
    }

    setSquareValue(row: number, col: number, value: number): void {
        this.board[row][col] = value;
        this.possiblesGrid[row][col] = [];
        const ibox = this.boxIndex(row, col);
        const startRow = Math.floor(ibox / 3) * 3;
        const startCol = (ibox % 3) * 3;
        for (let c = 0; c < 9; c++) {
            this.possiblesGrid[row][c] = this.possiblesGrid[row][c].filter((v) => v !== value);
        }
        for (let r = 0; r < 9; r++) {
            this.possiblesGrid[r][col] = this.possiblesGrid[r][col].filter((v) => v !== value);
        }
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                this.possiblesGrid[r][c] = this.possiblesGrid[r][c].filter((v) => v !== value);
            }
        }
    }

    applyElimination(move: EliminationMove): void {
        for (const { row, col, value } of move.eliminations) {
            this.possiblesGrid[row][col] = this.possiblesGrid[row][col].filter((v) => v !== value);
        }
    }

    applyMove(move: Move): void {
        if (move.type === "placement") {
            this.setSquareValue(move.row, move.col, move.value);
        } else {
            this.applyElimination(move);
        }
    }

    isComplete(): boolean {
        return this.board.every((row) => row.every((v) => v !== 0));
    }

    countEmptyCells(): number {
        return this.board.flat().filter((v) => v === 0).length;
    }

    countPlaced(value: number = 0): number {
        if (value === 0) {
            return 81 - this.countEmptyCells(); // total cells - empty cells
        }
        return this.board.flat().filter((v) => v === value).length;
    }

    validate(): ValidationResult {
        const reasons: ValidationReason[] = [];

        if (this.board.length !== 9 || this.board.some((row) => row.length !== 9)) {
            reasons.push({
                type: "invalid_board_length",
                detail: "Board must be a 9x9 matrix",
            });
            return { isValid: false, message: reasons[0].detail, reasons };
        }

        if (this.countEmptyCells() > 64) {
            reasons.push({
                type: "too_many_empty_cells",
                detail: "Board has too many empty cells, normal Sudoku must have at least 17 given values",
            });
        }

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = this.board[row][col];
                if (!Number.isInteger(value) || value < 0 || value > 9) {
                    pushUniqueReason(reasons, {
                        type: "invalid_value",
                        detail: `Invalid value ${value} at row ${row}, col ${col}`,
                        row,
                        col,
                        value,
                    });
                }
            }
        }

        for (let row = 0; row < 9; row++) {
            for (const value of duplicateValues(this.board[row])) {
                pushUniqueReason(reasons, {
                    type: "duplicate_in_row",
                    detail: `Duplicate value ${value} in row ${row}`,
                    row,
                    value,
                });
            }
        }

        for (let col = 0; col < 9; col++) {
            const colVals = this.board.map((row) => row[col]);
            for (const value of duplicateValues(colVals)) {
                pushUniqueReason(reasons, {
                    type: "duplicate_in_column",
                    detail: `Duplicate value ${value} in column ${col}`,
                    col,
                    value,
                });
            }
        }

        for (let box = 0; box < 9; box++) {
            const startRow = Math.floor(box / 3) * 3;
            const startCol = (box % 3) * 3;
            const values: number[] = [];
            for (let row = startRow; row < startRow + 3; row++) {
                for (let col = startCol; col < startCol + 3; col++) {
                    values.push(this.board[row][col]);
                }
            }
            for (const value of duplicateValues(values)) {
                pushUniqueReason(reasons, {
                    type: "duplicate_in_box",
                    detail: `Duplicate value ${value} in box ${box}`,
                    box,
                    value,
                });
            }
        }

        if (reasons.length === 0) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (this.board[row][col] === 0 && this.possiblesGrid[row][col].length === 0) {
                        pushUniqueReason(reasons, {
                            type: "empty_cell_no_candidates",
                            detail: `Empty cell at row ${row}, col ${col} has no valid candidates`,
                            row,
                            col,
                        });
                    }
                }
            }
        }

        return {
            isValid: reasons.length === 0,
            message: reasons[0]?.detail ?? "Valid",
            reasons,
        };
    }

    isValid(): boolean {
        const result = this.validate();
        return result.isValid;
    }

    difficulty(): DifficultyLevel {
        const emptyCells = this.countEmptyCells();
        if (emptyCells <= 17) {
            return "Easy";
        }
        if (emptyCells <= 30) {
            return "Medium";
        }
        if (emptyCells <= 40) {
            return "Hard";
        }
        if (emptyCells <= 55) {
            return "Diabolical";
        }
        return "Impossible";
    }

    getNextMove(): Move | null {
        if (this.isComplete() || !this.isValid()) {
            return null;
        }
        return this.findBestMove();
    }

    solve(): boolean {
        if (!this.isValid()) {
            return false;
        }

        let move = this.findBestMove();
        while (move) {
            this.applyMove(move);
            move = this.findBestMove();
        }

        return this.isComplete();
    }

    private boxIndex(row: number, col: number): number {
        return Math.floor(row / 3) * 3 + Math.floor(col / 3);
    }

    private boxToPuzzle(ibox: number, idx: number): { row: number; col: number } {
        return {
            row: Math.floor(ibox / 3) * 3 + Math.floor(idx / 3),
            col: (ibox % 3) * 3 + (idx % 3),
        };
    }

    private getRow(row: number): number[] {
        return [...this.board[row]];
    }

    private getColumn(col: number): number[] {
        return this.board.map((row) => row[col]);
    }

    private getBox(ibox: number): number[] {
        const startRow = Math.floor(ibox / 3) * 3;
        const startCol = (ibox % 3) * 3;
        const out: number[] = [];
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                out.push(this.board[r][c]);
            }
        }
        return out;
    }

    private valuesMissing(values: number[]): number[] {
        return COMPLETE.filter((n) => !values.includes(n));
    }

    private calcSquarePossibles(row: number, col: number): number[] {
        if (this.board[row][col] > 0) {
            return [];
        }
        const rowPossible = this.valuesMissing(this.getRow(row));
        const colPossible = this.valuesMissing(this.getColumn(col));
        const boxPossible = this.valuesMissing(this.getBox(this.boxIndex(row, col)));
        return rowPossible.filter((n) => colPossible.includes(n) && boxPossible.includes(n));
    }

    private calcPossibles(): void {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                this.possiblesGrid[r][c] = this.calcSquarePossibles(r, c);
            }
        }
    }

    private finalizePlacement(
        row: number,
        col: number,
        value: number,
        algorithm: Algorithm,
        reasoning: string
    ): PlacementMove {
        return {
            type: "placement",
            row,
            col,
            value,
            algorithm,
            message: `Place ${value} in r${row + 1}c${col + 1} (${algorithm})`,
            reasoning,
        };
    }

    private finalizeElimination(
        eliminations: Array<{ row: number; col: number; value: number }>,
        algorithm: Algorithm,
        reasoning: string
    ): EliminationMove {
        const digits = [...new Set(eliminations.map((e) => e.value))].sort((a, b) => a - b);
        const digitPart = digits.length === 1 ? String(digits[0]) : `${digits.join("/")}`;
        const uniqueCells = uniqueCellCoordinates(eliminations);
        const uniqueCellCount = uniqueCells.length;
        const cellWord = uniqueCellCount === 1 ? "cell" : "cells";
        const housePhrase = sharedHouseContainingCells(uniqueCells)?.wherePhrase;
        const wherePart = housePhrase ? ` in ${housePhrase}` : "";
        return {
            type: "elimination",
            eliminations,
            algorithm,
            message: `Eliminate ${digitPart} from ${uniqueCellCount} ${cellWord}${wherePart} (${algorithm})`,
            reasoning,
        };
    }

    private findBestMove(): Move | null {
        for (const phase of SudokuSolver.SEARCH_PHASES) {
            const move = this.findMoveForPhase(phase);
            if (move) return move;
        }
        return null;
    }

    private findMoveForPhase(phase: SearchPhase): Move | null {
        switch (phase) {
            case "NakedSingle":
                return this.findNakedSingle();
            case "HiddenSingle":
                return this.findHiddenSingle();
            case "Pointing":
                return this.findPointingPairTriple();
            case "Fish":
                return this.findFishOfSize(2);
            case "XYWing":
                return this.findXYWing();
            case "Swordfish":
                return this.findFishOfSize(3);
            case "NakedSubset":
                return this.findNakedSubsetElimination();
            case "HiddenSubset":
                return this.findHiddenSubsetElimination();
            case "NakedHiddenQuads":
                return this.findNakedHiddenQuadsElimination();
            default:
                return null;
        }
    }

    private findNakedSingle(): PlacementMove | null {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    const p = this.possiblesGrid[row][col];
                    if (p.length === 1) {
                        const placeValue = p[0];
                        let algo = "Naked Single" as Algorithm;
                        let house = '' as string;

                        // check if full house
                        const rowValues = this.getRow(row);
                        if (rowValues.filter((v) => v === 0).length === 1) {
                            algo = "Full House";
                            house = `row ${row + 1}`;
                        }
                        const colValues = this.getColumn(col);
                        if (colValues.filter((v) => v === 0).length === 1) {
                            algo = "Full House";
                            house = `column ${col + 1}`;
                        }
                        const boxValues = this.getBox(this.boxIndex(row, col));
                        if (boxValues.filter((v) => v === 0).length === 1) {
                            algo = "Full House";
                            house = `box ${boxNumber(row, col)}`;
                        }

                        let reasoning: string;
                        if (algo === "Full House") {
                            reasoning = `This is the last empty cell in ${house} and must be ${placeValue}.`;
                        } else {
                            if (this.countPlaced(placeValue) === 8) {
                                algo = "Last Digit";
                                reasoning = this.lastDigitReasoning(placeValue);
                            } else {
                                reasoning = `${placeValue} is the only remaining candidate for this cell.`;
                            }
                        }

                        return this.finalizePlacement(row, col, placeValue, algo, reasoning);
                    }
                }
            }
        }
        return null;
    }

    private hiddenSingleReasoning(house: string, value: number): string {
        return `This is the only empty cell in ${house} that can be a ${value}.`;
    }

    private lastDigitReasoning(value: number): string {
        return `Eight cells already contain ${value}, so the 9th occurrence must be placed here.`;
    }

    private findHiddenSingleInRow(row: number): PlacementMove | null {
        for (let value = 1; value <= 9; value++) {
            const candidates: number[] = [];
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0 && this.possiblesGrid[row][col].includes(value)) {
                    candidates.push(col);
                }
            }
            if (candidates.length === 1) {
                const col = candidates[0];
                let algorithm: Algorithm = "Hidden Single";
                let reasoning = this.hiddenSingleReasoning(`row ${row + 1}`, value);
                if (this.countPlaced(value) === 8) {
                    algorithm = "Last Digit";
                    reasoning = this.lastDigitReasoning(value);
                }
                return this.finalizePlacement(row, col, value, algorithm, reasoning);
            }
        }
        return null;
    }

    private findHiddenSingleInCol(col: number): PlacementMove | null {
        for (let value = 1; value <= 9; value++) {
            const candidates: number[] = [];
            for (let row = 0; row < 9; row++) {
                if (this.board[row][col] === 0 && this.possiblesGrid[row][col].includes(value)) {
                    candidates.push(row);
                }
            }
            if (candidates.length === 1) {
                const row = candidates[0];
                let algorithm: Algorithm = "Hidden Single";
                let reasoning = this.hiddenSingleReasoning(`column ${col + 1}`, value);
                if (this.countPlaced(value) === 8) {
                    algorithm = "Last Digit";
                    reasoning = this.lastDigitReasoning(value);
                }
                return this.finalizePlacement(row, col, value, algorithm, reasoning);
            }
        }
        return null;
    }

    private findHiddenSingleInBox(ibox: number): PlacementMove | null {
        for (let value = 1; value <= 9; value++) {
            const candidates: Array<{ row: number; col: number }> = [];
            for (let idx = 0; idx < 9; idx++) {
                const { row, col } = this.boxToPuzzle(ibox, idx);
                if (this.board[row][col] === 0 && this.possiblesGrid[row][col].includes(value)) {
                    candidates.push({ row, col });
                }
            }
            if (candidates.length === 1) {
                const { row: r, col: c } = candidates[0];
                let algorithm: Algorithm = "Hidden Single";
                let reasoning = this.hiddenSingleReasoning(`box ${boxNumber(r, c)}`, value);
                if (this.countPlaced(value) === 8) {
                    algorithm = "Last Digit";
                    reasoning = this.lastDigitReasoning(value);
                }
                return this.finalizePlacement(r, c, value, algorithm, reasoning);
            }
        }
        return null;
    }

    private findPointingPairTriple(): EliminationMove | null {
        for (let ibox = 0; ibox < 9; ibox++) {
            const boxStartRow = Math.floor(ibox / 3) * 3;
            const boxStartCol = (ibox % 3) * 3;
            const boxNum = ibox + 1;
            for (let digit = 1; digit <= 9; digit++) {
                const cells: Array<{ row: number; col: number }> = [];
                for (let idx = 0; idx < 9; idx++) {
                    const { row, col } = this.boxToPuzzle(ibox, idx);
                    if (this.board[row][col] === 0 && this.possiblesGrid[row][col].includes(digit)) {
                        cells.push({ row, col });
                    }
                }
                if (cells.length < 2) continue;

                if (cells.every((c) => c.row === cells[0].row)) {
                    const sharedRow = cells[0].row;
                    const eliminations: Array<{ row: number; col: number; value: number }> = [];
                    for (let c = 0; c < 9; c++) {
                        if (c < boxStartCol || c >= boxStartCol + 3) {
                            if (this.board[sharedRow][c] === 0 && this.possiblesGrid[sharedRow][c].includes(digit)) {
                                eliminations.push({ row: sharedRow, col: c, value: digit });
                            }
                        }
                    }
                    if (eliminations.length > 0) {
                        const algorithm = cells.length === 2 ? "Pointing Pair" : "Pointing Triple";
                        const reasoning = `In box ${boxNum}, every candidate for ${digit} lies in row ${sharedRow + 1}, so ${digit} cannot appear elsewhere in that row outside the box.`;
                        return this.finalizeElimination(eliminations, algorithm, reasoning);
                    }
                }

                if (cells.every((c) => c.col === cells[0].col)) {
                    const sharedCol = cells[0].col;
                    const eliminations: Array<{ row: number; col: number; value: number }> = [];
                    for (let r = 0; r < 9; r++) {
                        if (r < boxStartRow || r >= boxStartRow + 3) {
                            if (this.board[r][sharedCol] === 0 && this.possiblesGrid[r][sharedCol].includes(digit)) {
                                eliminations.push({ row: r, col: sharedCol, value: digit });
                            }
                        }
                    }
                    if (eliminations.length > 0) {
                        const algorithm = cells.length === 2 ? "Pointing Pair" : "Pointing Triple";
                        const reasoning = `In box ${boxNum}, every candidate for ${digit} lies in column ${sharedCol + 1}, so ${digit} cannot appear elsewhere in that column outside the box.`;
                        return this.finalizeElimination(eliminations, algorithm, reasoning);
                    }
                }
            }
        }
        return null;
    }

    /**
     * Cover indices for a base line: column indices when scanning by row, row indices when scanning by column.
     * Returns only empty cells where `digit` is still a candidate.
     */
    private coverIndicesForLine(lineIdx: number, digit: number, byRow: boolean): number[] {
        const result: number[] = [];
        for (let crossIdx = 0; crossIdx < 9; crossIdx++) {
            const [row, col] = byRow ? [lineIdx, crossIdx] : [crossIdx, lineIdx];
            if (this.board[row][col] === 0 && this.possiblesGrid[row][col].includes(digit)) {
                result.push(crossIdx);
            }
        }
        return result;
    }

    /**
     * Generic N-fish detector (X-Wing = 2, Swordfish = 3).
     * Finds `fishSize` base lines whose candidates for a digit span exactly `fishSize` cover lines,
     * then eliminates that digit from those cover lines outside the base lines.
     * Checks row-based orientation first, then column-based.
     */
    private findFishOfSize(fishSize: 2 | 3): EliminationMove | null {
        const algorithm: Algorithm = fishSize === 2 ? "X-Wing" : "Swordfish";

        for (const byRow of [true, false]) {
            const baseLabel = byRow ? "rows" : "columns";
            const coverLabel = byRow ? "columns" : "rows";

            for (let digit = 1; digit <= 9; digit++) {
                const eligible: { lineIdx: number; cover: number[] }[] = [];
                for (let lineIdx = 0; lineIdx < 9; lineIdx++) {
                    const cover = this.coverIndicesForLine(lineIdx, digit, byRow);
                    if (cover.length >= 2 && cover.length <= fishSize) {
                        eligible.push({ lineIdx, cover });
                    }
                }

                // Iterate all C(eligible, fishSize) combinations.
                for (let i = 0; i < eligible.length - (fishSize - 1); i++) {
                    for (let j = i + 1; j < eligible.length - (fishSize - 2); j++) {
                        const pairs = fishSize === 2
                            ? [[eligible[i]!, eligible[j]!]]
                            : Array.from({ length: eligible.length - j - 1 }, (_, d) => [eligible[i]!, eligible[j]!, eligible[j + 1 + d]!]);

                        for (const combo of pairs) {
                            const unionCover = [...new Set(combo.flatMap((e) => e.cover))].sort((a, b) => a - b);
                            if (unionCover.length !== fishSize) continue;

                            const baseIndices = combo.map((e) => e.lineIdx);
                            const eliminations: Array<{ row: number; col: number; value: number }> = [];
                            for (const coverIdx of unionCover) {
                                for (let otherLineIdx = 0; otherLineIdx < 9; otherLineIdx++) {
                                    if (baseIndices.includes(otherLineIdx)) continue;
                                    const [row, col] = byRow ? [otherLineIdx, coverIdx] : [coverIdx, otherLineIdx];
                                    if (this.board[row][col] === 0 && this.possiblesGrid[row][col].includes(digit)) {
                                        eliminations.push({ row, col, value: digit });
                                    }
                                }
                            }
                            if (eliminations.length > 0) {
                                const baseList = baseIndices.map((i) => i + 1).join(", ").replace(/,([^,]*)$/, " and$1");
                                const coverList = unionCover.map((i) => i + 1).join(", ").replace(/,([^,]*)$/, " and$1");
                                const reasoning = `${algorithm} on ${digit}: ${baseLabel} ${baseList} have ${digit} only in ${coverLabel} ${coverList}, so ${digit} cannot appear elsewhere in those ${coverLabel}.`;
                                return this.finalizeElimination(eliminations, algorithm, reasoning);
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    private cellsSeeEachOther(r1: number, c1: number, r2: number, c2: number): boolean {
        return r1 === r2 || c1 === c2 || this.boxIndex(r1, c1) === this.boxIndex(r2, c2);
    }

    /**
     * XY-Wing: three bi-value cells — pivot {X,Y}, pincer1 {X,Z}, pincer2 {Y,Z} — where the pivot
     * sees both pincers. Any cell that sees both pincers cannot contain Z.
     */
    private findXYWing(): EliminationMove | null {
        const bivalue: Array<{ row: number; col: number; a: number; b: number }> = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const p = this.possiblesGrid[row][col];
                if (this.board[row][col] === 0 && p.length === 2) {
                    bivalue.push({ row, col, a: p[0]!, b: p[1]! });
                }
            }
        }

        for (const pivot of bivalue) {
            const X = pivot.a;
            const Y = pivot.b;

            // Candidate pincers: bi-value cells that see the pivot and share exactly one digit with it.
            const pincersX: Array<{ row: number; col: number; Z: number }> = [];
            const pincersY: Array<{ row: number; col: number; Z: number }> = [];

            for (const cell of bivalue) {
                if (cell.row === pivot.row && cell.col === pivot.col) continue;
                if (!this.cellsSeeEachOther(pivot.row, pivot.col, cell.row, cell.col)) continue;
                const { a, b } = cell;
                // Cell has {X, Z} where Z ≠ Y
                if (a === X && b !== Y) pincersX.push({ row: cell.row, col: cell.col, Z: b });
                if (b === X && a !== Y) pincersX.push({ row: cell.row, col: cell.col, Z: a });
                // Cell has {Y, Z} where Z ≠ X
                if (a === Y && b !== X) pincersY.push({ row: cell.row, col: cell.col, Z: b });
                if (b === Y && a !== X) pincersY.push({ row: cell.row, col: cell.col, Z: a });
            }

            for (const p1 of pincersX) {
                for (const p2 of pincersY) {
                    if (p1.Z !== p2.Z) continue;
                    if (p1.row === p2.row && p1.col === p2.col) continue;
                    const Z = p1.Z;

                    const eliminations: Array<{ row: number; col: number; value: number }> = [];
                    for (let row = 0; row < 9; row++) {
                        for (let col = 0; col < 9; col++) {
                            if (row === p1.row && col === p1.col) continue;
                            if (row === p2.row && col === p2.col) continue;
                            if (this.board[row][col] !== 0) continue;
                            if (!this.possiblesGrid[row][col].includes(Z)) continue;
                            if (
                                this.cellsSeeEachOther(row, col, p1.row, p1.col) &&
                                this.cellsSeeEachOther(row, col, p2.row, p2.col)
                            ) {
                                eliminations.push({ row, col, value: Z });
                            }
                        }
                    }

                    if (eliminations.length > 0) {
                        const reasoning =
                            `XY-Wing: pivot r${pivot.row + 1}c${pivot.col + 1} (${X}/${Y}) links ` +
                            `pincers r${p1.row + 1}c${p1.col + 1} (${X}/${Z}) and ` +
                            `r${p2.row + 1}c${p2.col + 1} (${Y}/${Z}). ` +
                            `Whatever value the pivot takes, ${Z} must appear in one of the pincers, ` +
                            `so ${Z} cannot appear in any cell seen by both.`;
                        return this.finalizeElimination(eliminations, "XY-Wing", reasoning);
                    }
                }
            }
        }

        return null;
    }

    private eachHouseInOrder(): { row: number; col: number }[][] {
        const houses: { row: number; col: number }[][] = [];
        for (let r = 0; r < 9; r++) {
            houses.push(Array.from({ length: 9 }, (_, c) => ({ row: r, col: c })));
        }
        for (let c = 0; c < 9; c++) {
            houses.push(Array.from({ length: 9 }, (_, row) => ({ row, col: c })));
        }
        for (let b = 0; b < 9; b++) {
            const cells: { row: number; col: number }[] = [];
            for (let idx = 0; idx < 9; idx++) {
                cells.push(this.boxToPuzzle(b, idx));
            }
            houses.push(cells);
        }
        return houses;
    }

    private findNakedSubsetElimination(): EliminationMove | null {
        for (const houseCells of this.eachHouseInOrder()) {
            for (let k = 2; k <= 3; k++) {
                const move = this.tryNakedSubsetInHouse(houseCells, k);
                if (move) return move;
            }
        }
        return null;
    }

    /** `houseCells` is one full row, column, or box (9 cells). */
    private getHouseContext(houseCells: { row: number; col: number }[]): {
        wherePhrase: string;
        sameKindWord: HouseKind;
    } {
        const shared = sharedHouseContainingCells(houseCells);
        if (shared) {
            return { wherePhrase: shared.wherePhrase, sameKindWord: shared.kind };
        }
        const h = houseCells[0]!;
        return { wherePhrase: `box ${boxNumber(h.row, h.col)}`, sameKindWord: "box" };
    }

    private tryNakedSubsetInHouse(houseCells: { row: number; col: number }[], k: number): EliminationMove | null {
        const empties = houseCells.filter(
            ({ row, col }) => this.board[row][col] === 0 && this.possiblesGrid[row][col].length > 0
        );
        if (empties.length < k) {
            return null;
        }
        const algorithm: Algorithm = k === 2 ? "Naked Pair" : k === 3 ? "Naked Triple" : "Naked Quad";
        const { wherePhrase, sameKindWord } = this.getHouseContext(houseCells);
        const n = empties.length;
        const indices: number[] = [];

        const dfs = (start: number): EliminationMove | null => {
            if (indices.length === k) {
                const subset = indices.map((i) => empties[i]!);
                const union = new Set<number>();
                for (const { row, col } of subset) {
                    for (const v of this.possiblesGrid[row][col]) {
                        union.add(v);
                    }
                }
                if (union.size !== k) {
                    return null;
                }
                const subsetKeys = new Set(subset.map(({ row, col }) => row * 9 + col));
                const eliminations: Array<{ row: number; col: number; value: number }> = [];
                for (const { row, col } of houseCells) {
                    if (this.board[row][col] !== 0 || subsetKeys.has(row * 9 + col)) {
                        continue;
                    }
                    const poss = this.possiblesGrid[row][col];
                    for (const d of union) {
                        if (poss.includes(d)) {
                            eliminations.push({ row, col, value: d });
                        }
                    }
                }
                if (eliminations.length === 0) {
                    return null;
                }
                const digitStr = [...union].sort((a, b) => a - b).join("/");
                const reasoning = `${algorithm} ${digitStr} in ${wherePhrase} means those digits can be eliminated from the other cells in that same ${sameKindWord}.`;
                return this.finalizeElimination(eliminations, algorithm, reasoning);
            }
            for (let i = start; i < n; i++) {
                indices.push(i);
                const res = dfs(i + 1);
                indices.pop();
                if (res) return res;
            }
            return null;
        };

        return dfs(0);
    }

    private findHiddenSubsetElimination(): EliminationMove | null {
        for (const houseCells of this.eachHouseInOrder()) {
            for (let k = 2; k <= 3; k++) {
                const move = this.tryHiddenSubsetInHouse(houseCells, k);
                if (move) return move;
            }
        }
        return null;
    }

    private findNakedHiddenQuadsElimination(): EliminationMove | null {
        for (const houseCells of this.eachHouseInOrder()) {
            const moveNaked = this.tryNakedSubsetInHouse(houseCells, 4);
            if (moveNaked) return moveNaked;

            const moveHidden = this.tryHiddenSubsetInHouse(houseCells, 4);
            if (moveHidden) return moveHidden;
        }
        return null;
    }

    private tryHiddenSubsetInHouse(houseCells: { row: number; col: number }[], k: number): EliminationMove | null {
        const algorithm: Algorithm = k === 2 ? "Hidden Pair" : k === 3 ? "Hidden Triple" : "Hidden Quad";
        const { wherePhrase, sameKindWord } = this.getHouseContext(houseCells);
        const digitIndices: number[] = [];

        const dfsDigits = (start: number): EliminationMove | null => {
            if (digitIndices.length === k) {
                const digits = digitIndices.map((i) => COMPLETE[i]!);
                const digitSet = new Set(digits);
                for (const d of digits) {
                    let seen = false;
                    for (const { row, col } of houseCells) {
                        if (this.board[row][col] === 0 && this.possiblesGrid[row][col].includes(d)) {
                            seen = true;
                            break;
                        }
                    }
                    if (!seen) {
                        return null;
                    }
                }
                const reserved: { row: number; col: number }[] = [];
                for (const { row, col } of houseCells) {
                    if (this.board[row][col] !== 0) {
                        continue;
                    }
                    for (const d of digits) {
                        if (this.possiblesGrid[row][col].includes(d)) {
                            reserved.push({ row, col });
                            break;
                        }
                    }
                }
                if (reserved.length !== k) {
                    return null;
                }
                const eliminations: Array<{ row: number; col: number; value: number }> = [];
                for (const { row, col } of reserved) {
                    for (const v of this.possiblesGrid[row][col]) {
                        if (!digitSet.has(v)) {
                            eliminations.push({ row, col, value: v });
                        }
                    }
                }
                if (eliminations.length === 0) {
                    return null;
                }
                const digitStr = [...digits].sort((a, b) => a - b).join("/");
                const cellPhrase = reserved.map(({ row, col }) => `r${row + 1}c${col + 1}`).join(", ");
                const reasoning = `${algorithm} ${digitStr} in ${wherePhrase}: in that ${sameKindWord}, those digits appear only in ${cellPhrase}, so candidates other than ${digitStr} can be removed from those cells.`;
                return this.finalizeElimination(eliminations, algorithm, reasoning);
            }
            for (let i = start; i < 9; i++) {
                digitIndices.push(i);
                const res = dfsDigits(i + 1);
                digitIndices.pop();
                if (res) return res;
            }
            return null;
        };

        return dfsDigits(0);
    }

    private findHiddenSingle(): PlacementMove | null {
        for (let row = 0; row < 9; row++) {
            const move = this.findHiddenSingleInRow(row);
            if (move) return move;
        }
        for (let col = 0; col < 9; col++) {
            const move = this.findHiddenSingleInCol(col);
            if (move) return move;
        }
        for (let box = 0; box < 9; box++) {
            const move = this.findHiddenSingleInBox(box);
            if (move) return move;
        }
        return null;
    }
}
