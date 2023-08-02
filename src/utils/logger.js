const expectedOrder = [
	'hack', 'weaken1', 'grow', 'weaken2'
];


/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	const done = [];

	// Report here when batch is done
	let controllerPort = ns.args[0];

	// Our port for receiving job finish reports
	const logPort = ns.getPortHandle(ns.pid);
	logPort.clear();


	// Run forever, or until something breaks i guess
	let exit = false;
	while (!exit) {

		// Wait for and read report
		const job = await nextReport(ns, logPort);
		if (!logPort.empty) {
			ns.print("WARN - Can't process messages fast enough!");
			ns.exit();
		}

		// Debug block
		const cashPercent = 100 * (ns.getServerMoneyAvailable(job.target) / ns.getServerMaxMoney(job.target));
		const securityPercent = 100 * (ns.getServerSecurityLevel(job.target) / ns.getServerMinSecurityLevel(job.target));
		ns.print(`[${job.batch}]${job.type} (${job.skill} hack). Sec: ${securityPercent}, Cash: ${cashPercent}`);

		// Add an entry to our done database, indexed at batch id, if it doesn't exist.
		let batchLog = done[job.batch];
		if (typeof batchLog === 'undefined') {
			batchLog = [];
			done[job.batch] = batchLog;
		}
		const before = [...batchLog];

		// Add the finished job to that entry
		batchLog.push(job);

		// We somehow have more than 4 jobs finished with the same batch id. Why?
		if (batchLog.length > 4) {
			ns.tprint("WARN - Got more than 4 reports from a single batch???");
			// ns.tprint("Batch before adding job: ", before);
			ns.tprint("Job: ", job);
			//setRelativeTimings(batchLog);
			// ns.tprint("Log: ", batchLog);
			//ns.exit();
		}

		// We have 4 jobs finished in the batch, so the batch is done
		if (batchLog.length === 4) {
			const message = {batch: job.batch};
			//setRelativeTimings(batchLog);
			if (isDesynced(batchLog)) {
				printSyncWarning(ns, batchLog);
				message.error = "desync";
				message.order = batchLog.map(b => b.type).join("");
				//ns.exit();
			} else {
				printSuccess(ns, batchLog);
			}
			ns.writePort(controllerPort, JSON.stringify(message));
		}
	}
}

async function nextReport(ns, logPort) {
	await logPort.nextWrite();
	const job = JSON.parse(logPort.read());
	return { ...job, time: performance.now() };
}

function isDesynced(batchLog) {
	return batchLog.map(b => b.type).join("") !== "hackweaken1growweaken2"
}

function printSyncWarning(ns, batchLog) {
	ns.tprint(`WARN - Desynced batch!`);
	batchLog.forEach(job => ns.print(`${job.batch} ${job.type.padStart(7)}: ${ns.formatNumber(job.time, 1).padStart(12)}ms`));
}

function printSuccess(ns, batchLog) {
	const { target } = batchLog[0];
	const cashPercent = 100 * (ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target));
	const securityPercent = 100 * (ns.getServerSecurityLevel(target) / ns.getServerMinSecurityLevel(target));

	ns.print(`Batch finished. Server status: ${ns.formatNumber(cashPercent, 0)}% cash, ${ns.formatNumber(securityPercent, 0)}% security.`);
	const summary = batchLog.map(job => `${job.skill}h [${job.batch}] ${job.type} ${ns.formatNumber(job.time, 1).padStart(4)}ms`).join(" | ");
	ns.print(summary);

	if (cashPercent < 100 || securityPercent > 100) {
		ns.print("WARN - Target unprepped!");
		//ns.exit();
	}
}

function setRelativeTimings(batchLog) {
	const first = Math.min(...batchLog.map(job => job.time));
	batchLog.forEach(job => job.time = job.time - first);
}