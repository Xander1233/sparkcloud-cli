import { Debuglog } from "../../debuglogs";
import { ServiceAccount } from "../../util/serviceAccount";
import { Function } from "../getFunctions";

interface FunctionUpdateResult {
	function: Function,
	success: boolean,
	type: "create" | "update" | "delete"
}

export async function updateFunctions(serviceAccount: ServiceAccount, functionConfigs: Function[], functionCatalog: Function[]) {

	const result: FunctionUpdateResult[] = [];

	const actionPromises: Promise<FunctionUpdateResult>[] = [];

	for (const functionConfig of functionConfigs) {
		const functionExists = functionCatalog.find((functionCatalogEntry) => {
			return functionCatalogEntry.name === functionConfig.name;
		});

		actionPromises.push(new Promise(async (resolve, reject) => {
			if (functionExists) {
				const updateResult = await updateFunction(serviceAccount, functionConfig);
				resolve({
					function: functionConfig,
					success: updateResult,
					type: "update"
				});
			} else {
				const createResult = await createFunction(serviceAccount, functionConfig);
				resolve({
					function: functionConfig,
					success: createResult,
					type: "create"
				});
			}
		}));
	}

	for (const functionCatalogEntry of functionCatalog) {
		
		const functionExists = functionConfigs.find((functionConfig) => {
			return functionCatalogEntry.name === functionConfig.name;
		});

		if (!functionExists) {
			actionPromises.push(new Promise(async (resolve, reject) => {
				const deleteResult = await deleteFunction(serviceAccount, functionCatalogEntry);
				resolve({
					function: functionCatalogEntry,
					success: deleteResult,
					type: "delete"
				});
			}));
		}
	}

	return result;
}

async function updateFunction(serviceAccount: ServiceAccount, functionConfig: Function) {

	await Debuglog.instance.log(`Updating function ${functionConfig.name}.`);

	const response = await fetch(serviceAccount.auth_uri + '/functions/' + functionConfig.name, {
		method: 'PATCH',
		headers: {
			'Authorization': 'Bearer ' + serviceAccount.private_key,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(functionConfig)
	});

	if (response.status !== 200) {
		await Debuglog.instance.debug(`Could not update function ${functionConfig.name}.`);
		return false;
	}

	await Debuglog.instance.log(`Function ${functionConfig.name} updated successfully.`);

	return true;
}

async function createFunction(serviceAccount: ServiceAccount, functionConfig: Function) {

	await Debuglog.instance.log(`Creating function ${functionConfig.name}.`);

	const response = await fetch(serviceAccount.auth_uri + '/functions', {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + serviceAccount.private_key,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(functionConfig)
	});

	if (response.status !== 200) {
		await Debuglog.instance.debug(`Could not create function ${functionConfig.name}.`);
		return false;
	}

	await Debuglog.instance.log(`Function ${functionConfig.name} created successfully.`);

	return true;
}

async function deleteFunction(serviceAccount: ServiceAccount, functionConfig: Function) {
	
	await Debuglog.instance.log(`Deleting function ${functionConfig.name}.`);

	const response = await fetch(serviceAccount.auth_uri + '/functions/' + functionConfig.name, {
		method: 'DELETE',
		headers: {
			'Authorization': 'Bearer ' + serviceAccount.private_key
		}
	});

	if (response.status !== 200) {
		await Debuglog.instance.debug(`Could not delete function ${functionConfig.name}.`);
		return false;
	}

	await Debuglog.instance.log(`Function ${functionConfig.name} deleted successfully.`);

	return true;
}