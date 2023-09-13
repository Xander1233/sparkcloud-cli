import { join } from 'path';
import { readFile } from 'fs/promises';

export interface SparkCloudRC {
	project: {
		name: string;
	};
	functions: {
		source: string;
		predeploy: string[];
	};
}

export async function getConfig(): Promise<SparkCloudRC> {

	const rcPath = join(process.cwd(), '.sparkcloudrc');

	const fileContent = await readFile(rcPath, { encoding: 'utf-8' })
		.catch((err) => {
			console.error(`Could not read ".sparkcloudrc" file.`);
			process.exit(1);
		});

	const config = JSON.parse(fileContent);

	if (!config) {
		console.error(`Invalid ".sparkcloudrc" file.`);
		process.exit(1);
	}

	if (!config.project) {
		console.error(`Invalid ".sparkcloudrc" file. Missing "project" property.`);
		process.exit(1);
	}

	if (!config.project.name || typeof config.project.name !== "string") {
		console.error(`Invalid ".sparkcloudrc" file. "project" property must have a "name" property.`);
		process.exit(1);
	}

	if (!config.functions) {
		console.error(`Invalid ".sparkcloudrc" file. Missing "functions" property.`);
		process.exit(1);
	}

	if (!config.functions.source || typeof config.functions.source !== "string") {
		console.error(`Invalid ".sparkcloudrc" file. "functions" property must have a "source" property.`);
		process.exit(1);
	}

	if (!config.functions.predeploy || !Array.isArray(config.functions.predeploy)) {
		console.error(`Invalid ".sparkcloudrc" file. "functions" property must have a "predeploy" property.`);
		process.exit(1);
	}

	if (!config.functions.predeploy.every((predeploy: any) => typeof predeploy === "string")) {
		console.error(`Invalid ".sparkcloudrc" file. "functions" property must have a "predeploy" property that is an array of strings.`);
		process.exit(1);
	}

	return config;
}