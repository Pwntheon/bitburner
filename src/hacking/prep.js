import Arguments from './lib/arguments.js';
import Constants from './data/constants.js';
const grow = 'utils/grow.js';
const weaken = 'utils/weaken.js';
const gracePeriod = 500;

const a = new Arguments([
	['target', (d) => d.servers],
	['host', 'home']
]);

export function autocomplete(data, args) {
	return a.autocomplete(data, args);
}

/** @param {NS} ns */
export async function main(ns) {
	const { target, host } = a.getOptions(ns);

	const maxMoney = ns.getServerMaxMoney(target);
	const minSecurity = ns.getServerMinSecurityLevel(target);

	while (ns.getServerSecurityLevel(target) > minSecurity || ns.getServerMoneyAvailable(target) < maxMoney) {
		const free = (ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) - Constants.reserve;
		const security = ns.getServerSecurityLevel(target);
		const money = ns.getServerMoneyAvailable(target);
		if (security > minSecurity) {
			const size = ns.getScriptRam(weaken);
			const maxThreads = Math.floor(free / size);
			const optimalThreads = Math.ceil((security - minSecurity) * 20);
			const threads = Math.min(maxThreads, optimalThreads);
			const time = ns.getWeakenTime(target);
			ns.exec(weaken, host, { temporary: true, threads }, '--target', target);
			await ns.sleep(time + gracePeriod);
		} else if (money < maxMoney) {
			const multiplier = (maxMoney / money * 100);
			const cores = ns.getServer(host).cpuCores;
			const size = ns.getScriptRam(grow);
			const maxThreads = Math.floor(free / size);
			const optimalThreads = Math.ceil(ns.growthAnalyze(target, multiplier, cores));
			const threads = Math.min(maxThreads, optimalThreads);
			const time = ns.getGrowTime(target);
			ns.exec(grow, host, { temporary: true, threads }, '--target', target);
			await ns.sleep(time + gracePeriod);
		}
	}

	ns.tprint(`${target} prepped. Money: ${ns.getServerMoneyAvailable(target)}/${maxMoney} Security: ${ns.getServerSecurityLevel(target)}/${minSecurity}`);
}