import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { promptOnce } from '../prompt';
import { getGlobalDefaultAccount, login, logout } from '../auth';

export const command = new Command('logout')
	.description('log out of SparkCloud')
	.option('--force, -f', 'bypass logout confirmation')
	.action(async (options) => {

		const { user, tokens } = getGlobalDefaultAccount();

		if (!user || !tokens) {
			logger.info(`You are not logged in. Run ${clc.bold('sparkcloud login')} to log in.`);
			return false;
		}

		let confirm = false;

		if (options.force) {
			confirm = true;
		} else {
			confirm = await promptOnce({
				type: 'confirm',
				name: 'confirm',
				message: `Are you sure you want to log out of ${clc.bold(user.email)}? (y/N)`
			});
		}

		logger.info(`Did you know? You can use ${clc.bold('--force')} to bypass this confirmation. (e.g. ${clc.bold('sparkcloud logout --force')})`);

		if (!confirm) {
			logger.info(`Logout aborted. You are still logged in as ${clc.bold(user.email)}`);
			return false;
		}

		await logout();

		logger.info(`Logged out of ${clc.bold(user.email)}`);

		return true;
	});