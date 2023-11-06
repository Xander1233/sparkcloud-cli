import * as clc from "colorette";
import { configForCodebase, normalizeAndValidate } from "../../../functions/projectConfig";
import { logLabeledBullet, logLabeledSuccess } from "../../../utils";
import { getEndpointFilters, targetCodebases } from "./prepareFunctionHelper";
import { compareProjectHash, getProjectHash, uploadNewHash } from "./hash";
import { logger } from "../../../logger";
import { getEndpoints } from "./endpoints";
import { checkAPIsEnabled } from "../../../checkAPIenabled";
import { authUri, crmUri } from "../../../api";

export async function prepare(context: any, options: any) {

	const projectId = options.projectId;
	context.config = normalizeAndValidate(options.config.data.functions);
	context.filters = getEndpointFilters(options);

	const codebases = targetCodebases(context.config, context.filters);
	if (codebases.length === 0) {
		throw new Error("No function matches given --only filters. Aborting deployment.");
	}
	for (const codebase of codebases) {
		logLabeledBullet("functions", `preparing ${clc.bold(codebase)} for deployment`);
	}

	await checkAPIsEnabled(crmUri);

	for (const codebase of codebases) {

		const codebaseConfig = configForCodebase(context.config, codebase);

		const hash = await getProjectHash(options, codebaseConfig);
		
		const compareRes = await compareProjectHash(hash, options, codebase);

		if (!compareRes) {
			logLabeledBullet("functions", `functions codebase ${clc.bold(codebase)} has changed. Deploying...`);
		} else {
			if (options.force) {
				logLabeledBullet("functions", `functions codebase ${clc.bold(codebase)} has not changed. ${clc.bold("--force")} flag set. Deploying...`);
			} else {
				logLabeledBullet("functions", `functions codebase ${clc.bold(codebase)} has not changed. No force flag set. Skipping...`);
				continue;
			}
		}

		await uploadNewHash(hash, options, codebase);
		logger.debug(`${codebase} hash updated successfully`);

		const endpoints = await getEndpoints(options, options.config, codebaseConfig, context);

		for (const endpoint of endpoints) {
			logLabeledBullet("functions", `preparing ${clc.bold(endpoint.name)} for deployment`);
		}

		if (!context.endpoints) {
			context.endpoints = [];
		}
		context.endpoints = context.endpoints.concat(endpoints);
	}

	logLabeledSuccess("functions", `functions prepared successfully`);

	return context;
}