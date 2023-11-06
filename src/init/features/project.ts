import { logger } from "../../logger";
import * as lodash from "lodash";
import * as clc from "colorette";
import { getSparkCloudProject, getUsersProjects } from "../../management/projects";
import { promptOnce } from "../../prompt";

export async function doSetup(setup: any, config: any, options?: any): Promise<void> {

	setup.project = {};

	logger.info();
	logger.info(`Let's associate this project directory with a SparkCloud project.`);
	logger.info();

	const projectFromRcFile = lodash.get(setup.rcFile, `project`);
	if (projectFromRcFile) {
		if (options.project) {
			logger.info(`CLI flag "project" overwritten by .sparkcloudrc. Leave the project directory to use the CLI flag.`);
		}

		const project = await getSparkCloudProject(projectFromRcFile.name);
		setup.project = project;
		setup.projectId = project.pid;
		return;
	}

	if (options.project) {
		logger.debug(`Using project from CLI flag: ${options.project}`);
		
		const project = await getSparkCloudProject(options.project);
		setup.project = project;
		setup.projectId = project.pid;
		return;
	}


	const projects = await getUsersProjects(options.auth);

	if (projects.length < 1) {
		logger.info(`You have no projects. Run ${clc.bold('sparkcloud projects:new')} to create one.`);
		return;
	}

	const choices = projects.map((project) => {
		return {
			name: `${project.name} (${project.pid})`,
			value: project.pid,
		};
	});

	const selectedProject = await promptOnce({
		type: 'list',
		name: 'project',
		message: 'Please select a project:',
		choices: choices,
	});

	const project = await getSparkCloudProject(selectedProject);
	setup.rcfile = { project: { name: project.pid } };
	setup.project = project;
	setup.projectId = project.pid;
	return;
}