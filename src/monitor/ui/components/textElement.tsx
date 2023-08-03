import React from "/lib/react";

export interface IInfoElementProps {
  label: string,
  value: string,
  isLast?: boolean
}

export default function InfoElement({ label, value, isLast = false }: IInfoElementProps, ) {
  const prefix = isLast ? "┗" : "┣";
  return (
    <div style={{ lineHeight: 1}}>
      <span>{prefix} </span>
      <span>{label}: </span>
      <span>{value}</span>
    </div>
  );
}