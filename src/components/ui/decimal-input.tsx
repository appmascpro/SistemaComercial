"use client";

import { useEffect, useRef, useState } from "react";
import { parseDecimalInput } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DecimalInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  placeholder?: string;
}

export function DecimalInput({
  value,
  onChange,
  className,
  min,
  placeholder,
}: DecimalInputProps) {
  const lastExternal = useRef(value);
  const [text, setText] = useState(() =>
    Number.isFinite(value) ? String(value).replace(".", ",") : ""
  );

  useEffect(() => {
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setText(Number.isFinite(value) ? String(value).replace(".", ",") : "");
    }
  }, [value]);

  function commit(raw: string) {
    const parsed = parseDecimalInput(raw);
    if (parsed === null) {
      setText(
        Number.isFinite(lastExternal.current)
          ? String(lastExternal.current).replace(".", ",")
          : ""
      );
      return;
    }
    const next = min != null && parsed < min ? min : parsed;
    lastExternal.current = next;
    onChange(next);
    setText(String(next).replace(".", ","));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit((e.target as HTMLInputElement).value);
        }
      }}
      className={cn(className)}
    />
  );
}
