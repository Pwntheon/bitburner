import GetAttackers from './lib/attackers.js';
import GetTargets from './lib/targets.js';
import Constants from './data/constants.js';
import { formatDuration, formatMoney } from './lib/format.js';
import Publish from '../lib/status/publish.js';

const types = ['hack', 'weaken1', 'grow', 'weaken2'];
const scripts = {
  hack: 'shotgun/utils/hack.js',
  weaken1: 'shotgun/utils/weaken.js',
  grow: 'shotgun/utils/grow.js',
  weaken2: 'shotgun/utils/weaken.js',
};

const ramCosts = {
  hack: 1.7,
  weaken1: 1.75,
  grow: 1.75,
  weaken2: 1.75,
};

const offsets = {
  hack: 0,
  weaken1: 1,
  grow: 2,
  weaken2: 3,
};

const initialDelay = 100;
const spacer = 20;
const growthHeadroom = 1.05;
const weakenHeadroom = 1.05;
const children = [];
const hackPids = [];

class Timer {
  constructor(waitTime) {
    this.setTime(waitTime);
  }

  setTime(waitTime) {
    this.waitTime = waitTime;
    this.created = Date.now();
  }

  isDone() {
    if (this.waitTime === 0) return false;
    if (this.created + this.waitTime < Date.now()) return true;
    return false;
  }
}

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  const logPort = ns.exec('/utils/logger.js', 'home', { threads: 1, temporary: true }, ns.pid);
  children.push(logPort);
  ns.atExit(() => {
    //ns.closeTail(logPort);
    children.forEach(cPid => ns.kill(cPid))
  });
  const ramnet = new RamNet(ns);
  const targets = GetTargets(ns).map(t => {
    const details = new ServerDetails(ns, t.name);
    details.batchCount = setGreed(ns, ramnet, details);
    details.ev = (1000 * details.chance * details.batchCount * details.cashPerBatch) / details.times.weaken1;
    return details;
  }).sort((a, b) => b.ev - a.ev);

  let prepTimer = new Timer(0);

  if (!targets[0].isPrepped) {
    ns.print("Best target not prepped:");
    ns.print(targets[0].getString(ns));
    const prepDelay = await prep(ns, targets[0], ramnet);
    prepTimer.setTime(prepDelay);
  }

  let preppedTargets = targets.filter(t => isPrepped(ns, t.hostname));

  if (preppedTargets.length === 0) {
    ns.print("No prepped servers available. Prepping the fastest one while we wait");
    let fastest = targets.sort((a, b) => a.times.weaken1 - b.times.weaken1)[0];
    const delay = await prep(ns, fastest, ramnet);
    await ns.sleep(delay);
  }

  preppedTargets = targets.filter(t => isPrepped(ns, t.hostname));
  if (preppedTargets.length === 0) {
    ns.print("WARN - No prepped servers after prep. Something wrong!");
    ns.tail();
    ns.exit();
  }

  ns.tprint("Targets evaluation:");
  targets.forEach(t => ns.tprint(`${t.hostname.padStart(20)}: ${formatMoney(t.ev).padStart(10)}/sec`));

  const target = preppedTargets[0];

  const initialWeakenTime = target.times.weaken1;


  const controlPort = ns.getPortHandle(ns.pid);
  controlPort.clear();

  await ns.sleep(1000);

  const batchCount = setGreed(ns, ramnet, target);

  ns.write('data/target.txt', target.hostname, "w");
  ns.print(`Targeting ${target.hostname}`);
  ns.print(`Greed of ${ns.formatNumber(target.greed * 100, 0)}% results in ${ramnet.calculateMaxBatches(ns, target.batchCost)} batches.`);
  ns.print(`h: ${target.threads.hack}, w1: ${target.threads.weaken1} g: ${target.threads.grow}, w2: ${target.threads.weaken2}`);
  ns.print(`Actual # of batches, taking timing into account: ${batchCount}`);

  const jobs = [];
  let batchIndex
  for (batchIndex = 0; batchIndex < batchCount; ++batchIndex) {
    jobs.push(createBatch(ns, target, batchIndex, logPort, spacer, 0));
  }

  while (jobs.length > 0) {
    ramnet.deploy(ns, jobs.shift(), target);
    await ns.sleep(spacer / 2);
  }

  let exit = false;
  let skillDelta = 0;
  let oldWeakenTime = target.times.weaken1;
  let lastDeploy = performance.now();
  let desyncCount = 0;
  let killCount = 0;
  while (!exit) {
    if (prepTimer.isDone()) {
      ns.print("Prepping of better server completed. Restarting.");
      ns.spawn("shotgun/controller.js", 1, '--tail');
    }
    await controlPort.nextWrite();
    while (!controlPort.empty()) {
      const delta = performance.now() - lastDeploy;
      if (delta < spacer / 2) await ns.sleep(spacer / 2);
      const message = JSON.parse(controlPort.read());
      const { batch, error, order } = message;
      if (error === "desync") {
        desyncCount++;
        ns.print(`WARN - batch ${batch} desynced. Desync count: ${desyncCount}. Hack threads killed so far in order to catch up: ${killCount} (${ns.formatNumber(100 * (killCount / batchCount), 1)}% of batches) - order: ${order}`);
      }
      await waitForReady(ns, target, batch, message);
      let timeGained = oldWeakenTime - target.times.weaken1;
      if (timeGained > 0) {
        skillDelta += timeGained;
        oldWeakenTime = target.times.weaken1;
        ns.print(`Skillup detected. Adding ${formatDuration(timeGained)} to skillDelta (${formatDuration(skillDelta)}). Time spent: ${ns.formatNumber(100 * (initialWeakenTime / target.times.weaken1), 1)}% of optimal.`);
      }
      ramnet.deploy(ns, createBatch(ns, target, ++batchIndex, logPort, 0, skillDelta), target);
      lastDeploy = performance.now();
    }
  }
}

