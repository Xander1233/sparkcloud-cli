import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { promptOnce } from '../prompt';
import { getGlobalDefaultAccount, login } from '../auth';

export const command = new Command('login')
	.description('log in to SparkCloud')
	.option('--reauth', 'force reauthentication')
	.action(async (options) => {

		const acc = getGlobalDefaultAccount();

		if (acc) {

			if (!options.reauth) {
				logger.info(`Already logged in as ${clc.bold(acc.user.email)}`);
				return acc.user;
			}

			logger.info(`Already logged in as ${clc.bold(acc.user.email)}. ${clc.bold('--reauth')} is present. Starting reauthentication...`);
		}

		const email = await promptOnce({
			type: 'input',
			name: 'email',
			message: 'Please enter your email address:'
		});

		if (!email) {
			throw new Error('No email address provided');
		}

		const password = await promptOnce({
			type: 'password',
			name: 'password',
			message: 'Please enter your password:'
		});

		if (!password) {
			throw new Error('No password provided');
		}

		const account = await login({ email, password });

		logger.info(`Logged in as ${clc.bold(account.user.email)}`);

		return account;
	});