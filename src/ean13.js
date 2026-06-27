export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function calculateCheckDigit(firstTwelveDigits) {
  const digits = onlyDigits(firstTwelveDigits);

  if (digits.length !== 12) {
    throw new Error("El codigo base debe tener exactamente 12 digitos.");
  }

  const total = digits
    .split("")
    .map(Number)
    .reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 1 : 3), 0);

  return String((10 - (total % 10)) % 10);
}

export function completeOrValidateEan13(value) {
  const digits = onlyDigits(value);

  if (digits.length === 12) {
    return {
      ok: true,
      inputLength: 12,
      value: `${digits}${calculateCheckDigit(digits)}`,
      message: "Dígito verificador calculado automáticamente.",
    };
  }

  if (digits.length === 13) {
    const expected = calculateCheckDigit(digits.slice(0, 12));
    const actual = digits.slice(12);

    return {
      ok: expected === actual,
      inputLength: 13,
      value: digits,
      expected,
      actual,
      message:
        expected === actual
          ? "EAN-13 válido."
          : `Dígito verificador incorrecto. Debería terminar en ${expected}.`,
    };
  }

  return {
    ok: false,
    inputLength: digits.length,
    value: digits,
    message: "Escribe 12 dígitos para calcularlo o 13 dígitos para validarlo.",
  };
}

export function parseBatchLines(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawCode, ...labelParts] = line.split(/[,;\t]/);
      const result = completeOrValidateEan13(rawCode);

      return {
        raw: line,
        code: result.value,
        label: labelParts.join(" ").trim(),
        ok: result.ok,
        message: result.message,
      };
    });
}
