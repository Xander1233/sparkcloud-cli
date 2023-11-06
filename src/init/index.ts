import * as clc from 'colorette';
import { SparkCloudError } from '../error';
import * as features from './features';
import { logger } from '../logger';
import { capitalize } from 'lodash';

export interface Setup {
	config: Record<string, any>;
	rcfile: {
		projects: Record<string, any>;
	};
	features?: string[];
	project?: Record<string, any>;
	projectId?: string;
	projectLocation?: string;
}

const featureFunctions = new Map<string, (setup: any, config: any, options?: any) => Promise<unknown>>([
	["project", features.project],
	["functions", features.functions]
]);

export async function init(setup: Setup, config: any, options: any) {
	const nextFeature = setup.features?.shift();

	if (!nextFeature) {
		return;
	}

	if (!featureFunctions.has(nextFeature)) {
		const availableFeatures = Object.keys(features).filter((v) => v !== 'project').join(', ');
		throw new SparkCloudError(`Feature ${clc.bold(nextFeature)} not found. Available features are: ${availableFeatures}`);
	}

	logger.info(clc.bold(`\n${clc.white(' === ')}${capitalize(nextFeature)} setup`));

	const fn = featureFunctions.get(nextFeature);

	if (!fn) {
		throw new SparkCloudError(`We've lost the function to init ${nextFeature}!`, { exit: 2 });
	}

	await fn(setup, config, options);
	return init(setup, config, options);
}