import { useCallback, useMemo, useState } from "react";
import { DEFAULT_DIAL_CODE, buildOutboundNumber, countryByDialCode } from "@buster/shared";

export interface DialerState {
  number: string;
  dialCode: string;
  isInternational: boolean;
  append: (digit: string) => void;
  backspace: () => void;
  clear: () => void;
  setNumber: (value: string) => void;
  setDialCode: (code: string) => void;
  outbound: string;
  canCall: boolean;
}

function sanitizeDialInput(value: string): string {
  const cleaned = (value ?? "").replace(/[^\d+*#]/g, "");
  if (cleaned.startsWith("+")) {
    return `+${cleaned.slice(1).replace(/\+/g, "")}`;
  }
  return cleaned.replace(/\+/g, "");
}

export function useDialerState(initialDialCode: string = DEFAULT_DIAL_CODE): DialerState {
  const [number, setNumberState] = useState("");
  const [dialCode, setDialCodeState] = useState(initialDialCode);

  const append = useCallback((digit: string) => {
    setNumberState((prev) => prev + digit);
  }, []);

  const backspace = useCallback(() => {
    setNumberState((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => setNumberState(""), []);

  const setNumber = useCallback((value: string) => {
    setNumberState(sanitizeDialInput(value));
  }, []);

  const setDialCode = useCallback((code: string) => {
    setDialCodeState(countryByDialCode(code).code);
  }, []);

  const outbound = useMemo(() => buildOutboundNumber(number, dialCode), [number, dialCode]);

  return {
    number,
    dialCode,
    isInternational: number.startsWith("+"),
    append,
    backspace,
    clear,
    setNumber,
    setDialCode,
    outbound,
    canCall: outbound.length > 0,
  };
}
