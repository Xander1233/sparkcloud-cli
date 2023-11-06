import jszip from 'jszip';
import * as fs from 'fs/promises';
import * as utils from "../../../utils";

const PACKAGE_FILES: string[] = [
	"package.json",
	"package-lock.json",
	"lib"
];

export interface ProjectZipPackage { meta: { codebase: string }, zip: jszip }

export async function createProjectZipPackage(context: any, options: any): Promise<ProjectZipPackage[]> {

	const config = options.config;
	
	let zipFiles: ProjectZipPackage[] = [];

	let codebases: any[] = [];
	// Loop over context.config and check if at least one context.endpoints entry has the codebase
	for (const codebaseConfig of context.config) {
		if (context.endpoints.find((endpoint: any) => endpoint.codebase === codebaseConfig.codebase) && !codebases.find((codebase: any) => codebase.codebase === codebaseConfig.codebase)) {
			codebases.push(codebaseConfig);
		}
	}

	for (const codebaseConfig of codebases) {

		const zip = new jszip();

		for await (const file of PACKAGE_FILES) {
			if (typeof file === "string") {
				await createZipFile(zip, config.path(`${codebaseConfig.source}/${file}`));
			}
		}

		zipFiles.push({ meta: { codebase: codebaseConfig.codebase }, zip });
	}

	return zipFiles;
}

async function createZipFile(zip: jszip, path: string) {
	if (utils.dirExistsSync(path)) {
		const files = await fs.readdir(path);
		const zipFolder = zip.folder(path.split("/").pop());
		for (const file of files) {
			const filePath = path + "/" + file;
			await createZipFile(zipFolder, filePath);
		}
		return zip;
	}
	// Read file
	const content = await fs.readFile(path);
	zip.file(path.split("/").pop(), content);
	return zip;
}