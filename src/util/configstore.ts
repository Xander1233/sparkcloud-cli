import path from 'path';
import fs from 'graceful-fs';
import writeFileAtomic from 'write-file-atomic';
import { envPaths } from './Paths';
import * as dotProp from './dotProp';

const packageJson = require('../../package.json');

const configDirectory = envPaths(`${packageJson.name}-${packageJson.version}`).config;
const permissionError = 'You don\'t have access to this file.';
const mkdirOptions = {mode: 0o0700, recursive: true};
const writeFileOptions = {mode: 0o0600};

export class Configstore {

	public static shared = new Configstore();

	get all() {
		try {
			return JSON.parse(fs.readFileSync(configDirectory, 'utf8'));
		} catch (error) {
			// Create directory if it doesn't exist
			if (error.code === 'ENOENT') {
				return {};
			}

			// Improve the message of permission errors
			if (error.code === 'EACCES') {
				error.message = `${error.message}\n${permissionError}\n`;
			}

			// Empty the file if it encounters invalid JSON
			if (error.name === 'SyntaxError') {
				writeFileAtomic.sync(configDirectory, '', writeFileOptions);
				return {};
			}

			throw error;
		}
	}

	set all(value) {
		try {
			// Make sure the folder exists as it could have been deleted in the meantime
			fs.mkdirSync(path.dirname(configDirectory), mkdirOptions);

			writeFileAtomic.sync(configDirectory, JSON.stringify(value, undefined, '\t'), writeFileOptions);
		} catch (error) {
			// Improve the message of permission errors
			if (error.code === 'EACCES') {
				error.message = `${error.message}\n${permissionError}\n`;
			}

			throw error;
		}
	}

	get size() {
		return Object.keys(this.all || {}).length;
	}

	get(key: string) {
		const keySplitted = key.split('.');
		let result = this.all;
		for (const keyPart of keySplitted) {
			result = result[keyPart];
		}
		return result;
	}

	set(key: any, value: any) {
		const config = this.all;

		if (arguments.length === 1) {
			for (const k of Object.keys(key)) {
				dotProp.setProperty(config, k, key[k]);
			}
		} else {
			dotProp.setProperty(config, key, value);
		}

		this.all = config;
	}

	has(key: any) {
		return dotProp.hasProperty(this.all, key);
	}

	delete(key: any) {
		const config = this.all;
		dotProp.deleteProperty(config, key);
		this.all = config;
	}

	clear() {
		this.all = {};
	}

	get path() {
		return configDirectory;
	}

}

export const configstore = Configstore.shared;