

export default function Scan(ns) {
  const servers = [];
	addServer(ns, servers, "home");
  return servers;
}

function addServer(ns, list, server) {
	list.push(server);
	ns.scan(server).forEach(s => {
		if (!list.includes(s)) addServer(ns, list, s);
	})
}