/** @param {NS} ns */
async function waitForReady(ns, target, lastBatch, message) {
  let killCount = 0;
  let retries = 0;
  do {
    ++retries;
    target.refresh2(ns);
    if (!target.isPrepped) {
      let batchId = lastBatch;
      while (!ns.kill(hackPids[batchId])) ++batchId;
      await ns.sleep(spacer / 2);
      ++killCount;
      ns.print(`WARN - Target not prepped, and the next batch will hit soon. Killed hack from batch ${batchId}, which is ${batchId - lastBatch} ahead`);
    }
  } while (!target.isPrepped);
  return killCount;
}

function createBatch(ns, target, batch, logPort, batchSpacer = 0, skillDelta = 0) {
  const result = [];
  for (const type of types) {
    target.ends[type] = performance.now() + target.times.weaken1 + (batch * batchSpacer) + offsets[type] + initialDelay + skillDelta;
    result.push(new Job(target, batch, type, logPort));
  }
  return result;
}

function setGreed(ns, ramnet, target) {
  const timingMax = Math.floor((target.times.weaken1 / spacer) - (initialDelay / target.times.weaken1));
  const increment = 0.01;
  target.refresh2(ns, increment);
  for (let greed = increment; greed < 1 && ramnet.calculateMaxBatches(ns, target.batchCost) > timingMax; greed += increment) {
    target.refresh2(ns, greed);
  }
  return Math.min(timingMax, ramnet.calculateMaxBatches(ns, target.batchCost));
}

/** @param {NS} ns */
async function prep(ns, server, ramnet) {
  const target = server.hostname;
  let time = 0;
  let done = false;
  while (!done) {
    const targetServer = ns.getServer(target);
    const player = ns.getPlayer();
    const buffer = 1.1;
    const spacer = 1000;
    const maxMoney = ns.getServerMaxMoney(target);
    const money = ns.getServerMoneyAvailable(target);
    const minSecurity = ns.getServerMinSecurityLevel(target);
    const security = ns.getServerSecurityLevel(target);

    let weaken1threads = Math.ceil((security - minSecurity) * 20 * buffer);
    const multiplier = (maxMoney / money);
    targetServer.security = minSecurity;
    let growThreads = Math.ceil(ns.formulas.hacking.growThreads(targetServer, player, maxMoney, 1) * buffer);
    const securityGain = ns.growthAnalyzeSecurity(growThreads);
    let weaken2threads = Math.ceil(securityGain * 20 * buffer);

    const weakenTime = ns.getWeakenTime(target);
    const growTime = ns.getGrowTime(target);
    const longestDelay = Math.max(weakenTime, growTime)
    const weakenDelay = longestDelay - weakenTime;
    const growDelay = longestDelay - growTime;
    const jobs = [];
    jobs.push({ script: 'utils/weaken.js', threads: weaken1threads, delay: weakenDelay + (spacer * 0) });
    jobs.push({ script: 'utils/grow.js', threads: growThreads, delay: growDelay + (spacer * 1) });
    jobs.push({ script: 'utils/weaken.js', threads: weaken2threads, delay: weakenDelay + (spacer * 2) });

    ns.print(`Prepping ${target}. Will take ${formatDuration(weakenTime + (spacer * 2))}. Threads: ${jobs.map(j => j.threads).join(", ")}.`);
    done = ramnet.deployPrep(ns, target, jobs);
    if (!done) {
      ns.print(`Not enough memory to prep ${target}. Remaining threads: ${jobs.map(j => j.threads).join(", ")}. Waiting ${formatDuration(weakenTime + (spacer * 3))} before launching more.`);
      await ns.sleep(weakenTime + (spacer * 3));
    }
    time = weakenTime + (spacer * 3);
  }
  ns.print(`All prep jobs launched, Done in ${formatDuration(time)}`);
  return time;
}

