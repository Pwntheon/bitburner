import { NS } from "@ns";
import { runAsync } from "lib/process";

export async function main(ns: NS) {
  await runAsync(ns, 'utils/companies.js');
}