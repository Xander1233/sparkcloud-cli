import * as clc from 'colorette';

import { Command } from '../command';
import { logger } from '../logger';
import { logWarning } from '../utils';

export const command = new Command('help [command]')
	.description('display help for a command')
	.action(function (commandName: string) {

		// @ts-ignore
		const client = this.client; // eslint-disable-line @typescript-eslint/no-invalid-this

		const cmd = client.getCommand(commandName);

		if (cmd) {
			cmd.outputHelp();
		} else if (commandName) {
			logger.warn();
			logWarning(`${clc.bold(commandName)} is not a valid command`);
			client.cli.outputHelp();
		} else {
			client.cli.outputHelp();
			logger.info();
			logger.info(`Run ${clc.bold('sparkcloud help [command]')} for more information for a specific command.`);
			logger.info();
		}
	});