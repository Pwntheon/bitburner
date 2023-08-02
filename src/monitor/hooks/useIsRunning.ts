import { NS } from "@ns";
import UpdateHandler from "monitor/update";
import React from "lib/react";
import { isRunningOnHome } from "lib/process";

export default function useIsRunning(handler: UpdateHandler, scriptName: string) {
  const [isRunning, setIsRunning] = React.useState(false);
  async function checkIsRunning(ns: NS) {
    setIsRunning(isRunningOnHome(ns, scriptName));
  }

  React.useEffect(() => {
    handler.register(checkIsRunning);
    return () => handler.unregister(checkIsRunning);
  }, []);
  return isRunning;
}