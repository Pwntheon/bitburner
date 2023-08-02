import { NS } from "@ns";
import { Company } from "models/company";

const megacorps = [
  { name: "ECorp", server: "ecorp" },
  { name: "MegaCorp", server: "megacorp" },
  { name: "Bachman & Associates", server: "a-and-a" },
  { name: "Blade Industries", server: "blade" },
  { name: "NWO", server: "NWO" },
  { name: "Clarke Incorporated", server: "clarkinc" },
  { name: "OmniTek Incorporated", server: "omnitek" },
  { name: "Four Sigma", server: "4sigma" },
  { name: "KuaiGong International", server: "kuai-gong" },
  { name: "Fulcrum Technologies", server: "fulcrumassets" }
]

export async function main(ns: NS) {
  const companies: Company[] = [];
  for (const corp of megacorps) {
    companies.push(
      new Company(ns, corp.name, corp.server)
    );
  }

  ns.write('data/companies.txt', JSON.stringify(companies), "w");
}