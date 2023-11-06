import * as path from "path";
import * as fs from "fs";
import * as clc from "colorette";
import { promptOnce } from "../../../prompt";
import { configForCodebase } from "../../../functions/projectConfig";
import { askInstallDependencies } from "./npmDependencies";
import * as utils from "../../../utils";
import { logger } from "../../../logger";

const TEMPLATE_ROOT = path.resolve(__dirname, '../../../../templates/init/functions/javascript');
const PACKAGE_LINTING_TEMPLATE = fs.readFileSync(path.resolve(TEMPLATE_ROOT, 'package.lint.json'), 'utf8');
const PACKAGE_NO_LINTING_TEMPLATE = fs.readFileSync(path.resolve(TEMPLATE_ROOT, 'package.nolint.json'), 'utf8');
const ESLINT_TEMPLATE = fs.readFileSync(path.resolve(TEMPLATE_ROOT, '_eslintrc'), 'utf8');
const INDEX_TEMPLATE = fs.readFileSync(path.resolve(TEMPLATE_ROOT, 'index.js'), 'utf8');
const GITIGNORE_TEMPLATE = fs.readFileSync(path.resolve(TEMPLATE_ROOT, '_gitignore'), 'utf8');

export async function setup(setup: any, config: any) {

	setup.functions.lint = await promptOnce({
		type: 'confirm',
		name: 'lint',
		message: 'Do you want to enable linting?',
		default: true
	});

	const cbconfig = configForCodebase(setup.config.functions, setup.functions.codebase);

	cbconfig.predeploy = [];

	if (setup.functions.lint) {
		cbconfig.predeploy.push(`npm --prefix "$RESOURCE_DIR" run lint`)
		await config.askWriteProjectFile(`${setup.functions.source}/package.json`, PACKAGE_LINTING_TEMPLATE);
		await config.askWriteProjectFile(`${setup.functions.source}/.eslintrc.js`, ESLINT_TEMPLATE);
	} else {
		cbconfig.predeploy.push(`npm --prefix "$RESOURCE_DIR" run build`);
		await config.askWriteProjectFile(`${setup.functions.source}/package.json`, PACKAGE_NO_LINTING_TEMPLATE);
	}

	await config.askWriteProjectFile(`${setup.functions.source}/src/index.js`, INDEX_TEMPLATE);
	await config.askWriteProjectFile(`${setup.functions.source}/.gitignore`, GITIGNORE_TEMPLATE);

	if (config.projectFileExists(`${setup.functions.source}/src/index.ts`)) {
		logger.debug(`${clc.bold(`${setup.functions.source}/src/index.ts`)} exists. Deleting...`);
		await config.deleteProjectFile(`${setup.functions.source}/src/index.ts`);
	}

	if (config.projectFileExists(`${setup.functions.source}/tsconfig.json`)) {
		logger.debug(`${clc.bold(`${setup.functions.source}/tsconfig.json`)} exists. Deleting...`);
		await config.deleteProjectFile(`${setup.functions.source}/tsconfig.json`);
	}

	if (config.projectFileExists(`${setup.functions.source}/tsconfig.dev.json`)) {
		logger.debug(`${clc.bold(`${setup.functions.source}/tsconfig.dev.json`)} exists. Deleting...`);
		await config.deleteProjectFile(`${setup.functions.source}/tsconfig.dev.json`);
	}

	if (config.projectFileExists(`${setup.functions.source}/.eslintrc.js`) && !setup.functions.lint) {
		logger.debug(`${clc.bold(`${setup.functions.source}/.eslintrc.js`)} exists. No linting enabled. Deleting...`);
		await config.deleteProjectFile(`${setup.functions.source}/.eslintrc.js`);
	}

	return askInstallDependencies(setup.functions, config);
}