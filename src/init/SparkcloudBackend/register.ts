import fetch from "node-fetch";

export async function register(email: string, password: string, displayName: string) {

	const response = await fetch(`http://127.0.0.1:3006/user/new`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			email,
			password,
			displayName
		})
	});

	if (response.status !== 200) {
		console.error(`Could not register new account.`);
		process.exit(1);
	}

	const { uid } = await response.json() as { uid: string };

	return uid;
}