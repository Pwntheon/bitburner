import { NS } from "@ns";
import { State } from "/lib/status/models";
import Publish from "/lib/status/publish";

export class StatusReporter {
  ns: NS;
  component: string;
  state: State;
  constructor(ns: NS, component: string, initialState: State) {
    this.ns = ns;
    this.component = component;
    this.state = initialState;
  }
  
  update(propName: string, value: unknown) {
    const oldValue = this.state[propName];
    if(typeof oldValue !== typeof value) throw Error("Attempting to set invalid value");
    this.state[propName] = value as typeof oldValue;
    Publish(this.ns, {component: this.component, status: this.state});
  }
}