import { NS, NetscriptPort } from '@ns';
import React from 'lib/react';
import UpdateHandler from 'monitor/update';
import Batcher from '/monitor/ui/batcher';
import StatusReader from '/lib/status/reader';
import { BatcherState, BatcherStateDefaults } from '/lib/status/models';
import { cssColors } from '/lib/styles';

export interface IDashboardProps {
  ns: NS,
  updateHandler: UpdateHandler,
  port: NetscriptPort
}

export const Dashboard = ({ ns, updateHandler, port }: IDashboardProps) => {
  const [batcherState, setBatcherState] = React.useState({ ...BatcherStateDefaults } as BatcherState);

  const reader = React.useMemo(() => new StatusReader(ns, port), []);

  async function getStatusMessages() {
    for (const message of reader.getMessages()) {
      switch (message.component) {
        case "batcher":
          setBatcherState(message.status);
          return;
        default:
          throw Error("Received status message with unhandled type");
      }
    }
  }
  React.useEffect(() => {
    updateHandler.register(getStatusMessages);
    return () => updateHandler.unregister(getStatusMessages);
  }, []);

  return (
    <div className="monitor-dashboard">
      <Batcher updateHandler={updateHandler} state={batcherState} />
      <style>
        {styles}
      </style>
    </div>
  )
}

/*

      <progress max="100" value="80"></progress>
      */

const styles = `
.monitor-dashboard {
  display: flex;
}

.monitor-dashboard progress[value] {
  -webkit-appearance:none;
  height: 4px;
}

.monitor-dashboard progress[value]::-webkit-progress-value {
  background-color: ${cssColors.highlight}
}

.monitor-dashboard progress[value]::-webkit-progress-bar {
  background-color: ${cssColors.darkGray}
}
`;