import React from 'lib/react';
import UpdateHandler from 'monitor/update';
import useIsRunning from 'monitor/hooks/useIsRunning';
import ScriptPanel from '/monitor/ui/components/scriptPanel';
import { ShotgunStatus } from '/models/status/shotgun';
import { formatMoney, formatRam } from '/lib/format';
import InfoElement from '/monitor/ui/components/textElement';

export interface IShotgunProps {
  updateHandler: UpdateHandler,
  status: ShotgunStatus
}

export default function Shotgun({ updateHandler, status }: IShotgunProps) {
  const isRunning = useIsRunning(updateHandler, "shotgun/controller.js");
  const test = [];
  return (
    <ScriptPanel name="Shotgun" scriptName='shotgun/controller.js' updateHandler={updateHandler}>
      <InfoElement label="Target" value={status.target} />
      <InfoElement label="Status" value="Hacking" />
      <InfoElement label="Income" value={formatMoney(status.income)} />
      <InfoElement label="Next target" value={status.prepTarget} />
      <InfoElement label="Ram usage" value={formatRam(status.ramUsage)} />
      <InfoElement label="Dropped batches" value={status.dropped + "%"} isLast />
    </ScriptPanel>
  );
}
