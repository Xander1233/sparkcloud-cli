import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { getGlobalDefaultAccount } from '../auth';
import { checkProjectId, createProject, getUsersProjects } from '../management/projects';
import { promptOnce } from '../prompt';
import { requireAuthCmd } from '../requireAuth';
import { requireProject } from '../requireProject';
import { createRotatingSecret, createSecret, getSecret, listSecrets, secretExistInProject, updateSecret } from '../management/secrets';

export const command = new Command('secrets:update')
	.description('create a new version of a secret for a project')
	.option('--project <project>', 'project to use')
	.before(requireAuthCmd)
	.before(requireProject)
	.action(async (options) => {

		const projectId = options.projectId;
		const acc = options.auth;

		const secrets = await listSecrets(projectId, acc);

		if (secrets.length < 1) {
			logger.info(`You have no secrets. Run ${clc.bold('sparkcloud secrets:create')} to create one.`);
			return;
		}

		const secretChoices = secrets.map((secret) => ({
			name: `${secret.key}${secret.isRotating ? ' 🔄 ' : ' '}`,
			value: secret.key,
		}));

		const selectedSecretName = await promptOnce({
			type: 'list',
			name: 'secret',
			message: 'Please select a secret:',
			choices: secretChoices,
		});

		logger.info(`Updating secret ${clc.bold(selectedSecretName)}...`);

		const value = await promptOnce({
			type: 'password',
			name: 'password',
			message: 'Please enter the secret value:'
		});

		const newVersion = await updateSecret(selectedSecretName, value, projectId, acc);

		logger.info(`Updated secret ${clc.bold(selectedSecretName)} to version ${clc.bold(newVersion)}`);

		return newVersion;
	});