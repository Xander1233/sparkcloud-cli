import { ValidatedSingle, configForCodebase } from "../../../functions/projectConfig";

export interface Endpoint {
	name: string;
	codebase: string;
	endpoint: {
		type: "http" | "schedule";
		options: {
			regions: string[];
			runWith: {
				memory: string;
				timeoutSeconds: number;
				cpu: number;
				minimumInstances: number;
				labels: string[];
				secrets: string[];
			}
		}
	}
}

export async function getEndpoints(options: any, config: any, codebaseConfig: ValidatedSingle, context: any) {

	// Read package file
	const packageFile: { main: string } = await config.readProjectFile(codebaseConfig.source + "/package.json", { json: true, fallback: { main: "lib/index.js" } });

	// Require main file
	const mainFile: { [key: string]: any } = await import(config.path(codebaseConfig.source + "/" + packageFile.main));

	// Loop through exports and check if they have all the required properties specified in the Endpoint interface
	const endpoints: Endpoint[] = [];
	for (const key in mainFile) {
		const endpoint = mainFile[key];
		if (endpoint.type && endpoint.options) {
			endpoints.push({ name: key, codebase: codebaseConfig.codebase, endpoint: endpoint });
		}
	}

	const filters = context.filters ?? [];

	if (filters.length === 0) {
		return endpoints;
	}

	const filteredEndpoints = endpoints.filter((endpoint) => {
		for (let filter of filters) {
			if (filter.codebase !== endpoint.codebase) {
				continue;
			}
			if (!filter.functions.includes(endpoint.name)) {
				continue;
			}
			return true;
		}
		return false;
	});

	return filteredEndpoints;
}