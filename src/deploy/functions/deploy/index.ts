import { crmUri } from "../../../api";
import { fetch } from "../../../fetch";
import { createProjectZipPackage } from "./package";
import * as fs from 'fs';
import { uploadZipPackages } from "./upload";
import { uploadEndpointsMetadata } from "./uploadEndpointsMetadata";
import { SparkCloudError } from "../../../error";

export async function deploy(context: any, options: any) {

	const packages = await createProjectZipPackage(context, options);

	/*await Promise.all(packages.map(async (zip) => {
		return new Promise<void>((resolve) => {
			zip.zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
				.pipe(fs.createWriteStream(zip.meta.codebase + '.zip'))
				.on('finish', function () {
					resolve();
				});
		});
	}));*/

	// Check if there are multiple endpoints with the same name
	const names = context.endpoints.map((endpoint: any) => endpoint.name);
	const duplicates = names.filter((name: string, index: number) => names.indexOf(name) !== index);
	if (duplicates.length > 0) {
		throw new SparkCloudError(`Multiple endpoints with the same name found: ${duplicates.join(", ")}. Please rename them and try again.`);
	}

	const uploadIds = await uploadZipPackages(context, options, packages);
	context.uploadIds = uploadIds;
	await uploadEndpointsMetadata(context, options);

	return context;
}