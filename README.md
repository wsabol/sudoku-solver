# Sudoku Solver API (Cloudflare Worker)

TypeScript REST API for Sudoku solve/hint/validate.

## Endpoints

All endpoints require bearer authentication:

`Authorization: Bearer <token>`

Board format is an 81-character string passed via `?board=` where blanks are `0` or `.`.

### GET `/solve`

Returns solved board and status.

Example:

```bash
curl -H "Authorization: Bearer $TOKEN" \
    "http://127.0.0.1:8787/solve?board=000010080302607000070000003080070500004000600003050010200000050000705108060040000"
```

Response:

```json
{
    "status": "Unique Solution",
    "board": [[... 9x9 ...]]
}
```

### GET `/hint`

Returns the next logical move (if any), message, and board.

Response:

```json
{
    "status": "In progress",
    "move": { "row": 0, "col": 0, "value": 4 },
    "message": "place 4 in row 0 column 0",
    "board": [[... 9x9 ...]]
}
```

### GET `/validate`

Returns validity and structured reasons for invalid boards.

Response:

```json
{
    "valid": false,
    "message": "Duplicate value 7 in row 0",
    "reasons": [
        { "type": "duplicate_in_row", "detail": "Duplicate value 7 in row 0", "row": 0, "value": 7 }
    ]
}
```

## Local Development

Install dependencies:

```bash
npm install
```

Set token for local dev in `.dev.vars`:

```ini
BEARER_TOKEN=your-dev-token
```

Run:

```bash
npm run dev
```

## Deploy

Set production secret:

```bash
npx wrangler secret put BEARER_TOKEN
```

Deploy worker:

```bash
npm run deploy
```

## External Resources

- CLI Version of this API: [wsabol/SudokuSolver](https://github.com/wsabol/SudokuSolver)