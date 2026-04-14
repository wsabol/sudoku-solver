import { describe, expect, it } from "vitest";
import Sudoku from "../src/index";
import { parseBoardString } from "../src/utils";

const BOARD =
    "000010080302607000070000003080070500004000600003050010200000050000705108060040000";

const SOLVED_BOARD =
    "974236158638591742125487936316754289742918563589362417867125394253649871491873625";

// A board the solver can fully resolve to a unique solution
const SOLVABLE_BOARD =
    "300967001040302080020000070070000090000873000500010003004705100905000207800621004";

// A board beyond the solver's current algorithms
const HARD_BOARD =
    "070300002500001900004060000900007500008010020060200003000004800000070010000800007";

// A valid puzzle with exactly two solutions
const MULTI_SOLUTION_BOARD =
    "074236058638591742025487036316754289742918563589362417867125394253649871491873625";

// A board with fewer than 17 givens (invalid per Sudoku rules)
const SPARSE_BOARD =
    "000000010000000200030000405000000000000000000000006000000070000602000080000340000";

// A board with a duplicate in row 0
const DUPLICATE_BOARD =
    "110010080302607000070000003080070500004000600003050010200000050000705108060040000";

describe("Node module API", () => {
    describe("Sudoku.solve()", () => {
        it("solves a board given as a string", () => {
            const result = Sudoku.solve(BOARD);
            expect(result.isValid).toBe(true);
            expect(result.board.flat().includes(0)).toBe(false);
        });

        it("solves a board given as a matrix", () => {
            const matrix = parseBoardString(BOARD);
            const result = Sudoku.solve(matrix);
            expect(result.isValid).toBe(true);
            expect(result.board.flat().includes(0)).toBe(false);
        });

        it("returns isValid false for an invalid board", () => {
            const result = Sudoku.solve(DUPLICATE_BOARD);
            expect(result.isValid).toBe(false);
        });

        it("returns a 9x9 board regardless of solve success", () => {
            const result = Sudoku.solve(DUPLICATE_BOARD);
            expect(result.board).toHaveLength(9);
            expect(result.board.every((row) => row.length === 9)).toBe(true);
        });
    });

    describe("Sudoku.nextMove()", () => {
        it("returns a move and In progress status for an unsolved board", () => {
            const result = Sudoku.nextMove(BOARD);
            expect(result.status).toBe("In progress");
            expect(result.move).not.toBeNull();
            expect(result.message).toMatch(/^Place \d+ in r\d+c\d+/);
            expect(result.move!.algorithm).toMatch(/^(Naked Single|Hidden Single)$/);
            if (result.move !== null && result.move.type === "placement") {
                expect(result.move.message).toBe(result.message);
                expect(result.move.reasoning.length).toBeGreaterThan(0);
            }
        });

        it("returns a move for a matrix board input", () => {
            const matrix = parseBoardString(BOARD);
            const result = Sudoku.nextMove(matrix);
            expect(result.status).toBe("In progress");
            expect(result.move).not.toBeNull();
        });

        it("returns Complete status and null move for a solved board", () => {
            const result = Sudoku.nextMove(SOLVED_BOARD);
            expect(result.status).toBe("Complete");
            expect(result.move).toBeNull();
            expect(result.message).toBe("No more moves");
        });

        it("returns Invalid status and null move for an invalid board", () => {
            const result = Sudoku.nextMove(DUPLICATE_BOARD);
            expect(result.status).toBe("Invalid");
            expect(result.move).toBeNull();
            expect(result.message).toBe("Invalid Puzzle: Duplicate value 1 in row 0");
        });
    });

    describe("Sudoku.validate()", () => {
        it("returns isValid true for a valid board string", () => {
            const result = Sudoku.validate(BOARD);
            expect(result.isValid).toBe(true);
            expect(result.reasons).toHaveLength(0);
        });

        it("returns isValid true for a valid board matrix", () => {
            const matrix = parseBoardString(BOARD);
            const result = Sudoku.validate(matrix);
            expect(result.isValid).toBe(true);
            expect(result.reasons).toHaveLength(0);
        });

        it("returns duplicate_in_row reason for a board with row duplicates", () => {
            const result = Sudoku.validate(DUPLICATE_BOARD);
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "duplicate_in_row")).toBe(true);
        });

        it("returns invalid_board_length for a string shorter than 81 characters", () => {
            const result = Sudoku.validate("123");
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "invalid_board_length")).toBe(true);
        });

        it("returns invalid_board_characters for a string with disallowed characters", () => {
            const malformed =
                "00001008030260700007000000308007050000400060000305001020000005000070510806004000x";
            const result = Sudoku.validate(malformed);
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "invalid_board_characters")).toBe(true);
        });

        it("returns too_many_empty_cells for a board with fewer than 17 givens", () => {
            const result = Sudoku.validate(SPARSE_BOARD);
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "too_many_empty_cells")).toBe(true);
        });
    });

    describe("Sudoku.describe()", () => {
        it("returns isComplete true and solutions 1 for an already-solved board", () => {
            const result = Sudoku.describe(SOLVED_BOARD);
            expect(result.isValid).toBe(true);
            expect(result.isComplete).toBe(true);
            expect(result.solutions).toBe(1);
            expect(result.message).toBe("Solvable with a single solution");
        });

        it("returns solutions 1 and Unique Solution message for a solvable board", () => {
            const result = Sudoku.describe(SOLVABLE_BOARD);
            expect(result.isValid).toBe(true);
            expect(result.isComplete).toBe(false);
            expect(result.solutions).toBe(1);
            expect(result.message).toBe("Unique Solution");
        });

        it("returns solutions 1 for a valid board the logic solver cannot complete", () => {
            const result = Sudoku.describe(HARD_BOARD);
            expect(result.isValid).toBe(true);
            expect(result.isComplete).toBe(false);
            expect(result.solutions).toBe(1);
            expect(result.message).toBe('Invalid Puzzle ("no unique solution")');
        });

        it("returns solutions 2 for a puzzle with multiple valid solutions", () => {
            const result = Sudoku.describe(MULTI_SOLUTION_BOARD);
            expect(result.isValid).toBe(true);
            expect(result.isComplete).toBe(false);
            expect(result.solutions).toBe(2);
            expect(result.message).toBe('Invalid Puzzle ("no unique solution")');
        });

        it("returns isValid false and solutions 0 for an invalid board", () => {
            const result = Sudoku.describe(SPARSE_BOARD);
            expect(result.isValid).toBe(false);
            expect(result.isComplete).toBe(false);
            expect(result.solutions).toBe(0);
            expect(result.difficulty).toBe(null);
        });

        it("returns a non-empty difficulty string for a valid board", () => {
            const result = Sudoku.describe(BOARD);
            expect(result.isValid).toBe(true);
            expect(result.difficulty).toMatch(/^(Easy|Medium|Hard|Diabolical|Impossible)$/);
        });

        it("accepts matrix board input", () => {
            const matrix = parseBoardString(SOLVABLE_BOARD);
            const result = Sudoku.describe(matrix);
            expect(result.isValid).toBe(true);
            expect(result.solutions).toBe(1);
        });
    });
});
