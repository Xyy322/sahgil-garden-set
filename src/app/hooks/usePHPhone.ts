import { useCallback, useMemo, useState } from "react";

const VALID_REGEX = /^\+639\d{9}$/;

function normalize(input: string): string | null {
  if (!input) return null;

  let value = input.trim().replace(/[\s-]/g, "");

  // Convert local PH format to international
  if (value.startsWith("09")) {
    value = "+63" + value.slice(1);
  }

  // Final validation
  if (!VALID_REGEX.test(value)) return null;

  return value;
}

export function usePHPhone(initialValue: string = "") {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const onChange = useCallback((input: string) => {
    setValue(input);

    if (!input) {
      setError(null);
      return;
    }

    const normalized = normalize(input);

    if (!normalized) {
      setError("Invalid PH number. Use 09XXXXXXXXX or +639XXXXXXXXX");
    } else {
      setError(null);
    }
  }, []);

  const normalized = useMemo(() => normalize(value), [value]);
  const isValid = !!normalized;

  return {
    value,
    setValue,
    onChange,
    normalized,
    isValid,
    error,
  };
}