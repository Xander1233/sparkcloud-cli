import { crmUri } from "../../../api";
import { SparkCloudError } from "../../../error";
import { fetch } from "../../../fetch";
import { logLabeledBullet } from "../../../utils";
import { ProjectZipPackage } from "./package";
import formAutoContent from "form-auto-content";
import * as fs from "fs";

export async function uploadZipPackages(context: any, options: any, zipPackages: ProjectZipPackage[]) {
	let uploadIds: Map<string, string> = new Map();
	
	for (const zipPackage of zipPackages) {
		uploadIds.set(zipPackage.meta.codebase, await uploadZipPackage(context, options, zipPackage));
	}

	return uploadIds;
}

async function uploadZipPackage(context: any, options: any, zipPackage: ProjectZipPackage) {

	logLabeledBullet("functions", `Preparing upload for ${zipPackage.meta.codebase}...`);

	const acc = options.auth;

	if (!acc) {
		throw new SparkCloudError(`No account is currently logged in`, {
			exit: 1
		});
	}

	const form = formAutoContent({
		zip: {
			value: zipPackage.zip.generateNodeStream({ type:'nodebuffer',streamFiles:true }),
			options: {
				filename: `${zipPackage.meta.codebase}.zip`,
				contentType: 'application/zip'
			}
		}
	});

	const response = await fetch(crmUri(`/project/${options.projectId}/codebase/${zipPackage.meta.codebase}/upload`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			...form.headers
		},
		body: form.payload
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to upload ${zipPackage.meta.codebase}`, {
			exit: 1
		});
	}

	const body = response.body as { success: boolean, uploadId: string };

	if (!body.success) {
		throw new SparkCloudError(`Failed to upload ${zipPackage.meta.codebase}`, {
			exit: 1
		});
	}

	logLabeledBullet("functions", `Upload complete for ${zipPackage.meta.codebase}`);

	return body.uploadId;
}