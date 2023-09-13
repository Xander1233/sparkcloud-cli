import { readFile } from "fs/promises";
import { join } from "path";

export interface ServiceAccount {
	type: string;
	email: string;
	project_id: string;
	private_key: string;
	auth_uri?: string;
}

export async function getServiceAccount() {

	const serviceAccountPath = join(process.cwd(), 'functions', 'serviceAccount.json');

	const serviceAccountFile = await readFile(serviceAccountPath, { encoding: 'utf-8' })
		.catch((err) => {
			console.error(`Could not read service account file.`);
			process.exit(1);
		});

	const serviceAccount = JSON.parse(serviceAccountFile);

	if (!serviceAccount) {
		console.error(`Invalid service account file.`);
		process.exit(1);
	}

	if (!serviceAccount.type || typeof serviceAccount.type !== "string") {
		console.error(`Invalid service account file. Missing "type" property.`);
		process.exit(1);
	}

	if (!serviceAccount.project_id || typeof serviceAccount.project_id !== "string") {
		console.error(`Invalid service account file. Missing "project_id" property.`);
		process.exit(1);
	}

	if (!serviceAccount.private_key || typeof serviceAccount.private_key !== "string") {
		console.error(`Invalid service account file. Missing "private_key" property.`);
		process.exit(1);
	}

	if (!serviceAccount.email || typeof serviceAccount.email !== "string") {
		console.error(`Invalid service account file. Missing "email" property.`);
		process.exit(1);
	}

	return serviceAccount;
}