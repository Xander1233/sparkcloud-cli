import fetch from "node-fetch";
import { ServiceAccount } from "./serviceAccount";

export interface RemoteConfig {
	deploy: {
		host: string;
		port: number;
		auth: {
			username: string;
			password: string;
		}
	},
	auth: {
		host: string;
		port: number;
		auth: {
			username: string;
			password: string;
		}
	}
}

export async function getRemoteConfig(serviceAccount: ServiceAccount) {

	const response = await fetch(serviceAccount.auth_uri + '/authorize?pid=' + serviceAccount.project_id, {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + serviceAccount.private_key
		}
	});

	if (response.status !== 200) {
		console.error(`Could not authorize with remote server.`);
		process.exit(1);
	}

	const remoteConfig: RemoteConfig = await response.json();

	if (!remoteConfig) {
		console.error(`Invalid remote config.`);
		process.exit(1);
	}

	if (!remoteConfig.deploy) {
		console.error(`Invalid remote config. Missing "deploy" property.`);
		process.exit(1);
	}

	if (!remoteConfig.deploy.host || typeof remoteConfig.deploy.host !== "string") {
		console.error(`Invalid remote config. Missing "deploy.host" property.`);
		process.exit(1);
	}

	if (!remoteConfig.deploy.port || typeof remoteConfig.deploy.port !== "number") {
		console.error(`Invalid remote config. Missing "deploy.port" property.`);
		process.exit(1);
	}

	if (!remoteConfig.deploy.auth) {
		console.error(`Invalid remote config. Missing "deploy.auth" property.`);
		process.exit(1);
	}

	if (!remoteConfig.deploy.auth.username || typeof remoteConfig.deploy.auth.username !== "string") {
		console.error(`Invalid remote config. Missing "deploy.auth.username" property.`);
		process.exit(1);
	}

	if (!remoteConfig.deploy.auth.password || typeof remoteConfig.deploy.auth.password !== "string") {
		console.error(`Invalid remote config. Missing "deploy.auth.password" property.`);
		process.exit(1);
	}

	if (!remoteConfig.auth) {
		console.error(`Invalid remote config. Missing "auth" property.`);
		process.exit(1);
	}

	if (!remoteConfig.auth.host || typeof remoteConfig.auth.host !== "string") {
		console.error(`Invalid remote config. Missing "auth.host" property.`);
		process.exit(1);
	}

	if (!remoteConfig.auth.port || typeof remoteConfig.auth.port !== "number") {
		console.error(`Invalid remote config. Missing "auth.port" property.`);
		process.exit(1);
	}

	if (!remoteConfig.auth.auth) {
		console.error(`Invalid remote config. Missing "auth.auth" property.`);
		process.exit(1);
	}

	if (!remoteConfig.auth.auth.username || typeof remoteConfig.auth.auth.username !== "string") {
		console.error(`Invalid remote config. Missing "auth.auth.username" property.`);
		process.exit(1);
	}

	if (!remoteConfig.auth.auth.password || typeof remoteConfig.auth.auth.password !== "string") {
		console.error(`Invalid remote config. Missing "auth.auth.password" property.`);
		process.exit(1);
	}

	return remoteConfig;
}