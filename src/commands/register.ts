import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { promptOnce } from '../prompt';
import { getGlobalDefaultAccount, logout, register } from '../auth';

export const command = new Command('register')
	.option('-l, --logout', 'automatically log out if you are already logged in')
	.description('register to SparkCloud')
	.action(async (options) => {

		const acc = getGlobalDefaultAccount();

		if (acc) {
			if (!options.logout) {
				const askForLogoutConfirmation = await promptOnce({
					type: 'confirm',
					name: 'askForLogoutConfirmation',
					message: `Already logged in as ${clc.bold(acc.user.email)}. Would you like to log out?`
				});
				if (!askForLogoutConfirmation) {
					logger.info(`Registration cancelled`);
					return acc.user;
				} else {
					logger.info(`Logging out ${clc.bold(acc.user.email)}...`);
				}
			} else {
				logger.info(`Account found. Flag ${clc.bold('--logout')} is present. Logging out ${clc.bold(acc.user.email)}...`);
			}
			await logout();
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

		const passwordConfirm = await promptOnce({
			type: 'password',
			name: 'passwordConfirm',
			message: 'Please confirm your password:'
		});

		if (!passwordConfirm) {
			throw new Error('No password confirmation provided');
		}

		if (password !== passwordConfirm) {
			throw new Error('Passwords do not match');
		}

		const firstName = await promptOnce({
			type: 'input',
			name: 'firstName',
			message: 'Please enter your first name:'
		});

		if (!firstName) {
			throw new Error('No first name provided');
		}

		const lastName = await promptOnce({
			type: 'input',
			name: 'lastName',
			message: 'Please enter your last name:'
		});

		if (!lastName) {
			throw new Error('No last name provided');
		}

		const displayName = `${firstName} ${lastName}`;

		const account = await register({ email, password, displayName });

		logger.info(`Registered and signed in as ${clc.bold(account.user.email)}`)

		return account;
	});