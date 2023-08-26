import React from 'lib/react';
import UpdateHandler from 'monitor/update';
import ScriptPanel from '/monitor/ui/components/scriptPanel';
import { formatMoney, formatRam } from '/lib/format';
import InfoElement from '/monitor/ui/components/textElement';
import { BatcherState } from '/lib/status/models';
import ProgressElement from '/monitor/ui/components/progressElement';

export interface IBatcherProps {
  updateHandler: UpdateHandler,
  state: BatcherState
}

export default function Batcher({ updateHandler, state }: IBatcherProps) {
  return (
    <ScriptPanel name="batcher" scriptName='batcher/controller.js' updateHandler={updateHandler}>
      <InfoElement label="Target" value={state.target} />
      <InfoElement label="Status" value="Hacking" />
      <InfoElement label="Income" value={formatMoney(state.income)} />
      <InfoElement label="Prepping" value={state.prepTarget} />
      <ProgressElement maxValue={state.prepDone - state.prepStarted} value={performance.now() - state.prepStarted} />
      <InfoElement label="Ram usage" value={formatRam(state.ramUsage)} />
      <InfoElement label="Dropped batches" value={(state.dropped * 100).toFixed(2) + "%"} isLast />
    </ScriptPanel>
  );
}
