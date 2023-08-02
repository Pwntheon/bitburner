import Arguments from './lib/arguments.js';
import { formatMoney, formatDuration } from './lib/format.js';

const grow = 'utils/grow.js';
const weaken = 'utils/weaken.js';
const gracePeriod = 500;
const buffer = 1.1;

const a = new Arguments([
	['target', (d) => d.servers],
	['host', 'home']
]);

export function autocomplete(data, args) {
	return a.autocomplete(data, args);
}

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	const options = a.getOptions(ns);
	const { target, host } = options;
	let execute = true;

	const maxMoney = ns.getServerMaxMoney(target);
	const minSecurity = ns.getServerMinSecurityLevel(target);
	const free = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
	const security = ns.getServerSecurityLevel(target);
	const money = ns.getServerMoneyAvailable(target);
	const scriptSize = 1.75;
	const cores = ns.getServer(host).cpuCores;

	const initialWeakenThreads = Math.ceil((security - minSecurity) * 20 * buffer);
	const multiplier = (maxMoney / money);
	const growThreads = Math.ceil(ns.growthAnalyze(target, multiplier, cores) * buffer);
	const securityGain = ns.growthAnalyzeSecurity(growThreads, target, cores);
	const lastWeakenTheads = Math.ceil(securityGain * 20 * buffer);
	const weakenTime = ns.getWeakenTime(target);
	const growTime = ns.getGrowTime(target);
	const longestDelay = Math.max(weakenTime, growTime)
	const weakenDelay = longestDelay - weakenTime;
	const growDelay = longestDelay - growTime;

	const totalRamCost = (initialWeakenThreads + growThreads + lastWeakenTheads) * scriptSize;


	ns.print(`Analyzed ${target} for prep. Security: ${security}/${minSecurity}, Money: ${formatMoney(money)}/${formatMoney(maxMoney)}`);
	ns.print(`Threads needed for batch prepping`);
	ns.print(`Initial weaken: ${initialWeakenThreads}`);
	ns.print(`Grow: ${growThreads}`);
	ns.print(`Last weaken: ${lastWeakenTheads}`);
	ns.print(`Total ram cost: ${ns.formatRam(totalRamCost)}/${ns.formatRam(free)} - ${totalRamCost / free * 100}% of free memory.`);
	ns.print(`Weaken time: ${formatDuration(weakenTime)} (Delay for ${formatDuration(weakenDelay)})`);
	ns.print(`Grow time: ${formatDuration(growTime)} (Delay for ${formatDuration(growDelay)})`);

	if (totalRamCost > free) {
		ns.print("--- Could not prep: Not enough free memory ---")
		execute = false;
	}

	if (!execute) {
		ns.tail();
	} else {
		let tasks = [
			// Initial weaken
			{ wait: weakenDelay + gracePeriod * 1, script: weaken, threads: initialWeakenThreads, done: false },
			// Grow
			{ wait: growDelay + gracePeriod * 2, script: grow, threads: growThreads, done: false },
			// Last weaken
			{ wait: weakenDelay + gracePeriod * 3, script: weaken, threads: lastWeakenTheads, done: false },
		].filter(t => t.threads > 0);

		ns.print("Tasks: ", tasks);
		let now = 0;
		while (tasks.length > 0) {
			for (const task of tasks) {
				if (now >= task.wait) {
					ns.print(`Running task ${task.script} with ${task.threads} threads after ${formatDuration(task.wait)} delay`);
					ns.exec(task.script, host, task.threads, '--target', target);
					task.done = true;
				}
			}
			tasks = tasks.filter(t => !t.done);
			await ns.sleep(gracePeriod);
			now += gracePeriod;
		}
	}
}