class RamNet {
  /** @param {NS} ns */
  constructor(ns) {
    this.attackers = GetAttackers(ns);
    this.attackers.filter(a => a.name !== "home").forEach(a => {
      children.push(ns.exec("utils/deploy.js", "home", 1, a.name));
    });
    this.hasProcessed = [];
  }

  getRamUsage(ns) {
    const total = this.attackers.reduce((acc, curr) => acc + ns.getServerMaxRam(curr.name), 0);
    const free = this.attackers.reduce((acc, curr) => acc + this.free(ns, attacker), 0);
    const used = total - free;
    return { total, free, used };
  }

  /** @param {NS} ns*/
  deployPrep(ns, target, jobs) {
    const scriptSize = 1.75;
    for (const job of jobs) {
      while (job.threads > 0) {
        const attacker = this.getLargestAttacker(ns);
        const threads = Math.min(job.threads, Math.floor(this.free(ns, attacker) / scriptSize));

        if (threads <= 0) return false;

        const pid = ns.exec(job.script, attacker.name, { threads: threads, temporary: true }, '--target', target, '--delay', job.delay);
        if (!pid) {
          ns.print("WARN - prep job failed to deploy");
        } else {
          children.push(pid);
          job.threads -= threads;
        }
      }
    }
    return true;
  }

  getLargestAttacker(ns) {
    return this.attackers.sort((a, b) => this.free(ns, b) - this.free(ns, a))[0];
  }

  calculateMaxBatches(ns, batchSize) {
    return this.attackers.reduce((acc, hostname) => acc + Math.floor(this.free(ns, hostname) / batchSize), 0);
  }

  /** @param {NS} ns */
  free(ns, attacker) {
    let used = ns.getServerUsedRam(attacker.name);
    if (attacker.name === "home") used = Math.max(0, used + Constants.reserve);
    return ns.getServerMaxRam(attacker.name) - used;
  }

  /** @param {NS} ns */
  deploy(ns, batch, target) {
    const attacker = this.attackers.find(a => this.free(ns, a) > target.batchCost);
    this.hasProcessed.push(batch[0].batch);
    if (attacker) {
      batch.forEach(job => this.execute(ns, job, attacker));
    } else {
      ns.print(`WARN - Couldn't find attacker with free memory for batch ${batch[0].batch}`);
    }

  }

  execute(ns, job, attacker) {
    let test = 0;
    const pid = ns.exec(job.script, attacker.name, { threads: job.threads, temporary: true }, JSON.stringify({ ...job, skill: ns.getPlayer().skills.hacking }));
    if (pid === 0) ns.tprint(`WARN - Failed to execute job ${job.type} from batch ${job.batch}!`);
    if (job.type === "hack") hackPids[job.batch] = pid;

    children.push(pid);
  }
}

class ServerDetails {
  /** @param {NS} ns */
  constructor(ns, hostname) {
    this.hostname = hostname;
    this.greed = 1;
    this.times = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
    this.ends = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
    this.threads = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
    this.port = ns.pid;

    this.refresh2(ns);
  }

  getString(ns) {
    let result = this.hostname;
    result += " (";
    result += (this.isPrepped ? "Prepped" : "Unprepped");
    result += ") ";
    result += "Security: ";
    result += ns.formatNumber(this.sec, 1);
    result += "/";
    result += ns.formatNumber(this.minSec, 1);
    result += " (";
    result += ns.formatNumber(100 * (this.sec / this.minSec), 1);
    result += "%) "
    result += "Cash: ";
    result += formatMoney(this.money);
    result += "/";
    result += formatMoney(this.maxMoney);
    result += " (";
    result += ns.formatNumber(100 * (this.money / this.maxMoney), 1);
    result += "%)";
    return result;
  }

