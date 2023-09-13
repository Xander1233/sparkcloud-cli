import fetch from "node-fetch";
import fs from "fs";
import { Debuglog } from "../debuglogs";
import { PickerBuilder, PromptBuilder } from "@xandrrrr/prompt-kit";
import { executeShellCommand } from "../util/executeShellCommand";

export async function initializeExistingProject(key: string, projectId: string) {
	
	const response = await fetch(`http://127.0.0.1:3005/projects/${projectId}`, {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + key
		}
	});

	if (response.status !== 200) {
		console.error(`Could not fetch project.`);
		process.exit(1);
	}

	const project = await response.json();

	if (!project) {
		console.error(`Invalid project.`);
		process.exit(1);
	}

	console.log(project);

	const serviceAccountResponse = await fetch(`http://127.0.0.1:3005/projects/${projectId}/serviceaccounts`, {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + key
		}
	});

	if (serviceAccountResponse.status !== 200) {
		console.error(`Could not fetch service account.`);
	}

	const serviceAccount = await serviceAccountResponse.json();

	if (!serviceAccount) {
		console.error(`Invalid service account.`);
		process.exit(1);
	}

	const projectName = project.name;

	// Create the project directory called "projectName"
	fs.mkdirSync(projectName);

	const sparkcloudrc = {
		project: {
			name: project.name,
		},
		functions: {
			source: "functions",
			predeploy: [
				"npm --prefix $RESOURCE_DIR run build"
			]
		}
	}

	// Create a .sparkcloudrc file in the project directory
	fs.writeFileSync(`${projectName}/.sparkcloudrc`, JSON.stringify(sparkcloudrc, null, 4));

	// Create a functions directory in the project directory
	fs.mkdirSync(`${projectName}/functions`);

	// Create a package.json file in the functions directory
	fs.writeFileSync(`${projectName}/functions/package.json`, JSON.stringify({
		name: projectName,
		scripts: {
			"build": "tsc"
		},
		dependencies: {
			"sparkcloud-sdk": "latest"
		},
		devDependencies: {
			"typescript": "^4.9.0"
		},
		private: true
	}, null, 4));

	// Create a tsconfig.json file in the functions directory
	fs.writeFileSync(`${projectName}/functions/tsconfig.json`, JSON.stringify({
		"compilerOptions": {
		  "module": "commonjs",
		  "noImplicitReturns": true,
		  "noUnusedLocals": true,
		  "outDir": "dist",
		  "sourceMap": true,
		  "strict": true,
		  "target": "es2017"
		},
		"compileOnSave": true,
		"include": [
		  "src"
		]
	}, null, 4));

	fs.writeFileSync(`${projectName}/functions/Dockerfile`, `FROM node:lts-alpine

WORKDIR /usr/src/app

# Copy over the package.json for installing modules
COPY package.json package.json
COPY package-lock.json package-lock.json
# Copy over the compiled source code
COPY dist dist

RUN npm ci

# Entrypoint
CMD ["npm", "run", "start"]`);

	// Create a src directory in the functions directory
	fs.mkdirSync(`${projectName}/functions/src`);

	// Create a index.ts file in the src directory
	fs.writeFileSync(`${projectName}/functions/src/index.ts`, `import * as functions from 'sparkcloud-sdk';

// Create a new function with "export const functionName = functions.https.onCall((data, context) => {});"

`);

	// Create a serviceAccount.json file in the functions directory
	fs.writeFileSync(`${projectName}/functions/serviceAccount.json`, JSON.stringify(serviceAccount, null, 4));

	const prompt = await new PickerBuilder()
		.setPrompt("Do you want to install all dependencies?")
		.setOptions([
			{ option: "Yes", value: true },
			{ option: "No", value: false }
		])
		.setDefaultOption(1)
		.build();

	if (prompt.value) {
		await Debuglog.instance.log("Installing dependencies.");

		const installExitCode = await executeShellCommand(`npm --prefix ${projectName}/functions install`);

		if (installExitCode !== 0) {
			await Debuglog.instance.log("Failed to install dependencies. You can install them manually by running \"npm install\" inside the projects functions directory");
			process.exit(1);
		}

		await Debuglog.instance.log("Dependencies installed successfully.");
	}

	await Debuglog.instance.log("Project initialized successfully.");
	process.exit(0);
}