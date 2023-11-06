import * as clc from "colorette";
import { clearGlobalDefaultAccount, getGlobalDefaultAccount } from "./auth";
import { SparkCloudError } from "./error";
import { fetch } from "./fetch";
import { authUri } from "./api";

export async function requireAuth() {

	const account = getGlobalDefaultAccount();

	if (!account) {
		throw new SparkCloudError(`Authentication Error: You are not logged in. Please run ${clc.bold("sparkcloud login")} to login`, {
			exit: 1
		});
	}

	const response = await fetch(authUri("/auth/user/verify"), {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${account.tokens.access_token}`
		}
	});

	if (!response) {
		clearGlobalDefaultAccount();
		throw new SparkCloudError(`Authentication Error: Your credentials are no longer valid. Please run ${clc.bold("sparkcloud login")} to login again\n\nFor CI servers and headless environments, generate a new token with ${clc.bold("sparkcloud login:ci")}`, {
			exit: 1
		});
	}

	return account;
}

export async function requireAuthCmd(options: any) {
	options.auth = await requireAuth();
}