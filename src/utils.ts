import { type Board } from "./sudokuSolver.js";

export function boxNumber(row: number, col: number): number {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1; // 1-9
}

export function cloneBoard(board: Board): Board {
    return board.map((row) => [...row]);
}

export function assertBoardShape(board: Board): void {
    if (board.length !== 9 || board.some((row) => row.length !== 9)) {
        throw new Error("Board must be a 9x9 matrix");
    }
}

export function assertBoardValues(board: Board): void {
    for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
            const value = board[row][col];
            if (!Number.isInteger(value) || value < 0 || value > 9) {
                throw new Error(`Invalid value ${value} at row ${row}, col ${col}`);
            }
        }
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

export function duplicateValues(values: number[]): number[] {
    const counts = new Map<number, number>();
    for (const value of values) {
        if (value === 0) {
            continue;
        }
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

const LABELS = 'ABCDEFGHJ';

export function rowLetter(row: number): string {
    return LABELS[row];
}
