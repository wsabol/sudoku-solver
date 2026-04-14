import SudokuSolver, { type Algorithm, type DifficultyLevel } from "./sudokuSolver.js";
import { invalidBoardLength, invalidBoardCharacters, ValidationReason, ValidationResult } from "./validate.js";
import type { Board } from "./boardGeo.js";
import type { Move, MoveStatus, EliminationMove, PlacementMove } from "./move.js";

interface SolveResult {
    isValid: boolean;
    board: Board;
}

interface DescribeResult {
    countGivens: number;
    countEmptyCells: number;
    isValid: boolean;
    isComplete: boolean;
    message: string,
    difficulty: DifficultyLevel | null,
    solutions: number,
}

interface MoveResult {
    status: MoveStatus;
    move: Move | null;
    message: string;
}

function solve(boardInput: string | Board): SolveResult {
    const sudoku = new SudokuSolver(boardInput);
    const isValid = sudoku.solve();
    return {
        isValid: isValid,
        board: sudoku.toArray(),
    };
}

function countSolutions(board: Board): number {
    const copy = new SudokuSolver(board);
    let count = 0;

    function backtrack(startIdx: number = 0): void {
        // Prevent hanging on boards with many solutions (only need to know if 0, 1, or >1)
        if (count >= 2) return;

        let emptyR = -1;
        let emptyC = -1;
        for (let i = startIdx; i < 81; i++) {
            const r = Math.floor(i / 9);
            const c = i % 9;
            if (copy.isCellEmpty(r, c)) {
                emptyR = r;
                emptyC = c;
                break;
            }
        }

        if (emptyR === -1) {
            count++;
            return;
        }

        const possibles = copy.getPossibles(emptyR, emptyC);
        for (const num of possibles) {
            copy.setSquareValue(emptyR, emptyC, num);
            backtrack(emptyR * 9 + emptyC + 1);
            copy.setCellEmpty(emptyR, emptyC);
        }
    }

    backtrack();
    return count;
}

export function bruteForceSolve(board: Board): Board | null {
    const copy = new SudokuSolver(board);
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (copy.isCellEmpty(r, c)) {
                for (let num = 1; num <= 9; num++) {
                    if (copy.getPossibles(r, c).includes(num)) {
                        copy.setSquareValue(r, c, num);
                        if (bruteForceSolve(copy.toArray())) return copy.toArray();
                        copy.setCellEmpty(r, c);
                    }
                }
                return null;
            }
        }
    }
    return copy.toArray();
}

function nextMove(boardInput: string | Board): MoveResult {
    const sudoku = new SudokuSolver(boardInput);

    const validation = sudoku.validate();
    if (!validation.isValid) {
        return {
            status: "Invalid",
            move: null,
            message: `Invalid Puzzle: ${validation.message}`,
        };
    }

    const move = sudoku.getNextMove();
    let message: string;
    if (!move) {
        message = "No more moves";
    } else {
        message = move.message;
        sudoku.applyMove(move);
    }

    return {
        status: sudoku.isComplete() ? "Complete" : "In progress",
        move,
        message,
    };
}

function validate(boardInput: string | Board): ValidationResult {
    if (typeof boardInput === "string") {
        if (boardInput.length !== 81) {
            return invalidBoardLength(boardInput.length);
        }
        if (!/^[0-9.]{81}$/.test(boardInput)) {
            return invalidBoardCharacters();
        }
    }

    const test = new SudokuSolver(boardInput);
    return test.validate();
}

function describeBoard(boardInput: string | Board): DescribeResult {
    const sudoku = new SudokuSolver(boardInput);
    const initValidation = sudoku.validate();

    if (!initValidation.isValid) {
        return {
            countGivens: sudoku.countPlaced(),
            countEmptyCells: sudoku.countEmptyCells(),
            isValid: false,
            isComplete: false,
            message: initValidation.message,
            difficulty: null,
            solutions: 0,
        }
    }

    let result = {
        countGivens: sudoku.countPlaced(),
        countEmptyCells: sudoku.countEmptyCells(),
        isValid: true,
        isComplete: sudoku.isComplete(),
        message: '',
        difficulty: sudoku.difficulty(),
        solutions: countSolutions(sudoku.toArray()),
    } as DescribeResult;

    if (result.isComplete) {
        result.message = 'Solvable with a single solution';
    } else {
        sudoku.solve();
        if (sudoku.isComplete()) {
            result.message = 'Unique Solution';
        } else {
            result.message = 'Invalid Puzzle (\"no unique solution\")';
        }
    }

    return result;
}

const Sudoku = {
    solve: solve,
    nextMove: nextMove,
    validate: validate,
    describe: describeBoard,
};

export {
    SudokuSolver
}

// main exports for the module
export type {
    Algorithm,
    Board,
    Move,
    PlacementMove,
    EliminationMove,
    ValidationReason,
    ValidationResult,
    SolveResult,
    MoveResult,
    MoveStatus,
    DescribeResult
};

export default Sudoku;