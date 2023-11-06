import { logger } from "../logger";
import { crmUri } from "../api";
import { getGlobalDefaultAccount } from "../auth";
import { SparkCloudError } from "../error";
import { fetch } from "../fetch";
import { Project } from "../types/project";
import { Account } from "../types/auth";

export async function getSparkCloudProject(pid: string): Promise<Project> {

	try {
		const acc = getGlobalDefaultAccount();

		if (!acc) {
			throw new SparkCloudError(`No account is currently logged in`, {
				exit: 1
			});
		}

		const response = await fetch(crmUri(`/project/${pid}`), {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${acc.tokens.access_token}`
			},
		});

		if (!response) {
			throw new SparkCloudError(`Failed to get project ${pid}. Make sure the project exists and you have enough permissions`, {
				exit: 1
			});
		}

		return response.body as Project;
	} catch(e: any) {
		throw new SparkCloudError(`Failed to get project ${pid}. Make sure the project exists and you have enough permissions`, {
			exit: 1,
			status: e.status,
			original: e
		});
	}
}

export async function getUsersProjects(acc: Account): Promise<Project[]> {

	try {
		if (!acc) {
			throw new SparkCloudError(`No account is currently logged in`, {
				exit: 1
			});
		}

		const response = await fetch(crmUri(`/project/list`), {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${acc.tokens.access_token}`
			},
		});

		if (!response) {
			throw new SparkCloudError(`Failed to get projects. Make sure you have enough permissions`, {
				exit: 1
			});
		}

		return response.body.projects as Project[];
	} catch(e: any) {
		console.log(e);
		throw new SparkCloudError(`Failed to get projects. Make sure you have enough permissions`, {
			exit: 1,
			status: e.status,
			original: e
		});
	}
}

export async function checkProjectId(pid: string): Promise<string | undefined> {

	try {
		const acc = getGlobalDefaultAccount();

		if (!acc) {
			throw new SparkCloudError(`No account is currently logged in`, {
				exit: 1
			});
		}

		const response = await fetch(crmUri(`/project/check-pid`), {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${acc.tokens.access_token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				pid
			})
		});

		if (!response) {
			throw new SparkCloudError(`Failed to check project id ${pid}`, {
				exit: 1
			});
		}

		const body = response.body as { status: string, pid?: string };

		if (body.status === 'ID_VALID') {
			return body.pid;
		}

		if (body.status === 'ID_INVALID') {
			return undefined;
		}

		return body.pid;
	} catch(e: any) {
		throw new SparkCloudError(`Failed to check project id ${pid}`, {
			exit: 1,
			status: e.status,
			original: e
		});
	}
}

export async function createProject(pid: string, name: string, acc: Account): Promise<Project> {

	if (!acc) {
		throw new SparkCloudError(`No account is currently logged in`, {
			exit: 1
		});
	}

	const response = await fetch(crmUri(`/project/new`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			pid,
			name
		})
	});

	if (!response) {
		throw new SparkCloudError(`Failed to create project ${pid}`, {
			exit: 1
		});
	}

	if (!response.rawResponse.ok) {
		logger.debug(`[projects] Failed to create project ${pid}. Error: ${response.body}`);
		throw new SparkCloudError(`Failed to create project ${pid}`, {
			exit: 1,
			status: response.rawResponse.status
		});
	}

	return {
		pid,
		name,
		publicName: name,
		environmentType: 'development',
		defaultResourceLocation: 'none'
	};
}

