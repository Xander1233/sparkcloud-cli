import { crmUri } from "../api";
import { SparkCloudError } from "../error";
import { fetch } from "../fetch";
import { Account } from "../types/auth";
import { logLabeledSuccess } from "../utils";
import * as clc from "colorette";

export async function listCloudFunctions(pid: string, acc: Account) {

	const response = await fetch(crmUri(`/function/${pid}/list`), {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`
		},
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to list cloud functions`, {
			exit: 1
		});
	}

	return response.body.functions as CloudFunction[];
}

export async function createCloudFunction(cloudFunction: Endpoint, uploadId: string, pid: string, acc: Account) {

	const response = await fetch(crmUri(`/function/${pid}/create`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: cloudFunction.name,
			codebase: cloudFunction.codebase,
			type: cloudFunction.endpoint.type,
			regions: cloudFunction.endpoint.options.regions,
			runtimeOptions: cloudFunction.endpoint.options.runWith,
			uploadId: uploadId
		})
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to create cloud function ${cloudFunction.name}`, {
			exit: 1
		});
	}

	logLabeledSuccess("functions", `${clc.greenBright("Created")} cloud function ${clc.bold(cloudFunction.name)}`);

	return true;
}

export async function updateCloudFunction(cloudFunction: Endpoint, uploadId: string, pid: string, acc: Account) {

	const response = await fetch(crmUri(`/function/${pid}/update`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: cloudFunction.name,
			codebase: cloudFunction.codebase,
			type: cloudFunction.endpoint.type,
			regions: cloudFunction.endpoint.options.regions,
			runtimeOptions: cloudFunction.endpoint.options.runWith,
			uploadId: uploadId
		})
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to update cloud function ${cloudFunction.name}`, {
			exit: 1
		});
	}

	logLabeledSuccess("functions", `${clc.greenBright("Updated")} cloud function ${clc.bold(cloudFunction.name)}`);

	return true;
}

export async function deleteCloudFunction(cloudFunctionName: string, pid: string, acc: Account) {
	const response = await fetch(crmUri(`/function/${pid}/delete`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: cloudFunctionName
		})
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to delete function ${cloudFunctionName}`, {
			exit: 1
		});
	}

	logLabeledSuccess("functions", `${clc.redBright("Deleted")} cloud function ${clc.bold(cloudFunctionName)}`);

	return true;
}

export interface CloudFunction {
	name: string;
	type: "http" | "schedule";
	runtimeOptions: Record<string, any>;
	regions: string[];
	codebase: string;
}

export interface Endpoint {
	name: string,
	codebase: string,
	endpoint: {
		type: string,
		options: {
			regions: any,
			runWith: any
		}
	}
}