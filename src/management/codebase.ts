import { crmUri } from "../api";
import { fetch } from "../fetch";
import { logger } from "../logger";
import { Account } from "../types/auth";

export async function createNewCodebase(pid: string, codebaseName: string, acc: Account) {

	logger.info(`Creating new codebase ${codebaseName} for project ${pid}`);

	const response = await fetch(crmUri(`/project/${pid}/codebase/new`), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			codebase: codebaseName
		})
	});

	if (!response.rawResponse.ok) {
		throw new Error(`Failed to create new codebase ${codebaseName}`);
	}

	return true;
}
