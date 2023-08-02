import { NS } from '@ns';
import React from 'lib/react';
import UpdateHandler from 'monitor/update';

const daemonPrefix = "control/daemon";

export interface IDaemonProps {
  updateHandler: UpdateHandler
}

export const Daemon = ({ updateHandler }: IDaemonProps) => {
  const [status, setStatus] = React.useState({ isRunning: false });
  async function checkDaemon(ns: NS) {
    setStatus(s => ({
      ...s,
      isRunning: ns.ps('home').map(process => process.filename).some(fileName => fileName.includes(daemonPrefix))
    }));
  }
  React.useEffect(() => {
    updateHandler.register(checkDaemon);
    return () => updateHandler.unregister(checkDaemon);
  }, []);

  return (
    <div>
      Hello. Daemon is {status.isRunning ? "running" : "not running"}
    </div>
  )
}