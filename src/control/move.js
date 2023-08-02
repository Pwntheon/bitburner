import Arguments from './lib/arguments.js';

const a = new Arguments([
	['connectTo', d => d.servers]
])

export function autocomplete(data, args) {
	return a.autocomplete(data, args);
}

/** @param {NS} ns */
export async function main(ns) {
	const { connectTo } = a.getOptions(ns);
	const servers = [];
	addServer(ns, servers, [], ns.singularity.getCurrentServer());
	connect(ns, servers, connectTo);
}

function addServer(ns, list, path, server) {
	list.push({ name: server, path: [...path, server] });
	ns.scan(server).forEach(s => {
		if (!list.some(e => e.name === s)) addServer(ns, list, [...path, server], s);
	})
}

function connect(ns, servers, hostname) {

	const server = servers.find(s => s.name === hostname);
	server.path.forEach(node => ns.singularity.connect(node));
}