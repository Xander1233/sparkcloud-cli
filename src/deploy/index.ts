import * as clc from "colorette";

import { logger } from "../logger";
import { SparkCloudError } from "../error";
import { consoleUrl, logBullet, logLabeledBullet, logSuccess } from "../utils";
import { lifecycleHooks } from "./lifecycleHooks";

import * as functions from "./functions";

const TARGETS = {
	functions
};

type Chain = ((context: any, options: any, payload: any) => Promise<unknown>)[];

const chain = async function (fns: Chain, context: any, options: any, payload: any): Promise<void> {
	for (const latest of fns) {
		await latest(context, options, payload);
	}
};

export async function deploy(targetNames: (keyof typeof TARGETS)[], options: any) {
	
	const predeploy: Chain = [];
	const prepares: Chain = [];
	const deploys: Chain = [];
	const releases: Chain = [];
	const postdeploy: Chain = [];

	const context: any = {};

	const startTime = Date.now();

	for (const targetName of targetNames) {
		const target = TARGETS[targetName];

		if (!target) {
			return Promise.reject(new SparkCloudError(`${targetName} is not a valid deploy target`));
		}

		predeploy.push(lifecycleHooks(targetName, 'predeploy'));
		prepares.push(target.prepare);
		deploys.push(target.deploy);
		// releases.push(target.release);
		postdeploy.push(lifecycleHooks(targetName, 'postdeploy'));
	}

	logger.info();
	logger.info(`${clc.bold(clc.white('=== ') + "Deploying to '" + options.projectId + "'...")}`);
	logger.info();

	logBullet("deploying " + clc.bold(targetNames.join(", ")));

	logger.debug("Starting predeploy step(s)...");
	await chain(predeploy, context, options, {});
	const predeployDuration = Date.now() - startTime;
	logger.debug("Predeploy took " + clc.bold(predeployDuration + "ms"));

	logger.debug("Starting preparation step(s)...");
	await chain(prepares, context, options, {});
	const prepareDuration = Date.now() - startTime;
	logger.debug("Preparation took " + clc.bold(prepareDuration + "ms"));

	if (context.endpoints) {
		logger.debug("Deploying " + clc.bold(targetNames.join(", ")));
		await chain(deploys, context, options, {});
		const deployDuration = Date.now() - startTime;
		logger.debug("Deployment took " + clc.bold(deployDuration + "ms"));

		logger.debug("Starting release step(s)...");
		await chain(releases, context, options, {});
		const releaseDuration = Date.now() - startTime;
		logger.debug("Release took " + clc.bold(releaseDuration + "ms"));
	} else {
		logLabeledBullet("functions", "no functions found to deploy");
	}

	logger.debug("Starting postdeploy step(s)...");
	await chain(postdeploy, context, options, {});
	const postdeployDuration = Date.now() - startTime;
	logger.debug("Postdeploy took " + clc.bold(postdeployDuration + "ms"));

	const duration = Date.now() - startTime;
	logger.debug("Deploying took " + clc.bold(duration + "ms"));

	logger.info();
	logSuccess(clc.bold(clc.underline("Deployment complete!")));
	logger.info();

	const url = consoleUrl(options.projectId, '/overview');
	logger.info(clc.bold('Project Console: ') + url);

	return {};
}