import { formatDuration } from './lib/format.js';

/** @param {NS} ns */
export async function main(ns) {
  const job = JSON.parse(ns.args[0]);
  let delay = job.end - job.time - performance.now();
  console.log({ delay, job });
  if (delay < 0) {
    ns.tprint(`WARN - ${job.type} job from batch ${job.batch} was ${formatDuration(-delay)} late.`);
    delay = 0;
  }
  console.log("Weaken started");
  const startTs = performance.now();
  await ns.weaken(job.target, { additionalMsec: delay, threads: job.threads });
  console.log("Weaken done after ", performance.now() - startTs, "ms");

  // ns.writePort(job.logPort, JSON.stringify({type: job.type, batch: job.batch, target: job.target, skill: job.skill}));
}