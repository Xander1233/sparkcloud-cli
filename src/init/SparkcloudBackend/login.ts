import { fetch } from "../../util/fetch";

export async function login(email: string, password: string) {

	const response = await fetch(`http://127.0.0.1:3006/auth`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			email,
			password
		})
	});

	if (response.response.status !== 200) {
		console.error(`Could not authorize with remote server.`);
		process.exit(1);
	}

	const keyResponse = response.body;

	if (!keyResponse) {
		console.error(`Invalid remote config.`);
		process.exit(1);
	}

	if (!keyResponse.token) {
		console.error(`Invalid remote config. Missing "token" property.`);
		process.exit(1);
	}

	return keyResponse.token;
}