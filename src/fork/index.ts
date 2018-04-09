import * as ChildProcess from "child_process";

export interface ForkResult {
  code: number;
}

export interface Forked extends Promise<ForkResult> {
  on: ChildProcess.ChildProcess["on"];
  send: ChildProcess.ChildProcess["send"];
  kill: ChildProcess.ChildProcess["kill"];
  connected: ChildProcess.ChildProcess["connected"];
  stdout: ChildProcess.ChildProcess["stdout"];
  stderr: ChildProcess.ChildProcess["stderr"];
}

export function fork(executable: string, args: string[], opts?: ChildProcess.ForkOptions): Forked {
  const cp = ChildProcess.fork(executable, args, {
    ...opts,
    stdio: ["pipe", "pipe", "pipe", "ipc"],
  });

  const forked: Promise<ForkResult> = new Promise((resolve, reject) => {
    cp.on("exit", (code) => resolve({code}));
    cp.on("error", reject);
  });

  return Object.defineProperties(forked, {
    on: { value: cp.on.bind(cp) },
    send: { value: cp.send.bind(cp) },
    kill: { value: cp.kill.bind(cp) },
    stderr: { value: cp.stderr },
    stdout: { value: cp.stdout },
    connected: {
      get() {
        return cp.connected;
      }
    }
  });
}
