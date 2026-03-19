import { cloneBoard, assertBoardShape, parseBoardString, duplicateValues } from "./utils";
import { ValidationReason, ValidationResult, pushUniqueReason } from "./validate";

export type Board = number[][];

export type Algorithm = "Full House" | "Naked Single" | "Hidden Single" | "Pointing Pair/Triple";

export interface PlacementMove {
    type: "placement";
    row: number;
    col: number;
    value: number;
    algorithm: Algorithm;
}

export interface EliminationMove {
    type: "elimination";
    eliminations: Array<{ row: number; col: number; value: number }>;
    algorithm: Algorithm;
}

export type Move = PlacementMove | EliminationMove;

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Diabolical" | "Impossible";

const COMPLETE = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default class SudokuSolver {
    static readonly ALGORITHMS: Algorithm[] = ["Full House", "Naked Single", "Hidden Single", "Pointing Pair/Triple"];

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

    isComplete(): boolean {
        return this.board.every((row) => row.every((v) => v !== 0));
    }

    countEmptyCells(): number {
        return this.board.flat().filter((v) => v === 0).length;
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
            if (move.type === "placement") {
                this.setSquareValue(move.row, move.col, move.value);
            } else {
                this.applyElimination(move);
            }
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

    private findBestMove(): Move | null {
        for (const algorithm of SudokuSolver.ALGORITHMS) {
            const move = this.findNextPlacement(algorithm);
            if (move) return move;
        }
        return null;
    }

    private findNextPlacement(algorithm: Algorithm): Move | null {
        switch (algorithm) {
            case "Full House":
            case "Naked Single": {
                const move = this.findNakedSingle();
                if (algorithm === "Full House") {
                    return move?.algorithm === "Full House" ? move : null;
                }
                return move;
            }
            case "Hidden Single":
                return this.findHiddenSingle();
            case "Pointing Pair/Triple":
                return this.findPointingPairTriple();
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

                        // check if full house
                        const rowValues = this.getRow(row);
                        if (rowValues.filter((v) => v === 0).length === 1) {
                            algo = "Full House";
                        }
                        const colValues = this.getColumn(col);
                        if (colValues.filter((v) => v === 0).length === 1) {
                            algo = "Full House";
                        }
                        const boxValues = this.getBox(this.boxIndex(row, col));
                        if (boxValues.filter((v) => v === 0).length === 1) {
                            algo = "Full House";
                        }

                        return { type: "placement", row, col, value: placeValue, algorithm: algo };
                    }
                }
            }
        }
        return null;
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
                return { type: "placement", row, col: candidates[0], value, algorithm: "Hidden Single" };
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
                return { type: "placement", row: candidates[0], col, value, algorithm: "Hidden Single" };
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
                return { type: "placement", row: candidates[0].row, col: candidates[0].col, value, algorithm: "Hidden Single" };
            }
        }
        return null;
    }

    private findPointingPairTriple(): EliminationMove | null {
        for (let ibox = 0; ibox < 9; ibox++) {
            const boxStartRow = Math.floor(ibox / 3) * 3;
            const boxStartCol = (ibox % 3) * 3;
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
                        return { type: "elimination", eliminations, algorithm: "Pointing Pair/Triple" };
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
                        return { type: "elimination", eliminations, algorithm: "Pointing Pair/Triple" };
                    }
                }
            }
        }
        return null;
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
