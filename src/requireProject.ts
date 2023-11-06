import { logger } from "./logger";
import { getSparkCloudProject, getUsersProjects } from "./management/projects";
import * as clc from 'colorette';
import { promptOnce } from "./prompt";

export async function requireProject(options: any) {

	let selectedProject: string;

	if (!options.project) {
		const projects = await getUsersProjects(options.auth);

		if (projects.length < 1) {
			logger.info(`You don't have any projects. Run ${clc.bold('sparkcloud projects:new')} to create one.`);
			return;
		}

		const projectChoices = projects.map((project) => {
			return {
				name: `${project.name} (${project.pid})`,
				value: project.pid,
			};
		});

		selectedProject = await promptOnce({
			type: 'list',
			name: 'project',
			message: 'Please select a project:',
			choices: projectChoices,
		});
	} else {
		selectedProject = options.project;
	}

	const project = await getSparkCloudProject(selectedProject);

	options.project = project;
	options.projectId = project.pid;
}