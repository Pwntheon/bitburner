import { NS } from '@ns';
import React from 'lib/react';
import UpdateHandler from 'monitor/update';
import useIsRunning from 'monitor/hooks/useIsRunning';

export interface IDaemonProps {
  updateHandler: UpdateHandler
}

export default function Daemon({ updateHandler }: IDaemonProps) {
  const isRunning = useIsRunning(updateHandler, "control/daemon");

  return (
    <div>
      Hello. Daemon is {isRunning ? "running" : "not running"}
    </div>
  )
}