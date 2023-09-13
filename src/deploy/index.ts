#!/usr/bin/env node

import { Debuglog } from "../debuglogs";
import { getConfig } from "../util/config";
import { execSync } from "child_process";
import Docker from "dockerode";
import { buildImage, pushImage } from "./docker";
import { getServiceAccount } from "../util/serviceAccount";
import { getRemoteConfig } from "../util/getRemoteConfig";
import { loadFunctions } from "./getFunctions";
import { Predeploy } from "./Predeploy";
import { getFunctionsCatalog } from "./SparkcloudBackend/getFunctionsCatalog";
import { initializeDockerClient } from "./docker/initializeDockerClient";
import { updateFunctions } from "./SparkcloudBackend/updateFunctions";

(async () => {

	await Debuglog.instance.log("Starting deployment.");

	await Debuglog.instance.debug("Loading config.");
	const config = await getConfig();
	await Debuglog.instance.debug("Config loaded.");

	await Debuglog.instance.debug("Loading service account.");
	const serviceAccount = await getServiceAccount();
	await Debuglog.instance.debug("Service account loaded.");

	await Debuglog.instance.log("Deploying functions of project " + config.project.name + ".");

	if (config.functions.predeploy && config.functions.predeploy.length > 0) {
		await Debuglog.instance.log("Executing predeploy commands (Count: " + config.functions.predeploy.length + ").");
		await Predeploy(config.functions.predeploy, config);
	}

	await Debuglog.instance.log("Deploying functions of project " + config.project.name + ".");

	/*await Debuglog.instance.debug("Loading remote config.");
	const remoteConfig = await getRemoteConfig(serviceAccount);
	const deployUrl = `${remoteConfig.deploy.host}/`;
	await Debuglog.instance.debug("Remote config loaded.");

	const functionConfigs = await loadFunctions(config.functions.source + "/dist/index.js");

	const functionsCatalog = await getFunctionsCatalog(serviceAccount);

	const functionUpdates = await updateFunctions(serviceAccount, functionConfigs, functionsCatalog);

	if (functionUpdates.filter((update) => !update.success).length > 0) {
		await Debuglog.instance.log("Some functions failed to update.");
		process.exit(1);
	}*/

	const docker = await initializeDockerClient();
	await buildImage(docker, {
		context: config.functions.source,
		src: ['package.json', 'package-lock.json', 'dist']
	}, {
		t: `registry.xndr.tech/sparkcloud/${config.project.name}:latest`,
		platform: 'linux/amd64',
		remote: 'http://localhost:3002/deploy/config/dockerfile'
	});
	await pushImage(docker, `registry.xndr.tech/sparkcloud/${config.project.name}:latest`, {
		deploy: {
			host: 'registry.xndr.tech',
			port: 443,
			auth: {
				username: 'sparkcloud',
				password: 'TestPass'
			}
		},
		auth: {
			host: 'registry.xndr.tech',
			port: 443,
			auth: {
				username: 'xndr',
				password: 'xndr'
			}
		}
	});

	await Debuglog.instance.log("Functions deployed successfully.");

	process.exit(0);
})();
