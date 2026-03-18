# Sudoku Solver (Node Module)

TypeScript module for Sudoku solve, next move, describe, and validate operations.

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

Build output is written to `dist/`.

## Usage

```ts
import Sudoku from "sudoku-solver";

const board =
    "000010080302607000070000003080070500004000600003050010200000050000705108060040000";

const solved = Sudoku.solve(board);
console.log(solved.isValid); // true
console.log(solved.board);   // number[][]

const next = Sudoku.nextMove(board);
console.log(next.status);  // "In progress"
console.log(next.message); // e.g. "Place 4 in row 1 column 3"
console.log(next.move);    // { row, col, value } | null

const check = Sudoku.validate(board);
console.log(check.isValid);  // true/false
console.log(check.reasons);  // ValidationReason[]

const info = Sudoku.describe(board);
console.log(info.difficulty); // "Easy" | "Medium" | "Hard" | "Diabolical" | "Impossible"
console.log(info.solutions);  // 0 | 1
```

## API

### `Sudoku.solve(boardInput)`

Accepts `string | number[][]`.

Returns:

```ts
{
    isValid: boolean;
    board: number[][];
}
```

`isValid` is `false` when the board is structurally invalid or has no solution.

### `Sudoku.nextMove(boardInput)`

Accepts `string | number[][]`.

Returns:

```ts
{
    status: "Complete" | "In progress" | "Invalid";
    move: { row: number; col: number; value: number } | null;
    message: string;
}
```

Notes:
- `move` is `null` when the board is complete or invalid.
- `message` uses 1-indexed row/column phrasing.

### `Sudoku.validate(boardInput)`

Accepts `string | number[][]`.

Returns:

```ts
{
    isValid: boolean;
    message: string;
    reasons: ValidationReason[];
}
```

### `Sudoku.describe(boardInput)`

Accepts `string | number[][]`.

Returns:

```ts
{
    isValid: boolean;
    isComplete: boolean;
    message: string;
    difficulty: "Easy" | "Medium" | "Hard" | "Diabolical" | "Impossible";
    solutions: number;
}
```

`difficulty` is derived from empty cell count. `solutions` is `0` when the board is invalid/unsolvable, `1` when a unique solution exists.

## Development

```bash
npm test
npm run typecheck
```
