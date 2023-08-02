import { formatDuration, formatMoney } from './lib/format.js';
import Constants from './data/constants.js';

/** @param {NS} ns */
export default function Targets(ns, host = 'home', targetsCount = Number.MAX_SAFE_INTEGER, filename = "") {
	let servers = [];
	recursiveScan(ns, servers, host);
	servers.forEach(s => setHackProps(ns, host, s));
	servers = servers.filter(s => s.ev > 0).sort((a, b) => b.ev - a.ev);
	servers.forEach(s => getStatus(ns, s));
	if(filename.length) ns.write(filename, JSON.stringify(servers), "w");
	return servers.slice(0, Math.min(targetsCount, servers.length));
}

function recursiveScan(ns, list, server) {
	list.push({ name: server, prepTime: getPrepTime(ns, server) });
	ns.scan(server).forEach(s => {
		if (!list.some(e => e.name === s)) recursiveScan(ns, list, s);
	})
}

/** 
 * @param {NS} ns 
 * @param {string} target
*/
function getPrepTime(ns, target) {
	if (ns.getServerMoneyAvailable(target) >= ns.getServerMaxMoney(target) &&
		ns.getServerSecurityLevel(target) <= ns.getServerMinSecurityLevel(target)) return 0;
	const weakenTime = ns.getWeakenTime(target);
	const growTime = ns.getGrowTime(target);
	return Math.max(weakenTime, growTime);
}

/** @param {NS} ns */
function setHackProps(ns, host, target) {
	const server = ns.getServer(target.name);
	const player = ns.getPlayer();
	server.hackDifficulty = server.minDifficulty;
	server.moneyAvailable = server.moneyMax;
	target.ev = getEV(ns, host, server, player);
}


/** 
 * @param {NS} ns 
 * @param {string} host
 * @param {Server} server
 * @param {Character} player
*/
function getEV(ns, host, server, player) {
	const cashPerHack = ns.formulas.hacking.hackPercent(server, player) * server.moneyMax;
	const hacktime = ns.formulas.hacking.hackTime(server, player);
	const weakentime = ns.formulas.hacking.weakenTime(server, player);
	const growtime = ns.formulas.hacking.growTime(server, player);
	const ramSecondsPerHack = (
		(hacktime * 1 * 1.70) +
		(weakentime * 2 * 1.75) +
		(growtime * 15 * 1.75)
	) / 1000;
	const hackChance = ns.formulas.hacking.hackChance(server, player);
	const cashPerSecond = (ns.getServerMaxRam(host) / ramSecondsPerHack) * cashPerHack;
	return cashPerSecond * hackChance;
}

/**
 * @param {NS} ns
 */
function getStatus(ns, serverResult) {
	serverResult.transientTarget = false;
	serverResult.persistentTarget = false;
	serverResult.maxMoney = ns.getServerMaxMoney(serverResult.name);
	serverResult.money = ns.getServerMoneyAvailable(serverResult.name);
	serverResult.minSecurity = ns.getServerMinSecurityLevel(serverResult.name);
	serverResult.security = ns.getServerSecurityLevel(serverResult.name);
	const attackers = [...ns.getPurchasedServers(), "home"];
	const allScripts = attackers.map(s => {
		const scripts = ns.ps(s);
		return scripts.map(script => `${s}: ${script.filename} ${script.args.join(' ')}`);
	}).flat();
	let scriptsTargetingServer = allScripts.filter(s => s.includes(`--target ${serverResult.name}`));
	scriptsTargetingServer = scriptsTargetingServer.filter(s => {
		for (const script of Constants.scripts.transient) {
			if (s.includes(script) && s.includes(`--target ${serverResult.name}`)) {
				serverResult.transientTarget = true;
				return false;
			}
		}
		for (const script of Constants.scripts.persistent) {
			if (s.includes(script) && s.includes(`--target ${serverResult.name}`)) {
				serverResult.persistentTarget = true;
				return false;
			}
		}
		return true;
	});

	if (scriptsTargetingServer.length > 0) ns.tprint(`WARN - Scripts found targeting server ${serverResult.name} were not registered as transient or persistent: `, scriptsTargetingServer);
}