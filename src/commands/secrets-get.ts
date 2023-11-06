import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { promptOnce } from '../prompt';
import { requireAuthCmd } from '../requireAuth';
import { requireProject } from '../requireProject';
import { getSecret, getSecretVersion, listSecrets, listSecretsVersions } from '../management/secrets';

export const command = new Command('secrets:get')
	.description('get secrets for a project')
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

		const versions = await listSecretsVersions(selectedSecretName, projectId, acc);
		const versionChoices = versions.map((version) => ({
			name: `${version}`,
			value: version,
		}));

		const selectedSecretVersion = await promptOnce({
			type: 'list',
			name: 'secret',
			message: 'Please select a version:',
			choices: versionChoices,
		});

		const secret = await getSecret(selectedSecretName, projectId, acc);
		const secretValue = await getSecretVersion(selectedSecretName, projectId, selectedSecretVersion, acc);

		logger.info();
		logger.info(`${clc.bold(secret.key)} v${selectedSecretVersion}: ${secretValue}`);
		logger.info();

		return secrets;
	});