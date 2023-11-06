import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { getGlobalDefaultAccount } from '../auth';
import { requireAuthCmd } from '../requireAuth';
import { Account } from '../types/auth';

export const command = new Command('whoami')
	.description('display current user')
	.before(requireAuthCmd)
	.action(async (options) => {

		const { user } = options.auth as Account;

		logger.info(`Logged in as ${clc.bold(user.displayName)} <${clc.bold(user.email)}> (${clc.bold(user.uid)})`);

		return user;
	});