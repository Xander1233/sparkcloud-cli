import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { getGlobalDefaultAccount } from '../auth';
import { checkProjectId, createProject, getUsersProjects } from '../management/projects';
import { promptOnce } from '../prompt';
import { requireAuthCmd } from '../requireAuth';
import { requireProject } from '../requireProject';
import { deleteSecret, getSecret, listSecrets } from '../management/secrets';
import { SUCCESS_CHAR } from '../utils';

export const command = new Command('secrets:delete')
	.description('delete a secret')
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

		const secret = await getSecret(selectedSecretName, projectId, acc);

		// Log info
		logger.info();
		logger.info(`Secret: ${clc.bold(secret.key)}`);
		logger.info(`Created by: ${clc.bold(secret.expiresIn)} seconds`);
		logger.info(`Is rotating: ${clc.bold(secret.isRotating ? SUCCESS_CHAR : 'X')}`);
		logger.info(`Version count: ${clc.bold(secret.lastVersion)}`);
		logger.info();

		// Ask for confirmation
		const confirm = await promptOnce({
			type: 'confirm',
			name: 'confirm',
			message: 'Are you sure you want to delete this secret?',
			default: false,
		});

		if (!confirm) {
			logger.info(`Aborted by user.`);
			return false;
		}

		logger.info(`Deleting secret ${clc.bold(secret.key)}...`);

		await deleteSecret(selectedSecretName, projectId, acc);

		logger.info(`Secret ${clc.bold(secret.key)} deleted.`);

		return secrets;
	});