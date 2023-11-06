import * as clc from 'colorette';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { Command } from '../command';
import { logger } from '../logger';
import { getGlobalDefaultAccount } from '../auth';
import { getUsersProjects } from '../management/projects';
import { Project } from '../types/project';
import { SparkCloudError } from '../error';
import * as utils from '../utils';
import { Config } from '../config';
import { prompt, promptOnce } from '../prompt';
import { Setup, init } from '../init';
import { requireAuthCmd } from '../requireAuth';

const homedir = os.homedir();

const TEMPLATE_ROOT = path.resolve(__dirname, '../../templates/');
const GITIGNORE_TEMPLATE = fs.readFileSync(path.join(TEMPLATE_ROOT, "_gitignore"), "utf8");

function isOutside(from: string, to: string): boolean {
	return !!/^\.\./.exec(path.relative(from, to));
}

const choices = [
	{
		value: 'functions',
		name: 'Cloud Functions: Configure a cloud functions codebase',
		checked: false
	}
]

const featureNames = choices.map((choice) => choice.value);

const description = `Interactively configure the current directory as a SparkCloud project or initialize new features in an already configured firebase project.

This command will create or update the "sparkcloud.json" and ".sparkcloudrc" configuration files in the current directory.

To initialize a specific feature, run "sparkcloud init [feature]". Valid features are:
${featureNames.sort().map((v) => `\n - ${v}`).join('')}`;

export const command = new Command('init [feature]')
	.description(description)
	.before(requireAuthCmd)
	.action(async (feature: string, options) => {

		if (feature && !featureNames.includes(feature)) {
			throw new SparkCloudError(`Feature ${feature} is not a valid feature. Valid features are: ${featureNames.join(', ')}`, {
				exit: 1
			});
		}

		const cwd = options.cwd || process.cwd();

		const warnings = [];
		let warningText = "";

		if (isOutside(homedir, cwd)) {
			warnings.push(`You are initializing SparkCloud outside your home directory.`);
		}
		if (cwd === homedir) {
			warnings.push(`You are initializing SparkCloud inside your home directory.`);
		}

		const exisitingConfig = Config.load(options, true);
		if (exisitingConfig) {
			warnings.push(`You are initializing SparkCloud inside an existing SparkCloud project.`);
		}

		const config = exisitingConfig !== null ? exisitingConfig : new Config({}, { projectDir: cwd, cwd: cwd });

		if (warnings.length > 0) {
			warningText = `\nBefore we get started, keep in mind:\n\n${clc.yellow('* ')}${warnings.join('\n')}${clc.yellow('* ')}\n`;
		}

		logger.info(`You are about to initialize a SparkCloud project in this directory:\n\n${clc.bold(config.projectDir)}\n${warningText}`);

		const projects = await getUsersProjects(options.auth);

		if (projects.length < 1) {
			logger.info(`You have no projects. Run ${clc.bold('sparkcloud projects:new')} to create one.`);
			return false;
		}
		
		let next;
		if (process.platform === 'win32') {
			next = promptOnce({
				type: 'confirm',
				message: 'Are you ready to proceed?',
			});
		} else {
			next = Promise.resolve(true);
		}

		let setup: Setup = {
			config: config.src,
			rcfile: config.readProjectFile('.sparkcloudrc', { json: true, fallback: {} })
		}

		return next
			.then((proceed) => {
				if (!proceed) {
					throw new SparkCloudError(`Aborted by user`, {
						exit: 1
					});
				}

				if (feature) {
					setup.features = [feature];
					return undefined;
				}

				return prompt(setup, [
					{
						type: 'checkbox',
						name: 'features',
						message: `Which SparkCloud features do you want to set up for this directory? Press space to select features, then enter to confirm your choices.`,
						choices: choices,
					},
				]);
			})
			.then(() => {
				if (!setup.features || setup.features.length < 1) {
					throw new SparkCloudError(`Please select at least one feature. ${clc.bold(clc.underline('SPACEBAR'))} to select features or specify a feature with ${clc.bold('sparkcloud init [feature]')}`, {
						exit: 1
					});
				}

				setup.features.unshift('project');

				return init(setup, config, options);
			})
			.then(() => {
				logger.info();
				utils.logBullet(`Writing configuration info to ${clc.bold('sparkcloud.json')}...`);
				config.writeProjectFile('sparkcloud.json', setup.config);
				utils.logBullet(`Writing project information to ${clc.bold('.sparkcloudrc')}...`);
				config.writeProjectFile('.sparkcloudrc', setup.rcfile);
				if (!utils.fileExistsSync(config.path('.gitignore'))) {
					utils.logBullet(`Writing gitignore file to ${clc.bold('.gitignore')}...`);
					config.writeProjectFile('.gitignore', GITIGNORE_TEMPLATE);
				}
				logger.info();
				utils.logSuccess(`SparkCloud initialization complete!`);
			});
	});
