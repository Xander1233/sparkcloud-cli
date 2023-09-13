import { configstore } from "../../util/configstore";
import { Debuglog } from "../../debuglogs";
import { fetch } from "../../util/fetch";

export async function checkLogins(): Promise<{ token: string, uid: string } | undefined> {

	const user = configstore.get("user");

	if (!user) {
		console.error("You are not logged in. Please log in first.");
		return undefined;
	}

	const { uid, token } = user;

	const response = await checkToken(token, uid);

	if (!response) {
		console.error("You are not logged in. Please log in first.");
		return undefined;
	}

	return response;
}

export async function checkToken(token: string, uid?: string): Promise<{ token: string, uid: string } | undefined> {

	const checkTokenResponse = await fetch("http://127.0.0.1:3006/auth/user/verify", {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + token
		}
	});

	if (checkTokenResponse.response.status !== 200) {
		return undefined;
	}

	const validToken = checkTokenResponse.body;

	if (!validToken) {
		return undefined;
	}

	if (!validToken.uid) {
		return undefined;
	}

	if (uid && validToken.uid !== uid) {
		return undefined;
	}

	return { token, uid: validToken.uid };
}

export async function logout(token: string): Promise<boolean> {
	const logoutResponse = await fetch("http://127.0.0.1:3006/auth/user/signout", {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + token
		}
	});

	configstore.delete("user");

	if (logoutResponse.response.status !== 200) {
		return false;
	}

	return true;
}
