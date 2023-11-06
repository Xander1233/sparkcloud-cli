import * as clc from "colorette";
import { CloudFunction, createCloudFunction, deleteCloudFunction, listCloudFunctions, updateCloudFunction } from "../../../management/cloudFunctions";
import { promptOnce } from "../../../prompt";
import { logLabeledBullet } from "../../../utils";

export async function uploadEndpointsMetadata(context: any, options: any) {
	
	const endpoints = context.endpoints;
	const uploadIds: Map<string, string> = context.uploadIds;

	const remoteEndpoints = await listCloudFunctions(options.projectId, options.auth);

	const createEndpoints = endpoints.filter((endpoint: any) => {
		return !remoteEndpoints.find((remoteEndpoint: any) => {
			return remoteEndpoint.name === endpoint.name;
		});
	});

	const updateEndpoints = endpoints.filter((endpoint: any) => {
		return remoteEndpoints.find((remoteEndpoint: any) => {
			return remoteEndpoint.name === endpoint.name;
		});
	});

	const deleteEndpointsBeforeConfirmation = remoteEndpoints.filter((remoteEndpoint: any) => {
		return !endpoints.find((endpoint: any) => {
			return remoteEndpoint.name === endpoint.name;
		});
	});

	let deleteEndpoints: CloudFunction[] = [];
	// Ask for each delete endpoint if the user wants to delete it
	for await (const endpoint of deleteEndpointsBeforeConfirmation) {

		if (!uploadIds.has(endpoint.codebase)) {
			continue;
		}

		const res = await promptOnce({
			type: 'confirm',
			name: 'delete',
			message: `${clc.underline(endpoint.name)} is not in your project anymore. Do you want to delete it? This action is irreversible. (y/N)`,
			default: false
		});

		if (res) {
			deleteEndpoints.push(endpoint);
		}
	}

	let promises: Promise<any>[] = [];

	for (const endpoint of createEndpoints) {
		logLabeledBullet("functions", `${clc.greenBright("Creating")} cloud function ${clc.bold(endpoint.name)}`);
		let uploadId = uploadIds.get(endpoint.codebase);
		if (!uploadId) {
			throw new Error(`No upload id found for ${endpoint.codebase}`);
		}
		promises.push(createCloudFunction(endpoint, uploadId, options.projectId, options.auth));
	}

	for (const endpoint of updateEndpoints) {
		logLabeledBullet("functions", `${clc.greenBright("Updating")} cloud function ${clc.bold(endpoint.name)}`);
		let uploadId = uploadIds.get(endpoint.codebase);
		if (!uploadId) {
			throw new Error(`No upload id found for ${endpoint.codebase}`);
		}
		promises.push(updateCloudFunction(endpoint, uploadId, options.projectId, options.auth));
	}

	for (const endpoint of deleteEndpoints) {
		logLabeledBullet("functions", `${clc.redBright("Deleting")} cloud function ${clc.bold(endpoint.name)}`);
		promises.push(deleteCloudFunction(endpoint.name, options.projectId, options.auth));
	}

	await Promise.all(promises);

	return true;
}