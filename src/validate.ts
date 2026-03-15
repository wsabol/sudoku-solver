import { Sudoku, type Board } from "./sudoku";

export type ValidationReasonType =
    | "duplicate_in_row"
    | "duplicate_in_column"
    | "duplicate_in_box"
    | "invalid_value"
    | "invalid_board_length"
    | "invalid_board_characters"
    | "empty_cell_no_candidates";

export interface ValidationReason {
    type: ValidationReasonType;
    detail: string;
    row?: number;
    col?: number;
    box?: number;
    value?: number;
}

export interface ValidationResult {
    valid: boolean;
    message: string;
    reasons: ValidationReason[];
}

function duplicateValues(values: number[]): number[] {
    const counts = new Map<number, number>();
    for (const value of values) {
        if (value === 0) {
            continue;
        }
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

function pushIfUnique(reasons: ValidationReason[], reason: ValidationReason): void {
    const found = reasons.some(
        (r) =>
            r.type === reason.type &&
            r.row === reason.row &&
            r.col === reason.col &&
            r.box === reason.box &&
            r.value === reason.value
    );
    if (!found) {
        reasons.push(reason);
    }
}

export function validateBoard(board: Board): ValidationResult {
    const reasons: ValidationReason[] = [];

    if (board.length !== 9 || board.some((row) => row.length !== 9)) {
        reasons.push({
            type: "invalid_board_length",
            detail: "Board must be a 9x9 matrix",
        });
        return { valid: false, message: reasons[0].detail, reasons };
    }

    for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
            const value = board[row][col];
            if (!Number.isInteger(value) || value < 0 || value > 9) {
                pushIfUnique(reasons, {
                    type: "invalid_value",
                    detail: `Invalid value ${value} at row ${row}, col ${col}`,
                    row,
                    col,
                    value,
                });
            }
        }
    }

    for (let row = 0; row < 9; row += 1) {
        for (const value of duplicateValues(board[row])) {
            pushIfUnique(reasons, {
                type: "duplicate_in_row",
                detail: `Duplicate value ${value} in row ${row}`,
                row,
                value,
            });
        }
    }

    for (let col = 0; col < 9; col += 1) {
        const colVals = board.map((row) => row[col]);
        for (const value of duplicateValues(colVals)) {
            pushIfUnique(reasons, {
                type: "duplicate_in_column",
                detail: `Duplicate value ${value} in column ${col}`,
                col,
                value,
            });
        }
    }

    for (let box = 0; box < 9; box += 1) {
        const startRow = Math.floor(box / 3) * 3;
        const startCol = (box % 3) * 3;
        const values: number[] = [];
        for (let row = startRow; row < startRow + 3; row += 1) {
            for (let col = startCol; col < startCol + 3; col += 1) {
                values.push(board[row][col]);
            }
        }
        for (const value of duplicateValues(values)) {
            pushIfUnique(reasons, {
                type: "duplicate_in_box",
                detail: `Duplicate value ${value} in box ${box}`,
                box,
                value,
            });
        }
    }

    if (reasons.length === 0) {
        const sudoku = new Sudoku(board);
        for (let row = 0; row < 9; row += 1) {
            for (let col = 0; col < 9; col += 1) {
                if (board[row][col] === 0 && sudoku.possibles(row, col).length === 0) {
                    pushIfUnique(reasons, {
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
        valid: reasons.length === 0,
        message: reasons[0]?.detail ?? "Valid",
        reasons,
    };
}
