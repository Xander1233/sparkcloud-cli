import fetch from "node-fetch";
import { ServiceAccount } from "../../util/serviceAccount";
import { RuntimeOptions } from "../../structs/RuntimeOptions";
import { Regions } from "../../structs/consts";
import { Debuglog } from "../../debuglogs";

interface Function {
	name: string,
	type: string,
	runtimeOptions: RuntimeOptions,
	regions: Regions
};

export async function getFunctionsCatalog(serviceAccount: ServiceAccount) {

	await Debuglog.instance.debug("Fetching deployed functions catalog.");

	const response = await fetch(serviceAccount.auth_uri + '/functions', {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + serviceAccount.private_key
		}
	});

	const functionCatalog: Function[] = await response.json();

	console.log(functionCatalog);

	if (response.status !== 200) {
		console.error(`Could not fetch deployed functions catalog.`);
		process.exit(1);
	}

	await Debuglog.instance.debug("Fetched deployed functions catalog successfully.");

	return functionCatalog;
}