import { Sudoku, parseBoardString, type Board } from "./sudoku";
import { validateBoard } from "./validate";

function badRequest(error: string, details?: string): Response {
    return Response.json(
        {
            error,
            ...(details ? { details } : {}),
        },
        { status: 400 }
    );
}

function parseBoardFromQuery(request: Request): { board?: string; error?: Response } {
    const board = new URL(request.url).searchParams.get("board");
    if (!board) {
        return { error: badRequest("Missing board parameter") };
    }
    if (board.length !== 81) {
        return { error: badRequest("Board must be 81 characters") };
    }
    return { board };
}

function parseBoard(request: Request): { parsed?: Board; error?: Response } {
    const { board, error } = parseBoardFromQuery(request);
    if (error || !board) {
        return { error: error ?? badRequest("Invalid board format") };
    }
    try {
        return { parsed: parseBoardString(board) };
    } catch (err) {
        return { error: badRequest("Invalid board format", (err as Error).message) };
    }
}

function solveRequest(request: Request) {
    const { parsed, error } = parseBoard(request);
    if (error || !parsed) {
        return error ?? badRequest("Invalid board format");
    }

    const sudoku = new Sudoku(parsed);
    const status = sudoku.solve();
    return Response.json({
        status,
        board: sudoku.toJSONBoard(),
    });
}

function hintRequest(request: Request) {
    const { parsed, error } = parseBoard(request);
    if (error || !parsed) {
        return error ?? badRequest("Invalid board format");
    }

    const sudoku = new Sudoku(parsed);
    if (!sudoku.isValid()) {
        return badRequest('Invalid Puzzle ("no solution")');
    }

    const move = sudoku.getNextMove();
    const message = move
        ? `place ${move.value} in row ${move.row + 1} column ${move.col + 1}`
        : "No more moves";

    if (move) {
        sudoku.setSquareValue(move.row, move.col, move.value);
    }

    return Response.json({
        status: sudoku.isComplete() ? "Complete" : "In progress",
        move,
        message,
        board: sudoku.toJSONBoard(),
    });
}

function validateRequest(request: Request) {
    const board = new URL(request.url).searchParams.get("board");
    if (!board) {
        return badRequest("Missing board parameter");
    }
    if (board.length !== 81) {
        return Response.json({
            valid: false,
            message: "Board must be 81 characters",
            reasons: [
                {
                    type: "invalid_board_length",
                    detail: `Board must be 81 characters, got ${board.length}`,
                },
            ],
        });
    }
    if (!/^[0-9.]{81}$/.test(board)) {
        return Response.json({
            valid: false,
            message: "Board contains invalid characters",
            reasons: [
                {
                    type: "invalid_board_characters",
                    detail: "Only digits 0-9 and '.' are allowed",
                },
            ],
        });
    }
    const result = validateBoard(parseBoardString(board));
    return Response.json(result);
}

export {
    badRequest,
    parseBoardFromQuery,
    solveRequest,
    hintRequest,
    validateRequest
}