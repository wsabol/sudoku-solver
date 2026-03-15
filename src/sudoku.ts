export type Board = number[][];

export interface Move {
    row: number;
    col: number;
    value: number;
}

const COMPLETE = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function cloneBoard(board: Board): Board {
    return board.map((row) => [...row]);
}

function assertBoardShape(board: Board): void {
    if (board.length !== 9 || board.some((row) => row.length !== 9)) {
        throw new Error("Board must be a 9x9 matrix");
    }
}

export function parseBoardString(board: string): Board {
    if (board.length !== 81) {
        throw new Error(`Board must be 81 characters, got ${board.length}`);
    }
    const rows: Board = Array.from({ length: 9 }, () => Array(9).fill(0));

    for (let i = 0; i < 81; i += 1) {
        const ch = board[i];
        const row = Math.floor(i / 9);
        const col = i % 9;
        if (ch >= "1" && ch <= "9") {
            rows[row][col] = Number(ch);
        } else if (ch === "0" || ch === ".") {
            rows[row][col] = 0;
        } else {
            throw new Error(`Invalid character '${ch}' at position ${i}`);
        }
    }
    return rows;
}

export class Sudoku {
    private board: Board;
    private possiblesGrid: number[][][];
    private numGivens: number;

    constructor(input: string | Board) {
        this.board = typeof input === "string" ? parseBoardString(input) : cloneBoard(input);
        assertBoardShape(this.board);

        this.numGivens = 0;
        for (let r = 0; r < 9; r += 1) {
            for (let c = 0; c < 9; c += 1) {
                if (COMPLETE.includes(this.board[r][c])) {
                    this.numGivens += 1;
                }
            }
        }

        this.possiblesGrid = Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () => [] as number[])
        );
        this.calcPossibles();
    }

    toJSONBoard(): Board {
        return cloneBoard(this.board);
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
        for (let r = startRow; r < startRow + 3; r += 1) {
            for (let c = startCol; c < startCol + 3; c += 1) {
                out.push(this.board[r][c]);
            }
        }
        return out;
    }

    private valuesMissing(values: number[]): number[] {
        return COMPLETE.filter((n) => !values.includes(n));
    }

    possibles(row: number, col: number): number[] {
        return [...this.possiblesGrid[row][col]];
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

    calcPossibles(): void {
        for (let r = 0; r < 9; r += 1) {
            for (let c = 0; c < 9; c += 1) {
                this.possiblesGrid[r][c] = this.calcSquarePossibles(r, c);
            }
        }
    }

    setSquareValue(row: number, col: number, value: number): void {
        const original = this.board[row][col];
        if (!this.possibles(row, col).includes(value)) {
            return;
        }
        this.board[row][col] = value;
        this.calcPossibles();
        if (!this.isValid()) {
            this.board[row][col] = original;
            this.calcPossibles();
        }
    }

    isValid(): boolean {
        for (let i = 0; i < 9; i += 1) {
            const row = this.getRow(i).filter((v) => v > 0);
            if (row.some((v) => v < 1 || v > 9)) {
                return false;
            }
            if (new Set(row).size !== row.length) {
                return false;
            }
        }

        for (let i = 0; i < 9; i += 1) {
            const col = this.getColumn(i).filter((v) => v > 0);
            if (col.some((v) => v < 1 || v > 9)) {
                return false;
            }
            if (new Set(col).size !== col.length) {
                return false;
            }
        }

        for (let i = 0; i < 9; i += 1) {
            const box = this.getBox(i).filter((v) => v > 0);
            if (box.some((v) => v < 1 || v > 9)) {
                return false;
            }
            if (new Set(box).size !== box.length) {
                return false;
            }
        }

        for (let row = 0; row < 9; row += 1) {
            for (let col = 0; col < 9; col += 1) {
                if (this.board[row][col] === 0 && this.possibles(row, col).length === 0) {
                    return false;
                }
            }
        }

        for (let row = 0; row < 9; row += 1) {
            const rowValues = this.getRow(row);
            for (let n = 1; n <= 9; n += 1) {
                const hasCandidate = rowValues.some(
                    (v, col) => v === n || (v === 0 && this.possibles(row, col).includes(n))
                );
                if (!hasCandidate) {
                    return false;
                }
            }
        }

        for (let col = 0; col < 9; col += 1) {
            const colValues = this.getColumn(col);
            for (let n = 1; n <= 9; n += 1) {
                const hasCandidate = colValues.some(
                    (v, row) => v === n || (v === 0 && this.possibles(row, col).includes(n))
                );
                if (!hasCandidate) {
                    return false;
                }
            }
        }

        for (let ibox = 0; ibox < 9; ibox += 1) {
            const boxValues = this.getBox(ibox);
            for (let n = 1; n <= 9; n += 1) {
                let hasCandidate = false;
                for (let idx = 0; idx < 9 && !hasCandidate; idx += 1) {
                    const { row, col } = this.boxToPuzzle(ibox, idx);
                    const value = boxValues[idx];
                    hasCandidate = value === n || (value === 0 && this.possibles(row, col).includes(n));
                }
                if (!hasCandidate) {
                    return false;
                }
            }
        }

        return true;
    }

    isComplete(): boolean {
        return this.isValid() && this.board.every((row) => row.every((v) => v !== 0));
    }

    private findNakedSingle(): Move | null {
        for (let row = 0; row < 9; row += 1) {
            for (let col = 0; col < 9; col += 1) {
                if (this.board[row][col] === 0) {
                    const p = this.possibles(row, col);
                    if (p.length === 1) {
                        return { row, col, value: p[0] };
                    }
                }
            }
        }
        return null;
    }

    private findHiddenSingleInRow(row: number): Move | null {
        for (let value = 1; value <= 9; value += 1) {
            const candidates: number[] = [];
            for (let col = 0; col < 9; col += 1) {
                if (this.board[row][col] === 0 && this.possibles(row, col).includes(value)) {
                    candidates.push(col);
                }
            }
            if (candidates.length === 1) {
                return { row, col: candidates[0], value };
            }
        }
        return null;
    }

    private findHiddenSingleInCol(col: number): Move | null {
        for (let value = 1; value <= 9; value += 1) {
            const candidates: number[] = [];
            for (let row = 0; row < 9; row += 1) {
                if (this.board[row][col] === 0 && this.possibles(row, col).includes(value)) {
                    candidates.push(row);
                }
            }
            if (candidates.length === 1) {
                return { row: candidates[0], col, value };
            }
        }
        return null;
    }

    private findHiddenSingleInBox(ibox: number): Move | null {
        for (let value = 1; value <= 9; value += 1) {
            const candidates: Array<{ row: number; col: number }> = [];
            for (let idx = 0; idx < 9; idx += 1) {
                const { row, col } = this.boxToPuzzle(ibox, idx);
                if (this.board[row][col] === 0 && this.possibles(row, col).includes(value)) {
                    candidates.push({ row, col });
                }
            }
            if (candidates.length === 1) {
                return { row: candidates[0].row, col: candidates[0].col, value };
            }
        }
        return null;
    }

    getNextMove(): Move | null {
        if (this.isComplete() || !this.isValid()) {
            return null;
        }

        const naked = this.findNakedSingle();
        if (naked) {
            return naked;
        }

        for (let row = 0; row < 9; row += 1) {
            const move = this.findHiddenSingleInRow(row);
            if (move) {
                return move;
            }
        }
        for (let col = 0; col < 9; col += 1) {
            const move = this.findHiddenSingleInCol(col);
            if (move) {
                return move;
            }
        }
        for (let box = 0; box < 9; box += 1) {
            const move = this.findHiddenSingleInBox(box);
            if (move) {
                return move;
            }
        }

        return null;
    }

    private simpleSolve(): void {
        let move = this.findNakedSingle();
        while (move) {
            this.setSquareValue(move.row, move.col, move.value);
            move = this.findNakedSingle();
        }
    }

    private uniPossiblesSolve(): void {
        for (let row = 0; row < 9; row += 1) {
            let move = this.findHiddenSingleInRow(row);
            while (move) {
                this.setSquareValue(move.row, move.col, move.value);
                this.simpleSolve();
                move = this.findHiddenSingleInRow(row);
            }
        }
        for (let col = 0; col < 9; col += 1) {
            let move = this.findHiddenSingleInCol(col);
            while (move) {
                this.setSquareValue(move.row, move.col, move.value);
                this.simpleSolve();
                move = this.findHiddenSingleInCol(col);
            }
        }
        for (let box = 0; box < 9; box += 1) {
            let move = this.findHiddenSingleInBox(box);
            while (move) {
                this.setSquareValue(move.row, move.col, move.value);
                this.simpleSolve();
                move = this.findHiddenSingleInBox(box);
            }
        }
    }

    solve(): string {
        if (!this.isValid()) {
            return 'Invalid Puzzle ("no solution")';
        }

        this.simpleSolve();
        if (this.isComplete()) {
            return "Unique Solution";
        }

        let boardChanged = true;
        while (!this.isComplete() && boardChanged) {
            const before = JSON.stringify(this.board);
            this.uniPossiblesSolve();
            const after = JSON.stringify(this.board);
            boardChanged = before !== after;
        }

        if (this.isComplete()) {
            return "Unique Solution";
        }

        const valid = this.isValid();
        const complete = this.isComplete();

        if (!valid) {
            return 'Invalid Puzzle ("no solution")';
        }
        if (this.numGivens < 17 && valid && !complete) {
            return 'Invalid Puzzle ("not enough givens" / "multiple solutions")';
        }
        if (valid && !complete) {
            return 'Invalid Puzzle ("no unique solution")';
        }
        return 'Invalid Puzzle ("unknown")';
    }

}
