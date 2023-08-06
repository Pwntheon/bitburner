import React from "/lib/react";

export interface IProgressElementProps {
  maxValue: number,
  value: number
}

export default function ProgressElement({ value, maxValue }: IProgressElementProps,) {
  return (
    <div style={{ lineHeight: 1, display: "flex", alignItems: "center" }}>
      <span>┃ </span>
      <progress value={value} max={maxValue} style={{ flexGrow: 1 }} />
    </div>
  );
}