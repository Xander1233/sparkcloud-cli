import { secretsVaultUri } from "../api";
import { SparkCloudError } from "../error";
import { fetch } from "../fetch";
import { Account } from "../types/auth";
import { Secret } from "../types/project";

const ROTATING_SECRET_MIN_INTERVAL = 60 * 60;
const ROTATING_SECRET_MAX_INTERVAL = 60 * 60 * 24 * 365 * 3;

export async function secretExistInProject(secretName: string, pid: string, acc: Account) {
	
	const response = await fetch(secretsVaultUri(`/secrets/${pid}/${secretName}`), {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`
		},
	});

	return response.rawResponse.ok;
}

export async function listSecrets(pid: string, acc: Account): Promise<Secret[]> {
	const response = await fetch(secretsVaultUri(`/secrets/${pid}/list`), {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`
		},
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to list secrets`);
	}

	return response.body.secrets;
}

export async function getSecret(secretName: string, pid: string, acc: Account): Promise<Secret> {
	const response = await fetch(secretsVaultUri(`/secrets/${pid}/${secretName}`), {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`
		},
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to get secret ${secretName}`);
	}

	return response.body.secret;
}

export async function getSecretVersion(secretName: string, pid: string, version: string, acc: Account) {
	const response = await fetch(secretsVaultUri(`/secrets/${pid}/${secretName}/${version}`), {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`
		},
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to get secret ${secretName} version ${version}`);
	}

	return response.body.secret;
}

export async function createSecret(secretName: string, pid: string, value: string, acc: Account, expiresIn?: number) {

	let body: any = {
		name: secretName,
		value: value
	};

	if (expiresIn) {
		body.expiresIn = expiresIn;
	}

	const response = await fetch(secretsVaultUri(`/secrets/${pid}/new`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	if (!response.rawResponse.ok) {
		const errorMessage = response.body.error_message;
		if (errorMessage) {
			throw new SparkCloudError(errorMessage);
		} else {
			throw new SparkCloudError(`Failed to create secret ${secretName}`);
		}
	}

	return response.rawResponse.ok;
}

export async function createRotatingSecret(secretName: string, pid: string, acc: Account, rotationInterval: number, expiresIn?: number): Promise<string> {

	if (rotationInterval < ROTATING_SECRET_MIN_INTERVAL || rotationInterval > ROTATING_SECRET_MAX_INTERVAL) {
		throw new SparkCloudError(`Rotation interval must be between ${ROTATING_SECRET_MIN_INTERVAL} and ${ROTATING_SECRET_MAX_INTERVAL} seconds`);
	}

	let body: any = {
		key: secretName,
		interval: rotationInterval
	};

	if (expiresIn) {
		body.expiresIn = expiresIn;
	}

	const response = await fetch(secretsVaultUri(`/secrets/${pid}/new/rotating`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	if (!response.rawResponse.ok) {
		const errorMessage = response.body.error_message;
		if (errorMessage) {
			throw new SparkCloudError(errorMessage);
		} else {
			throw new SparkCloudError(`Failed to create rotating secret ${secretName}`);
		}
	}

	return response.body.value;
}

export async function listSecretsVersions(secretName: string, pid: string, acc: Account) {
	const secret = await getSecret(secretName, pid, acc);

	const lastVersion = secret.lastVersion;

	let versions = [];
	for (let i = 1; i <= lastVersion; i++) versions.push(i);

	return versions;
}

export async function deleteSecret(secretName: string, pid: string, acc: Account) {
	const response = await fetch(secretsVaultUri(`/secrets/${pid}/${secretName}`), {
		method: 'DELETE',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`
		},
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to delete secret ${secretName}`);
	}

	return response.rawResponse.ok;
}

export async function updateSecret(secretName: string, value: string, pid: string, acc: Account) {

	const response = await fetch(secretsVaultUri(`/secrets/${pid}/${secretName}`), {
		method: 'PATCH',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			value: value
		})
	});

	if (!response.rawResponse.ok) {
		throw new SparkCloudError(`Failed to update secret ${secretName}`);
	}

	return response.body.version;
}