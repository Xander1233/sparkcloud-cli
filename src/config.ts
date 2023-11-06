import { SparkCloudConfig } from './sparkCloudConfig';

import * as lodash from 'lodash';
import * as clc from 'colorette';
import * as fs from 'fs-extra';
import * as path from 'path';
const cjson = require('cjson');

import { detectProjectRoot } from "./detectProjectRoot";
import { SparkCloudError } from "./error";
import { promptOnce } from "./prompt";
import { resolveProjectPath } from "./projectPath";
import * as utils from "./utils";
import { loadCJSON } from "./loadCJSON";

export class Config {

	static DEFAULT_FUNCTIONS_SOURCE = 'functions';

	static FILENAME = 'sparkcloud.json';
	static MATERIALIZE_TARGETS: Array<keyof SparkCloudConfig> = [
		'functions'
	];

	public options: any;
	public projectDir: string;
	public data: any = {};
	public defaults: any = {};
	public notes: any = {};

	private _src: any;

	constructor(src: any, options: any = {}) {
		this.options = options;
		this.projectDir = this.options.projectDir || detectProjectRoot(this.options);
		this._src = src;

		if (this._src.sparkcloud) {
			this.defaults.project = this._src.sparkcloud;
			utils.logWarning(
				clc.bold('"sparkcloud"') +
				' key in sparkcloud.json is deprecated. Run ' +
				clc.bold('sparkcloud use --add') +
				' instead'
			);
		}

		Config.MATERIALIZE_TARGETS.forEach((target) => {
			if (lodash.get(this._src, target)) {
				lodash.set(this.data, target, this.materialize(target));
			}
		});

		if (this.projectDir && utils.dirExistsSync(this.path(Config.DEFAULT_FUNCTIONS_SOURCE))) {
			if (Array.isArray(this.get("functions"))) {
				if (!this.get("functions.[0].source")) {
					this.set("functions.[0].source", Config.DEFAULT_FUNCTIONS_SOURCE);
				}
			} else {
				if (!this.get("functions.source")) {
					this.set("functions.source", Config.DEFAULT_FUNCTIONS_SOURCE);
				}
			}
		}
	}

	materialize(target: string) {
		const val = lodash.get(this._src, target);
		if (typeof val === 'string') {
			let out = this.parseFile(target, val);
			const segments = target.split('.');
			const lastSegment = segments[segments.length - 1];
			if (Object.keys(out).length === 1 && out[lastSegment]) {
				out = out[lastSegment];
			}
			return out;
		} else if (val !== null && typeof val === 'object') {
			return val;
		}

		throw new SparkCloudError(`Parse Error: "${target}" must be object or import path`, {
			exit: 1
		});
	}

	parseFile(target: string, filePath: string) {

		const fullPath = resolveProjectPath(this.options, filePath);
		const ext = path.extname(fullPath);

		if (!utils.fileExistsSync(filePath)) {
			throw new SparkCloudError(`Parse Error: "${filePath}" does not exist`, {
				exit: 1
			});
		}

		if (ext !== '.json') {
			throw new SparkCloudError(`Parse Error: "${filePath}" must be a JSON file`, {
				exit: 1
			});
		}

		return loadCJSON(fullPath);
	}

	get src(): SparkCloudConfig {
		return this._src as SparkCloudConfig;
	}

	get(key: string, fallback?: any): any {
		return lodash.get(this.data, key, fallback);
	}

	set(key: string, value: any) {
		lodash.set(this._src, key, value);
		return lodash.set(this.data, key, value);
	}

	has(key: string): boolean {
		return lodash.has(this.data, key);
	}

	path(pathName: string) {
		const outPath = path.normalize(path.join(this.projectDir, pathName));
		if (path.relative(this.projectDir, outPath).includes("..")) {
			throw new SparkCloudError(`${clc.bold(pathName)} is outside of project directory`, { exit: 1 });
		}
		return outPath;
	}

	readProjectFile(path: string, options: any = {}) {

		options = options || {};

		try {
			const content = fs.readFileSync(this.path(path), 'utf8');

			if (options.json) {
				return JSON.parse(content);
			}
			return content;
		} catch(e: any) {
			if (options.fallback) {
				return options.fallback;
			}
			if (e.code === "ENOENT") {
				throw new SparkCloudError(`File not found: ${this.path(path)}`, { original: e });
			}
			throw e;
		}
	}

	readProjectDir(path: string) {
		try {
			const files = fs.readdirSync(this.path(path));
			return files;
		} catch(e: any) {
			if (e.code === "ENOENT") {
				throw new SparkCloudError(`Directory not found: ${this.path(path)}`, { original: e });
			}
			throw e;
		}
	}

	writeProjectFile(path: string, content: any) {
		if (typeof content !== "string") {
			content = JSON.stringify(content, null, 2);
		}

		fs.ensureFileSync(this.path(path));
		fs.writeFileSync(this.path(path), content, "utf8");
	}

	projectFileExists(path: string): boolean {
		return fs.existsSync(this.path(path));
	}

	deleteProjectFile(path: string) {
		fs.removeSync(this.path(path));
	}

	askWriteProjectFile(path: string, content: any, force?: boolean) {

		const writeTo = this.path(path);
		let next;

		if (utils.fileExistsSync(writeTo) && !force) {
			next = promptOnce({
				type: 'confirm',
				message: `File ${clc.underline(path)} already exists. Overwrite?`,
				default: false
			});
		} else {
			next = Promise.resolve(true);
		}

		return next.then((result: boolean) => {
			if (result) {
				this.writeProjectFile(path, content);
				utils.logSuccess(`Wrote ${clc.bold(path)}`);
			} else {
				utils.logBullet(`Skipping write of ${clc.bold(path)}`);
			}
		});
	}

	public static load(options: any, allowMissing?: boolean): Config | null {
		const projectDir = detectProjectRoot(options);
		const filename = options.configPath || Config.FILENAME;

		if (projectDir) {
			try {
				const filePath = path.resolve(projectDir, path.basename(filename));
				const data = cjson.load(filePath);

				return new Config(data, options);
			} catch(e: any) {
				throw new SparkCloudError(`There was an error loading ${clc.bold(filename)}:\n\n${e.message}`, {
					exit: 1
				});
			}
		}

		if (allowMissing) {
			return null;
		}

		throw new SparkCloudError(`Not in a SparkCloud app directory (could not locate ${Config.FILENAME})`, {
			exit: 1,
			status: 404
		});
	}
}