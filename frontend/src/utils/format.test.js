import { describe, expect, it } from "vitest";
import { formatINR, initials, validateAmount } from "./format";
import { validateSignup } from "./validation";

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(123456.5)).toBe("₹1,23,456.50");
  });
});

describe("initials", () => {
  it("handles missing names", () => {
    expect(initials("ana", "lopez")).toBe("AL");
    expect(initials("", "")).toBe("?");
  });
});

describe("validateAmount", () => {
  it.each([
    ["", "Enter an amount"],
    ["abc", "Enter a valid amount with up to 2 decimals"],
    ["1.234", "Enter a valid amount with up to 2 decimals"],
    ["-5", "Enter a valid amount with up to 2 decimals"],
    ["0", "Amount must be greater than zero"],
    ["100001", "You can send at most ₹1,00,000 per transfer"],
  ])("rejects %j", (input, message) => {
    expect(validateAmount(input, null)).toBe(message);
  });

  it("checks the balance", () => {
    expect(validateAmount("50.01", 50)).toBe("Amount is more than your balance");
    expect(validateAmount("50", 50)).toBeNull();
  });
});

describe("validateSignup", () => {
  it("reports every invalid field", () => {
    const errors = validateSignup({ firstName: " ", lastName: "", username: "x", password: "short" });
    expect(Object.keys(errors).sort()).toEqual(["firstName", "lastName", "password", "username"]);
  });
});
