import { NS } from "@ns";

export type UpdateFunction = ((ns: NS) => Promise<void>) | (() => Promise<void>);

class UpdateHandler {
  handlers: UpdateFunction[];
  constructor() {
    this.handlers = [];
  }

  register(handler: UpdateFunction) {
    this.handlers.push(handler);
  }

  unregister(handler: UpdateFunction) {
    const index = this.handlers.findIndex(e => e === handler);
    if (index >= 0) this.handlers.splice(index, 1);
  }
}

export default UpdateHandler;