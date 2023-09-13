import { spawn } from "child_process";
import { Debuglog } from "../debuglogs";

export function executeShellCommand(predeployCommand: string): Promise<number> {
	return new Promise((resolve, reject) => {
		const predeployCommandSplit = predeployCommand.split(' ');

		const command = predeployCommandSplit[0];
		const args = predeployCommandSplit.slice(1);

		const chProcess = spawn(command, args);

		chProcess.stdout.on('data', async (data) => {
			await Debuglog.instance.log(data.toString());
		});

		chProcess.stderr.on('data', async (data) => {
			await Debuglog.instance.log(data.toString());
		});

		chProcess.on('exit', (code) => {
			resolve(code);
		});

		chProcess.on('error', (err) => {
			reject(err);
		});

		chProcess.on('close', (code) => {
			resolve(code);
		});
	});
}