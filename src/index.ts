import SudokuSolver, { type Algorithm, type Board, type Move, type PlacementMove, type EliminationMove } from "./sudokuSolver";
import { invalidBoardLength, invalidBoardCharacters, type ValidationReason, type ValidationResult } from "./validate";

interface SolveResult {
    isValid: boolean;
    board: Board;
}

interface DescribeResult {
    isValid: boolean;
    isComplete: boolean;
    message: string,
    difficulty: string,
    solutions: number,
}

type MoveStatus = "Complete" | "In progress" | "Invalid";

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
    } else if (move.type === "placement") {
        message = `Place ${move.value} in r${move.row + 1}c${move.col + 1} (${move.algorithm})`;
        sudoku.setSquareValue(move.row, move.col, move.value);
    } else {
        const digit = move.eliminations[0]!.value;
        message = `Eliminate ${digit} from ${move.eliminations.length} cell(s) (${move.algorithm})`;
        sudoku.applyElimination(move);
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
            isValid: false,
            isComplete: false,
            message: initValidation.message,
            difficulty: '',
            solutions: 0,
        }
    }

    let result = {
        isValid: true,
        isComplete: sudoku.isComplete(),
        message: '',
        difficulty: sudoku.difficulty(),
        solutions: 0,
    } as DescribeResult;

    if (result.isComplete) {
        result.solutions = 1;
        result.message = 'Solvable with a single solution';
    } else {
        sudoku.solve();
        if (sudoku.isComplete()) {
            result.solutions = 1;
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