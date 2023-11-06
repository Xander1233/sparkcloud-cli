import * as clc from 'colorette';

import { Command } from '../command';
import { logger } from '../logger';
import { logLabeledBullet, logLabeledWarning, logWarning } from '../utils';
import { requireAuthCmd } from '../requireAuth';
import { requireProject } from '../requireProject';
import { deleteCloudFunction, listCloudFunctions } from '../management/cloudFunctions';
import { promptOnce } from '../prompt';

export const command = new Command('functions:delete')
	.description('delete a function from your sparkcloud project')
	.before(requireAuthCmd)
	.before(requireProject)
	.action(async function (options: any) {

		const acc = options.auth;
		const pid = options.projectId;

		const functions = await listCloudFunctions(pid, acc);

		if (functions.length === 0) {
			logLabeledWarning("functions", "No functions found");
			return;
		}

		const functionChoices = functions.map((func: any) => {
			return {
				name: `${func.name} (${func.type})`,
				value: func.name
			};
		});

		const answers = await promptOnce({
			type: 'checkbox',
			name: 'functions',
			message: 'Select the functions you want to delete',
			choices: functionChoices
		});

		if (answers.length === 0) {
			logWarning("No functions selected");
			return;
		}

		for (const answer of answers) {
			const func = functions.find((f) => f.name === answer);
			logLabeledBullet("functions", `Deleting ${clc.bold(func.name)} (${clc.bold(func.type)}) (Codebase: ${clc.bold(func.codebase)})`);
			await deleteCloudFunction(func.name, pid, acc);
		}
		
		return functions;
	});