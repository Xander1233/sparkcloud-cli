import * as clc from "colorette";

import { configstore } from "./configstore";
import { Account, TokensWithExpiration, User } from "./types/auth";
import { SparkCloudError } from "./error";
import { authUri } from "./api";
import { fetch } from "./fetch";
import { logger } from "./logger";

export function getGlobalDefaultAccount(): Account | undefined {

	logger.debug(`[auth] Default account requested`);

	const user = configstore.get("user") as User | undefined;
	const tokens = configstore.get("tokens") as TokensWithExpiration | undefined;

	if (!user || !tokens) {
		logger.debug(`[auth] No default account found`);
		return undefined;
	}

	logger.debug(`[auth] Default account found: ${clc.bold(user.email)}`);

	return {
		user,
		tokens
	};
}

export function setGlobalDefaultAccount(account: Account) {
	logger.debug(`[auth] Setting default account to ${clc.bold(account.user.email)}`);
	configstore.set("user", account.user);
	configstore.set("tokens", account.tokens);
}

function invalidCredentialError(): SparkCloudError {
	return new SparkCloudError(`Authentication Error: Your credentials are no longer valid. Please run ${clc.bold("sparkcloud login")} to login again\n\nFor CI servers and headless environments, generate a new token with ${clc.bold("sparkcloud login:ci")}`)
}

export function clearGlobalDefaultAccount() {
	logger.debug(`[auth] Clearing default account`);
	configstore.delete("user");
	configstore.delete("tokens");
}

export async function logout() {
	
	logger.debug(`[auth] Sign out of default account`);

	const acc = getGlobalDefaultAccount();

	if (!acc) {
		logger.debug(`[auth] Not signed in. No action taken`);
		throw new SparkCloudError(`No account is currently logged in`, {
			exit: 1
		});
	}

	const response = await fetch(authUri("/auth/signout"), {
		method: 'DELETE',
		headers: {
			'Authorization': `Bearer ${acc.tokens.access_token}`
		}
	});

	logger.debug(`[auth] Sign out of default account (${clc.bold(acc.user.email)}) successful`);

	clearGlobalDefaultAccount();
}

export async function login(credentials: { password: string, email: string }) {
	
	logger.debug(`[auth] Sign in to sparkcloud account`);

	if (!credentials.email) {
		logger.debug(`[auth] No email address provided`);
		throw new SparkCloudError(`Authentication Error: No email address provided`, {
			exit: 1
		});
	}

	if (!credentials.password) {
		logger.debug(`[auth] No password provided`);
		throw new SparkCloudError(`Authentication Error: No password provided`, {
			exit: 1
		});
	}

	const response = await fetch(authUri("/auth/user/signin"), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			email: credentials.email,
			password: credentials.password,
			metadata: {
				type: 'cli',
				os: process.platform,
			}
		})
	}, { bodyOptions: { omitRequest: true, omitResponse: true } });

	if (!response.rawResponse.ok) {
		logger.debug(`[auth] Failed to sign in to ${clc.bold(credentials.email)}`);
		throw new SparkCloudError(`Authentication Error: Failed to sign in to ${clc.bold(credentials.email)}`, {
			exit: 1,
			status: response.rawResponse.status
		});
	}

	const body = response.body;

	if (!body.token || !body.uid) {
		logger.debug(`[auth] Malformed response`);
		throw new SparkCloudError(`Authentication Error: Malformed response`, {
			exit: 1
		});
	}

	logger.debug(`[auth] Sign in to ${clc.bold(credentials.email)} successful`);

	logger.debug(`[auth] Fetching user info for ${clc.bold(credentials.email)}`);

	// Fetch user info
	const userResponse = await fetch(authUri(`/user/me`), {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${body.token}`
		}
	}, { bodyOptions: { omitResponse: true } });

	if (!userResponse.rawResponse.ok) {
		logger.debug(`[auth] Failed to fetch user info`);
		throw new SparkCloudError(`Authentication Error: Failed to fetch user info`, {
			exit: 1,
			status: userResponse.rawResponse.status
		});
	}

	logger.debug(`[auth] Fetching user info for ${clc.bold(credentials.email)} successful`);

	const user = userResponse.body;

	const account = {
		user: {
			displayName: user.displayName,
			email: user.email,
			uid: user.uid,
		},
		tokens: {
			access_token: body.token
		}
	};

	setGlobalDefaultAccount(account);

	return account;
}

export async function register(credentials: { email: string, password: string, displayName: string }) {

	logger.debug(`[auth] Registering new sparkcloud account`);

	if (!credentials.email) {
		logger.debug(`[auth] No email address provided`);
		throw new SparkCloudError(`Authentication Error: No email address provided`, {
			exit: 1
		});
	}

	if (!credentials.password) {
		logger.debug(`[auth] No password provided`);
		throw new SparkCloudError(`Authentication Error: No password provided`, {
			exit: 1
		});
	}

	if (!credentials.displayName) {
		logger.debug(`[auth] No display name provided`);
		throw new SparkCloudError(`Authentication Error: No display name provided`, {
			exit: 1
		});
	}

	const response = await fetch(authUri("/user/new"), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			email: credentials.email,
			password: credentials.password,
			metadata: {
				displayName: credentials.displayName,
				firstName: credentials.displayName.split(' ')[0],
				lastName: credentials.displayName.split(' ')[1],
				birthday: 1062540000000
			}
		})
	}, { bodyOptions: { omitRequest: true } });

	console.log(await response.body);

	if (!response.rawResponse.ok) {
		logger.debug(`[auth] Failed to register new account`);
		throw new SparkCloudError(`Authentication Error: Failed to register new account`, {
			exit: 1
		});
	}

	const body = response.body;

	if (!body.uid) {
		logger.debug(`[auth] Malformed response`);
		throw new SparkCloudError(`Authentication Error: Malformed response`, {
			exit: 1
		});
	}

	logger.debug(`[auth] Registering new sparkcloud account successful`);

	const acc = await login({
		email: credentials.email,
		password: credentials.password
	});

	return acc;
}