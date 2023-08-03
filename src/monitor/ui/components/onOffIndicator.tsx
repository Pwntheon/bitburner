import React from 'lib/react';
import { cssColors } from 'lib/styles';

export interface IOnOffIndicatorProps {
  isOn: boolean
}

export default function OnOffIndicator({ isOn }: IOnOffIndicatorProps) {
  const color = isOn ? cssColors.main : cssColors.error;
  return (<span style={{
    display: 'inline-block',
    transform: 'translateY(1px)',
    textShadow: `
    0px 0px 5px ${color},
    0px 0px 10px ${color}
    `,
    color: color,
    lineHeight: 1,
    fontSize: "130%"
  }}>●</span>);
}