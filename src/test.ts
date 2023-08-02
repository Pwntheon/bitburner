import { NS } from "@ns";
import Publish from "lib/status";

export async function main(ns: NS) {
  Publish(ns, {
    component: "shotgun",
    status: {
      dropped: 0.13,
      income: 15215251,
      prepping: "",
      target: "ecorp",
      ramUsage: 52123
    }
  });
}