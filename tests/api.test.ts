import { describe, expect, it } from "vitest";
import worker from "../src/index";

const BOARD =
    "000010080302607000070000003080070500004000600003050010200000050000705108060040000";

const AUTH_HEADER = { Authorization: "Bearer test-token" };

describe("Worker API", () => {
    it("returns 401 without token", async () => {
        const req = new Request(`https://example.com/solve?board=${BOARD}`);
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(401);
    });

    it("solves board", async () => {
        const req = new Request(`https://example.com/solve?board=${BOARD}`, {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(200);
        const payload = (await res.json()) as { status: string; board: number[][] };
        expect(payload.status).toBe("Unique Solution");
        expect(payload.board.flat().includes(0)).toBe(false);
    });

    it("returns hint", async () => {
        const req = new Request(`https://example.com/hint?board=${BOARD}`, {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(200);
        const payload = (await res.json()) as { move: { row: number; col: number; value: number } | null };
        expect(payload.move).not.toBeNull();
    });

    it("returns validation reasons for invalid board", async () => {
        const invalidBoard =
            "110010080302607000070000003080070500004000600003050010200000050000705108060040000";
        const req = new Request(`https://example.com/validate?board=${invalidBoard}`, {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(200);
        const payload = (await res.json()) as { valid: boolean; reasons: Array<{ type: string }> };
        expect(payload.valid).toBe(false);
        expect(payload.reasons.some((reason) => reason.type === "duplicate_in_row")).toBe(true);
    });

    it("returns 405 for non-GET requests", async () => {
        const req = new Request(`https://example.com/solve?board=${BOARD}`, {
            method: "POST",
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(405);
    });

    it("returns 404 for unknown endpoint", async () => {
        const req = new Request("https://example.com/unknown", {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(404);
    });

    it("returns 400 for missing board on solve", async () => {
        const req = new Request("https://example.com/solve", {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(400);
    });

    it("returns 400 for invalid board characters on solve", async () => {
        const invalidCharsBoard =
            "00001008030260700007000000308007050000400060000305001020000005000070510806004000x";
        const req = new Request(`https://example.com/solve?board=${invalidCharsBoard}`, {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(400);
        const payload = (await res.json()) as { error: string; details?: string };
        expect(payload.error).toBe("Invalid board format");
        expect(payload.details).toBeDefined();
    });

    it("returns invalid length reason from validate endpoint", async () => {
        const req = new Request("https://example.com/validate?board=123", {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(200);
        const payload = (await res.json()) as { valid: boolean; reasons: Array<{ type: string }> };
        expect(payload.valid).toBe(false);
        expect(payload.reasons.some((reason) => reason.type === "invalid_board_length")).toBe(true);
    });

    it("returns 400 for short board on solve", async () => {
        const req = new Request("https://example.com/solve?board=123", {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(400);
    });

    it("returns 400 for invalid board characters on hint", async () => {
        const invalidCharsBoard =
            "00001008030260700007000000308007050000400060000305001020000005000070510806004000x";
        const req = new Request(`https://example.com/hint?board=${invalidCharsBoard}`, {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(400);
        const payload = (await res.json()) as { error: string; details?: string };
        expect(payload.error).toBe("Invalid board format");
        expect(payload.details).toBeDefined();
    });

    it("returns 400 for missing board on validate", async () => {
        const req = new Request("https://example.com/validate", {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(400);
    });

    it("returns move:null and complete status for a solved board on hint", async () => {
        const completedBoard =
            "974236158638591742125487936316754289742918563589362417867125394253649871491873625";
        const req = new Request(`https://example.com/hint?board=${completedBoard}`, {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(200);
        const payload = (await res.json()) as { status: string; move: null };
        expect(payload.move).toBeNull();
        expect(payload.status).toBe("Complete");
    });

    it("returns 400 for unsolvable board on hint", async () => {
        const unsolvableBoard =
            "110010080302607000070000003080070500004000600003050010200000050000705108060040000";
        const req = new Request(`https://example.com/hint?board=${unsolvableBoard}`, {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(400);
    });

    it("returns invalid characters reason from validate endpoint", async () => {
        const invalidCharsBoard =
            "00001008030260700007000000308007050000400060000305001020000005000070510806004000x";
        const req = new Request(`https://example.com/validate?board=${invalidCharsBoard}`, {
            headers: AUTH_HEADER,
        });
        const res = await worker.fetch(req, { BEARER_TOKEN: "test-token" });
        expect(res.status).toBe(200);
        const payload = (await res.json()) as { valid: boolean; reasons: Array<{ type: string }> };
        expect(payload.valid).toBe(false);
        expect(payload.reasons.some((reason) => reason.type === "invalid_board_characters")).toBe(true);
    });
});
