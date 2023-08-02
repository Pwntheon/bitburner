import { NS } from "@ns";
import { StatusMessage } from "models/status/message";

const monitorScript = "monitor/monitor.js";
const host = 'home';


export default function Publish(ns: NS, message: StatusMessage) {
  const process = ns.ps(host).find(process => process.filename.includes(monitorScript));
  
  const pid = (process === undefined
    ? ns.exec(monitorScript, host)
    : process.pid);

  if(pid === 0) {
    ns.tprint("WARN - Could not find or launch monitor script");
    return;
  }

  const port = ns.getPortHandle(pid);
  port.write(JSON.stringify(message));
}