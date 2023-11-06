import * as clc from 'colorette';

import { Command } from '../command';
import { logger } from '../logger';
import { logSuccess } from '../utils';
import { requireAuthCmd } from '../requireAuth';
import { getSparkCloudProject, getUsersProjects } from '../management/projects';
import { prompt, promptOnce } from '../prompt';
import { Project } from '../types/project';
import { fetch } from '../fetch';
import { crmUri } from '../api';

const defaultLocations = [
	{ name: 'Hong-Kong (asia-east1)', value: 'asia-east1' },
	{ name: 'Sydney (australia-southeast1)', value: 'australia-southeast1' },
	{ name: 'Belgium (europe-west1)', value: 'europe-west1' },
	{ name: 'London (europe-west2)', value: 'europe-west2' },
	{ name: 'Frankfurt (europe-west3)', value: 'europe-west3' },
	{ name: 'Toronto (northamerica-northeast1)', value: 'northamerica-northeast1' },
	{ name: 'Vancouver (northamerica-northwest1)', value: 'northamerica-northwest1' },
	{ name: 'New York City (us-east1)', value: 'us-east1' },
	{ name: 'Los Angeles (us-west1)', value: 'us-west1' },
]

const updatableKeyChoices = [
	{
		value: 'name',
		name: 'Internal name: The name used to identify the project in the SparkCloud console',
		checked: false
	},
	{
		value: 'publicName',
		name: 'Public name: The name that represents the project publicly',
		checked: false
	},
	{
		value: 'environmentType',
		name: 'Environment: The environment type is a checkmark that indicates whether the project is a production or development project',
		checked: false
	}
]

const defaultResourceLocation = {
	value: 'defaultResourceLocation',
	name: 'Default resource location: The default resource location is the region where project resources are located (Can only be set once)',
	checked: false
}

function updateInternalName(result: Record<string, any>, project: Project) {
	return prompt(result, [{
		type: 'input',
		name: 'name',
		message: 'Please enter the new internal name:',
		default: project.name,
	}]);
}

function updatePublicName(result: Record<string, any>, project: Project) {
	return prompt(result, [{
		type: 'input',
		name: 'publicName',
		message: 'Please enter the new public name:',
		default: project.publicName,
	}]);
}

function updateEnvironmentType(result: Record<string, any>, project: Project) {
	return prompt(result, [{
		type: 'list',
		name: 'environmentType',
		message: 'Please select the new environment type:',
		choices: [
			{
				name: 'Production',
				value: 'production',
			},
			{
				name: 'Development',
				value: 'development',
			}
		],
		default: project.environmentType,
	}]);
}

function updateDefaultResourceLocation(result: Record<string, any>, project: Project) {
	return prompt(result, [{
		type: 'list',
		name: 'defaultResourceLocation',
		message: 'Please select the default resource location:',
		choices: defaultLocations,
		default: project.defaultResourceLocation === "none" ? defaultLocations[0].value : project.defaultResourceLocation,
	}]);
}

const updateFunctions = {
	name: updateInternalName,
	publicName: updatePublicName,
	environmentType: updateEnvironmentType,
	defaultResourceLocation: updateDefaultResourceLocation
};

export const command = new Command('projects:update')
	.description('update a project')
	.before(requireAuthCmd)
	.action(async function (options: any) {

		const projects = await getUsersProjects(options.auth);

		if (projects.length < 1) {
			logger.info(`You have no projects. Run ${clc.bold('sparkcloud projects:new')} to create one.`);
			return;
		}

		const projectChoices = projects.map((project) => {
			return {
				name: `${project.name} (${project.pid})`,
				value: project.pid,
			};
		});

		const selectedProject = await promptOnce({
			type: 'list',
			name: 'project',
			message: 'Please select a project:',
			choices: projectChoices,
		});

		const project = await getSparkCloudProject(selectedProject);

		let choices = [ ...updatableKeyChoices ];
		if (!project.defaultResourceLocation || project.defaultResourceLocation === 'none') {
			choices.push(defaultResourceLocation);
		}

		const selectedKeys: ("name" | "publicName" | "environmentType" | "defaultResourceLocation")[] = await promptOnce({
			type: 'checkbox',
			name: 'features',
			message: `Which SparkCloud features do you want to update for this project? Press space to select features, then enter to confirm your choices.`,
			choices: choices,
		}) as any;

		let newValues = {};
		
		for (const key of selectedKeys) {
			await updateFunctions[key](newValues, project);
		}

		const updateResult = await fetch(crmUri(`/project/${project.pid}`), {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${options.auth.tokens.access_token}`
			},
			body: JSON.stringify(newValues)
		});

		if (!updateResult.rawResponse.ok) {
			throw new Error(`Failed to update project ${project.pid}`);
		}

		logSuccess(`Successfully updated project ${project.pid}`);

		return newValues;
	});

