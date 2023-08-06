import { NS, NetscriptPort } from "@ns";
import { StatusMessage } from "/lib/status/models";

export default class SatusReader {
  ns: NS;
  port: NetscriptPort;
  constructor(ns: NS, port: NetscriptPort) {
    this.ns = ns;
    this.port = port;
  }

  getMessages(): StatusMessage[] {
    const messages: StatusMessage[] = [];
    while(!this.port.empty()) {
      const message = JSON.parse(this.port.read() as string) as StatusMessage;
      const index = messages.findIndex(m => m.component === message.component);
      if(index === -1) messages.push(message);
      else messages[index] = message;
    }
    return messages;
  }
}