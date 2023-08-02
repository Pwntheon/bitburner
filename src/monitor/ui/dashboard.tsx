import { NS, NetscriptPort } from '@ns';
import React from 'lib/react';
import UpdateHandler from 'monitor/update';
import Daemon from 'monitor/ui/daemon';
import { ShotgunStatus } from 'models/status/shotgun';
import { StatusMessage } from 'models/status/message';
import Shotgun from 'monitor/ui/shotgun';

export interface IDashboardProps {
  ns: NS
  updateHandler: UpdateHandler,
  port: NetscriptPort
}

export const Dashboard = ({ ns, updateHandler, port }: IDashboardProps) => {
  const [shotgunStatus, setShotgunStatus] = React.useState({ target: "", prepping: "", income: 0, dropped: 0, ramUsage: 0 } as ShotgunStatus);


  async function getStatusMessages(ns: NS) {
    const port = ns.getPortHandle(ns.pid); 
    const messages = [];
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
  React.useCallback(() => {
    updateHandler.register(getStatusMessages);
    return () => updateHandler.unregister(getStatusMessages);
  }, []);

  return (
    <div>
      <Daemon updateHandler={updateHandler} />
      <Shotgun updateHandler={updateHandler} />
    </div>
  )
}