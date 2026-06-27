import { describe, expect, it } from "vitest";
import {
  calculateCheckDigit,
  completeOrValidateEan13,
  onlyDigits,
  parseBatchLines,
} from "./ean13.js";

describe("EAN-13 helpers", () => {
  it("keeps only numeric characters", () => {
    expect(onlyDigits("7 46284-291201")).toBe("746284291201");
  });

  it("calculates the expected check digit for a 12 digit code", () => {
    expect(calculateCheckDigit("746284291201")).toBe("0");
  });

  it("auto-completes a 12 digit code", () => {
    expect(completeOrValidateEan13("746284291201")).toMatchObject({
      ok: true,
      value: "7462842912010",
      inputLength: 12,
    });
  });

  it("validates a correct 13 digit EAN", () => {
    expect(completeOrValidateEan13("7462842912010")).toMatchObject({
      ok: true,
      value: "7462842912010",
    });
  });

  it("rejects an incorrect check digit", () => {
    expect(completeOrValidateEan13("7462842912019")).toMatchObject({
      ok: false,
      expected: "0",
      actual: "9",
    });
  });

  it("parses batch lines with optional labels", () => {
    expect(parseBatchLines("746284291201, 800 gramos\n7462842912010; 2200 gramos")).toEqual([
      {
        raw: "746284291201, 800 gramos",
        code: "7462842912010",
        label: "800 gramos",
        ok: true,
        message: "Dígito verificador calculado automáticamente.",
      },
      {
        raw: "7462842912010; 2200 gramos",
        code: "7462842912010",
        label: "2200 gramos",
        ok: true,
        message: "EAN-13 válido.",
      },
    ]);
  });
});
