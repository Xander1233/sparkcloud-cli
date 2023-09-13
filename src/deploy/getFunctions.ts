import { Debuglog } from "../debuglogs";
import { RuntimeOptions } from "../structs/RuntimeOptions";
import { Regions } from "../structs/consts";

export interface Function { name: string, type: string, runtimeOptions: RuntimeOptions, regions: Regions }

export async function loadFunctions(from: string) {

	await Debuglog.instance.debug("Loading functions configs.");

	const functions = require(process.cwd() + '/' + from);

	const functionArray: Function[] = [];

	for (const functionName in functions) {
		if (functions.hasOwnProperty(functionName)) {
			const element = functions[functionName];
			
			if ("type" in element && "handler" in element && "options" in element) {
				functionArray.push({
					name: functionName,
					type: element.type,
					runtimeOptions: element.options.runWith,
					regions: element.options.regions
				});
			}
		}
	}

	await Debuglog.instance.log("Functions configs loaded.");

	return functionArray;
}