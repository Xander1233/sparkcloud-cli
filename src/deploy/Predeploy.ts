import { Debuglog } from "../debuglogs";
import { spawn } from "child_process";
import { SparkCloudRC } from "../util/config";
import { executeShellCommand } from "../util/executeShellCommand";

export async function Predeploy(commands: string[], config: SparkCloudRC) {

	const promises = commands.map(async (command: string) => {

		command = replaceVariables(command, config);

		await Debuglog.instance.debug(`Executing predeploy command "${command}".`);

		const result = await executeShellCommand(command);

		if (result !== 0) {
			console.error(`Predeploy command "${command}" exited with status code ${result}.`);
			await Debuglog.instance.log(`Predeploy command "${command}" exited with status code ${result}.`);
			process.exit(1);
		}
	});

	await Promise.all(promises);

	await Debuglog.instance.log("Predeploy commands executed successfully.");
}

function replaceVariables(command: string, config: SparkCloudRC) {

	command = command.replace(/\$RESOURCE_DIR/g, config.functions.source);

	command = command.replace(/\$PROJECT_NAME/g, config.project.name);

	return command;
}