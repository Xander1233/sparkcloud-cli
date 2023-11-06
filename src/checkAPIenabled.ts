import { SparkCloudError } from "./error";
import { fetch } from "./fetch";
import { logBullet, logError, logSuccess } from "./utils";

export async function checkAPIEnabled(api: (path: string) => string) {

	logBullet(`Ensuring API is enabled: ${api.name}`);

	const path = '/health';
	const url = api(path);

	try {
		const response = await fetch(url, { method: 'GET' });
		const body = response.body;

		if (!body.status) {
			return false;
		}

		if (body.status !== 'OK') {
			logError(`Required API is not enabled: ${api.name}`);
			throw new SparkCloudError(`Required API is not enabled: ${api.name}`);
		}

		logSuccess(`API is enabled: ${api.name}`);

		return true;
	} catch(e) {
		logError(`Required API is not enabled: ${api.name}`);
		throw new SparkCloudError(`Required API is not enabled: ${api.name}`);
	}
}

export async function checkAPIsEnabled(...apis: ((path: string) => string)[]) {
	const results = await Promise.all(apis.map(checkAPIEnabled));
	return results.every(result => result === true);
}