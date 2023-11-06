import * as clc from 'colorette';
import { Command } from '../command';
import { logger } from '../logger';
import { getUsersProjects } from '../management/projects';
import { requireAuthCmd } from '../requireAuth';

export const command = new Command('projects:list')
	.description('list all projects you have access to')
	.before(requireAuthCmd)
	.action(async (options) => {

		const projects = await getUsersProjects(options.auth);

		if (projects.length < 1) {
			logger.info(`You have no projects. Run ${clc.bold('sparkcloud projects:new')} to create one`);
			return false;
		}

		logger.info(`You have ${clc.bold(projects.length)} project${projects.length === 1 ? '' : 's'}:`);

		for (const project of projects) {
			logger.info(`- ${clc.italic(clc.greenBright(project.pid))}: ${clc.bold(clc.cyanBright(project.publicName))} (Internal name: ${clc.bold(clc.blueBright(project.name))})`);
		}

		return projects;
	});