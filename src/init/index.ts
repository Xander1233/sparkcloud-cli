#!/usr/bin/env node

import { Debuglog } from "../debuglogs";
import { PickerBuilder, PromptBuilder, Terminal, Text } from '@xandrrrr/prompt-kit';
import { fetchAllProjects } from "./SparkcloudBackend/fetchAllProjects";
import { initializeExistingProject } from "./initializeExistingProject";
import fetch from "node-fetch";
import { checkLogins } from "../all/auth/checkLogin";
import { login } from "../all/auth/login";

(async () => {

	let loginCheck = await checkLogins();

	let token = loginCheck?.token;
	let uid = loginCheck?.uid;

	if (!loginCheck) {
		const loginRes = await login();
		token = loginRes.token;
		uid = loginRes.uid;
	}
	
	await Debuglog.instance.log("Logged in to SparkCloud.");

	const projects = await fetchAllProjects(token);

	const projectPrompt = await new PickerBuilder()
		.setOptions([ ...projects.map((project: any) => {
			return {
				option: project.name,
				value: project.id
			};
		}), { option: 'Create a new project', value: 'new' }])
		.setPrompt("Select a project:")
		.build();

	if (projectPrompt.value !== 'new') {
		await initializeExistingProject(token, projectPrompt.value);
	}

	const projectNamePrompt = await new PromptBuilder()
		.setMessage("Enter a name for your project:")
		.prompt();

	const projectDescriptionPrompt = await new PromptBuilder()
		.setMessage("Enter a description for your project:")
		.prompt();

	const project = {
		name: projectNamePrompt,
		description: projectDescriptionPrompt
	};

	const result = await fetch("http://127.0.0.1:3005/projects", {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(project)
	});


	if (result.status !== 200) {
		console.error(`Could not create project.`);
		process.exit(1);
	}

	const { id } = await result.json();

	await initializeExistingProject(token, id);
})();