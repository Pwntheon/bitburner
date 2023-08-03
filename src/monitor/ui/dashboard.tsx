import { NS, NetscriptPort } from '@ns';
import React from 'lib/react';
import UpdateHandler from 'monitor/update';
import Daemon from 'monitor/ui/daemon';
import { ShotgunStatus } from '../../models/state/batcher';
import { StatusMessage } from '/models/state/message';
import Shotgun from 'monitor/ui/shotgun';

export interface IDashboardProps {
  ns: NS
  updateHandler: UpdateHandler,
  port: NetscriptPort
}

export const Dashboard = ({ ns, updateHandler, port }: IDashboardProps) => {
  const [shotgunStatus, setShotgunStatus] = React.useState({ target: "", prepTarget: "", income: 0, dropped: 0, ramUsage: 0, hackStart: 0, prepDone: 0 } as ShotgunStatus);

  async function getStatusMessages(ns: NS) {
    const port = ns.getPortHandle(ns.pid);
    while (!port.empty()) {
      const message = JSON.parse(port.read() as string) as StatusMessage;
      switch (message.component) {
        case "shotgun":
          setShotgunStatus(message.status);
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
      <Shotgun updateHandler={updateHandler} status={shotgunStatus} />
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
  transform: translateY(0.2px);
}
`;