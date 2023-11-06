import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { getGlobalDefaultAccount } from '../auth';
import { checkProjectId, createProject, getUsersProjects } from '../management/projects';
import { promptOnce } from '../prompt';
import { requireAuthCmd } from '../requireAuth';
import { requireProject } from '../requireProject';
import { createRotatingSecret, createSecret, getSecret, listSecrets, secretExistInProject } from '../management/secrets';

export const command = new Command('secrets:list')
	.description('list secrets for a project')
	.option('--project <project>', 'project to use')
	.before(requireAuthCmd)
	.before(requireProject)
	.action(async (options) => {

		const projectId = options.projectId;
		const acc = options.auth;

		const secrets = await listSecrets(projectId, acc);

		if (secrets.length < 1) {
			logger.info(`This project has no secrets`);
			return;
		}

		for (const secret of secrets) {
			const rotationIcon = secret.isRotating ? clc.green(' 🔄 ') : ' ';

			logger.info(`- ${clc.bold(secret.key)}${rotationIcon}(Latest version: ${clc.bold(secret.lastVersion)})`);
		}

		return secrets;
	});