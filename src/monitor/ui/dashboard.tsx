import { NS, NetscriptPort } from '@ns';
import React from 'lib/react';
import UpdateHandler from 'monitor/update';
import { Daemon } from 'monitor/ui/daemon';

export interface IDashboardProps {
  ns: NS
  updateHandler: UpdateHandler,
  port: NetscriptPort
}

export const Dashboard = ({ ns, updateHandler, port }: IDashboardProps) => {

  async function test(ns: NS) {
    console.log("Hi");
  }
  React.useCallback(() => {
    updateHandler.register(test);
    return () => updateHandler.unregister(test);
  }, []);
  return (
    <div>
      <Daemon updateHandler={updateHandler} />
    </div>
  )
}