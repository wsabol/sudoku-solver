export type ValidationReasonType =
    | "duplicate_in_row"
    | "duplicate_in_column"
    | "duplicate_in_box"
    | "invalid_value"
    | "invalid_board_length"
    | "invalid_board_characters"
    | "empty_cell_no_candidates"
    | "too_many_empty_cells";

export interface ValidationReason {
    type: ValidationReasonType;
    detail: string;
    row?: number;
    col?: number;
    box?: number;
    value?: number;
}

export interface ValidationResult {
    isValid: boolean;
    message: string;
    reasons: ValidationReason[];
}

export function pushUniqueReason(reasons: ValidationReason[], reason: ValidationReason): void {
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

export function invalidBoardLength(length: number): ValidationResult {
    return {
        isValid: false,
        message: "Board must be 81 characters",
        reasons: [
            {
                type: "invalid_board_length",
                detail: `Board must be 81 characters, got ${length}`,
            },
        ],
    };
}

export function invalidBoardCharacters(): ValidationResult {
    return {
        isValid: false,
        message: "Board contains invalid characters",
        reasons: [
            {
                type: "invalid_board_characters",
                detail: "Only digits 0-9 and '.' are allowed",
            },
        ],
    };
}