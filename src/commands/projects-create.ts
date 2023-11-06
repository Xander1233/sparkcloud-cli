import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { getGlobalDefaultAccount } from '../auth';
import { checkProjectId, createProject, getUsersProjects } from '../management/projects';
import { promptOnce } from '../prompt';
import { requireAuthCmd } from '../requireAuth';

export const command = new Command('projects:new')
	.description('create a new project')
	.before(requireAuthCmd)
	.action(async (options) => {

		const pid = await promptForPid();

		const name = await promptOnce({
			type: 'input',
			name: 'name',
			message: 'Please enter the project name:'
		});

		if (!name) {
			throw new Error('No project name provided');
		}

		const project = await createProject(pid, name, options.auth);

		logger.info(`Created project ${clc.bold(project.name)} (${clc.bold(project.pid)})`);

		return project;
	});


async function promptForPid(): Promise<string> {

	const pid = await promptOnce({
		type: 'input',
		name: 'pid',
		message: 'Please enter the project ID:'
	});

	if (!pid) {
		throw new Error('No project ID provided');
	}

	const assertedPid = await checkProjectId(pid);

	if (assertedPid == undefined) {
		logger.info(`${pid} is not available.`);
		return promptForPid();
	}

	if (assertedPid === pid) {
		return pid;
	}

	const confirmNewPid = await promptOnce({
		type: 'confirm',
		name: 'confirmNewPid',
		message: `${clc.bold(pid)} is not available. Would you like to use ${clc.bold(assertedPid)} instead?`
	});

	if (!confirmNewPid) {
		return promptForPid();
	}

	return assertedPid;
}