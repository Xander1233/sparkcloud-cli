import fetch from "node-fetch";

export async function fetchAllProjects(key: string) {

	const response = await fetch("http://127.0.0.1:3005/projects", {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + key
		}
	});

	if (response.status !== 200) {

		const res = await response.json();

		console.error(res);

		console.error(`Could not fetch projects.`);
		process.exit(1);
	}

	const projects = await response.json();

	if (!projects) {
		console.error(`Invalid projects.`);
		process.exit(1);
	}

	return projects;
}