  /** @param {NS} ns */
  refresh2(ns, greed = this.greed) {
    this.greed = greed;
    this.player = ns.getPlayer();
    this.server = ns.getServer(this.hostname);
    this.maxMoney = ns.getServerMaxMoney(this.hostname);
    this.money = ns.getServerMoneyAvailable(this.hostname);
    this.minSec = ns.getServerMinSecurityLevel(this.hostname);
    this.sec = ns.getServerSecurityLevel(this.hostname);
    this.isPrepped = isPrepped(ns, this.hostname);

    const preppedServer = ns.getServer(this.hostname);
    preppedServer.hackDifficulty = this.minSec;
    preppedServer.moneyAvailable = this.maxMoney;
    this.chance = ns.formulas.hacking.hackChance(this.server, this.player);
    this.times.hack = ns.formulas.hacking.hackTime(preppedServer, this.player);
    this.times.weaken1 = ns.formulas.hacking.weakenTime(preppedServer, this.player);
    this.times.weaken2 = this.times.weaken1;
    this.times.grow = ns.formulas.hacking.growTime(preppedServer, this.player);

    const hackPercent = ns.formulas.hacking.hackPercent(preppedServer, this.player);

    this.threads.hack = Math.max(1, Math.floor(this.greed / hackPercent))
    this.cashPerBatch = this.maxMoney * hackPercent * this.threads.hack;
    preppedServer.moneyAvailable -= this.cashPerBatch;
    this.threads.grow = Math.ceil(growthHeadroom * ns.formulas.hacking.growThreads(preppedServer, this.player, this.maxMoney));
    this.threads.weaken1 = Math.ceil(weakenHeadroom * ((this.threads.hack * 0.002) / 0.05));
    this.threads.weaken2 = Math.ceil(weakenHeadroom * ((this.threads.grow * 0.004) / 0.05));

    this.batchCost = types.reduce((acc, type) => acc + (ramCosts[type] * this.threads[type]), 0);
  }

  /** @param {NS} ns */
  refresh(ns, greed = this.greed) {
    this.greed = greed;
    this.player = ns.getPlayer();
    this.server = ns.getServer(this.hostname);
    this.maxMoney = ns.getServerMaxMoney(this.hostname);
    this.money = ns.getServerMoneyAvailable(this.hostname);
    this.minSec = ns.getServerMinSecurityLevel(this.hostname);
    this.sec = ns.getServerSecurityLevel(this.hostname);
    this.isPrepped = isPrepped(ns, this.hostname);
    this.chance = ns.formulas.hacking.hackChance(this.server, this.player);

    this.times.hack = ns.getHackTime(this.hostname);
    this.times.weaken1 = ns.getWeakenTime(this.hostname);
    this.times.weaken2 = ns.getWeakenTime(this.hostname);
    this.times.grow = ns.getGrowTime(this.hostname);

    const hackPercent = ns.hackAnalyze(this.hostname);
    this.cashPerBatch = this.maxMoney * greed;
    this.threads.hack = Math.max(1, Math.floor(ns.hackAnalyzeThreads(this.hostname, this.cashPerBatch)));

    this.threads.grow = Math.ceil(growthHeadroom * ns.growthAnalyze(this.hostname, this.maxMoney / (this.maxMoney - (this.maxMoney * hackPercent * this.threads.hack))));
    this.threads.weaken1 = Math.ceil(weakenHeadroom * ((this.threads.hack * 0.002) / 0.05));
    this.threads.weaken2 = Math.ceil(weakenHeadroom * ((this.threads.grow * 0.004) / 0.05));

    this.batchCost = types.reduce((acc, type) => acc + (ramCosts[type] * this.threads[type]), 0);
  }
}

class Job {
  constructor(target, batch, type, logPort = 0) {
    this.batch = batch;
    this.type = type;
    this.script = scripts[type];
    this.end = target.ends[type];
    this.time = target.times[type];
    this.threads = target.threads[type];
    this.target = target.hostname;
    this.logPort = logPort;
  }
}

function isPrepped(ns, server) {
  const epsilon = 0.0001;
  const maxMoney = ns.getServerMaxMoney(server);
  const money = ns.getServerMoneyAvailable(server);
  const minSec = ns.getServerMinSecurityLevel(server);
  const sec = ns.getServerSecurityLevel(server);
  const secOk = Math.abs(sec - minSec) < epsilon;
  const moneyOk = Math.abs(maxMoney - money) < epsilon;
  return secOk && moneyOk;
}