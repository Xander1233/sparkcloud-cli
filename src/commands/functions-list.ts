import * as clc from 'colorette';

import { Command } from '../command';
import { logger } from '../logger';
import { requireProject } from '../requireProject';
import { requireAuthCmd } from '../requireAuth';
import { listCloudFunctions } from '../management/cloudFunctions';
import { logLabeledWarning } from '../utils';

export const command = new Command('functions:list')
	.description('list all the functions in your sparkcloud project')
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

		logger.info();
		logger.info(`${clc.bold("The functions associated with this project:")}`);
		logger.info();

		for (const func of functions) {
			logger.info(` -  ${clc.bold(func.name)} (${clc.bold(func.type)})`);
		}

		return functions;
	});