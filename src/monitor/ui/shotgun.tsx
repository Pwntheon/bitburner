import { NS } from '@ns';
import React from 'lib/react';
import UpdateHandler from 'monitor/update';
import useIsRunning from 'monitor/hooks/useIsRunning';

export interface IShotgunProps {
  updateHandler: UpdateHandler
}

export default function Shotgun({updateHandler}: IShotgunProps) {
  const isRunning = useIsRunning(updateHandler, "shotgun/controller.js");
  return(
    <div>
      Shotgun controller is {isRunning ? "running" : "not running"}.
    </div>
  );
}