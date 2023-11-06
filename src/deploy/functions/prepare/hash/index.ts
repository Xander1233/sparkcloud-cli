import { readFile } from 'fs/promises';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { BinaryLike } from 'crypto';
import * as path from 'path';
import { detectProjectRoot } from '../../../../detectProjectRoot';
import { SparkCloudError } from '../../../../error';
import { ValidatedSingle, configForCodebase, normalizeAndValidate } from '../../../../functions/projectConfig';
import { fileExistsSync } from '../../../../utils';
import { getGlobalDefaultAccount } from '../../../../auth';
import { crmUri } from '../../../../api';
import { fetch } from '../../../../fetch';

const INCLUDE_PROJECT_FILES = [
	"lib",
	"package.json",
	"package-lock.json"
]

function createHash(data: BinaryLike, algorithm: string = "sha1"): string {
	const hash = crypto.createHash(algorithm);
	hash.update(data);
	return hash.digest('hex');
}

export async function getSourceHash(pathToFile: string): Promise<string> {
	if (!fileExistsSync(pathToFile)) {
		const files = await fs.readdir(pathToFile);
		const hashes = await Promise.all(files.map((file) => getSourceHash(path.join(pathToFile, file))));
		return createHash(hashes.join(''));
	}
	const data = await readFile(pathToFile);
	return createHash(data);
}

export async function getProjectHash(options: any, codebaseConfig: ValidatedSingle) {

	const projectRoot = detectProjectRoot(options);

	if (!projectRoot) {
		throw new SparkCloudError("Could not detect project root");
	}
	
	const sourceDir = options.config.path(codebaseConfig.source);

	const readFiles = await fs.readdir(sourceDir);
	const files = readFiles.filter((file) => INCLUDE_PROJECT_FILES.includes(file));

	const hashes = await Promise.all(files.map((file) => getSourceHash(options.config.path(path.join(codebaseConfig.source, file)))));

	return createHash(hashes.join(''));
}

export async function compareProjectHash(hash: string, options: any, codebase: string) {

	const acc = options.auth;

	if (!acc) {
		throw new SparkCloudError(`No account is currently logged in`, {
			exit: 1
		});
	}

	const response = await fetch(crmUri(`/project/${options.projectId}/codebase/${codebase}/compare-hash`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			hash
		})
	});

	if (!response) {
		throw new SparkCloudError(`Failed to compare hash for ${options.projectId}:${codebase}`, {
			exit: 1
		});
	}

	const body = response.body as { equal: boolean };

	return body.equal;
}

export async function uploadNewHash(hash: string, options: any, codebase: string) {
	
	const acc = options.auth;

	if (!acc) {
		throw new SparkCloudError(`No account is currently logged in`, {
			exit: 1
		});
	}

	const response = await fetch(crmUri(`/project/${options.projectId}/codebase/${codebase}/hash`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			hash
		})
	});

	if (!response) {
		throw new SparkCloudError(`Failed to update hash for ${options.projectId}:${codebase}`, {
			exit: 1
		});
	}

	return true;
}