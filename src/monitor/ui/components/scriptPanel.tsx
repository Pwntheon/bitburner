import React from "lib/react";
import useIsRunning from "monitor/hooks/useIsRunning";
import UpdateHandler from "monitor/update";
import { cssColors } from "/lib/styles";
import OnOffIndicator from "/monitor/ui/components/onOffIndicator";

export interface IScriptPanelProps {
  updateHandler: UpdateHandler,
  scriptName: string,
  name: string,
  children: React.ReactNode
}

export default function ScriptPanel({ updateHandler, scriptName, name, children }: IScriptPanelProps) {
  const isRunning = useIsRunning(updateHandler, scriptName);
  return (
    <div style={{
      padding: "8px 12px"
    }}>
      <div style={{
        borderBottom: `2px solid ${cssColors.main}`,
        padding: '5px 0',
        marginBottom: "-10px"
      }}>
        <OnOffIndicator isOn={isRunning} />
        <span> {name + (isRunning ? "" : " (Dead)")}</span>
      </div>
      <div style={{ marginLeft: "-7px" }}>
        <div style={{ lineHeight: 1 }}>┏</div>
        {children}
      </div>
    </div>
  );
}