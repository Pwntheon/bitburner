import { NS } from "@ns";

const interval = 1;
const warnDelay = 1000;

export function run(ns: NS, host: string, threads: number, script: string, ...args: any) {
  const free = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
  if (free < ns.getScriptRam(script, host) * threads) {
    ns.print(`WARN - Not enough memory to run ${script} on ${host} with ${threads} threads. (${ns.formatRam(free)} free)`);
    return 0;
  }
  const pid = ns.exec(script, host, threads, ...args)
  if (pid === 0) {
    ns.print(`WARN - Failed to run ${script} on ${host} for unknown reasons`);
    ns.tail();
  }
  return pid;
}

export async function runAsync(ns: NS, script: string): Promise<number> {
  const host = ns.getHostname();
  let pid = 0;
  let waited = 0;
  let warned = false;
  async function wait() {
    waited += interval;
    await ns.sleep(interval);
    if (waited > warnDelay && !warned) {
      ns.tprint(`WARN - Failed to execute ${script}`);
      warned = true;
    }
  }

  while (pid === 0) {
    pid = ns.exec(script, host, { temporary: true, threads: 1 });
    if(pid === 0) await wait();
  }

  while(ns.getRunningScript(pid) !== null) await wait();

  return pid;
}

export function isRunningOnHome(ns: NS, filename: string) {
  return ns.ps('home').map(process => process.filename).some(fileName => fileName.includes(filename));
}