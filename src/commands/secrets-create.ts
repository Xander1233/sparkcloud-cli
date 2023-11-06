import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { getGlobalDefaultAccount } from '../auth';
import { checkProjectId, createProject, getUsersProjects } from '../management/projects';
import { promptOnce } from '../prompt';
import { requireAuthCmd } from '../requireAuth';
import { requireProject } from '../requireProject';
import { createRotatingSecret, createSecret, secretExistInProject } from '../management/secrets';

export const command = new Command('secrets:create')
	.description('create a new secret for a project')
	.option('--project <project>', 'project to use')
	.before(requireAuthCmd)
	.before(requireProject)
	.action(async (options) => {

		const name = await promptOnce({
			type: 'input',
			name: 'name',
			message: 'Please enter the secret name:'
		});

		const secretName = await assertName(name, options);

		const shouldRotate = await promptOnce({
			type: 'confirm',
			name: 'rotate',
			message: 'Would you like to rotate this secret?',
			default: false
		});

		const projectId = options.projectId;
		const acc = options.auth;

		if (shouldRotate) {
			
			const rotateInterval = parseInt(await promptOnce({
				type: 'input',
				name: 'interval',
				message: 'Please enter the rotation interval in seconds:',
				default: '86400'
			}));

			if (isNaN(rotateInterval)) {
				throw new Error('Invalid rotation interval');
			}

			await createRotatingSecret(secretName, projectId, acc, rotateInterval);

			logger.info(`Created rotating secret ${clc.bold(secretName)} in project ${clc.bold(projectId)} with rotation interval ${clc.bold(rotateInterval)} seconds`);
		} else {

			const value = await promptOnce({
				type: 'password',
				name: 'password',
				message: 'Please enter the secret value:'
			});

			await createSecret(secretName, projectId, value, acc);

			logger.info(`Created secret ${clc.bold(secretName)} in project ${clc.bold(projectId)}`);
		}

		return secretName;
	});

async function assertName(name: string, options: any) {
	if (!name) {
		throw new Error('No name provided');
	}

	if (/^[a-zA-Z0-9-_]{1,255}$/g.test(name) === false) {
		throw new Error('Invalid name provided');
	}

	const pid = options.projectId;

	if (await secretExistInProject(name, pid, options.auth)) {
		throw new Error(`Secret ${clc.bold(name)} already exists in project ${clc.bold(pid)}`);
	}

	return name;
}