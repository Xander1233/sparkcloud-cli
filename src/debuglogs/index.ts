import { join } from "path";
import { WriteStream, createWriteStream } from "fs";

export class Debuglog {

	public static instance = new Debuglog();

	private logFilePath = join(process.cwd(), 'sparkcloud-debug.log');

	private stream: WriteStream;

	private initialized = false;

	private constructor() {
		if (process.env.DEBUG) {
			console.log("Debugging enabled.");
		}
	}

	public async initFile() {

		this.stream = createWriteStream(this.logFilePath, { flags: 'w' });

		this.stream.write(`SparkCloud Debug Log
====================
This file is used to log debug messages from the SparkCloud CLI.
It is not required for the CLI to function, but it can be useful
for debugging purposes.

Version: ${process.env.npm_package_version}
====================\n`);

		this.initialized = true;
	}

	public debug(message: string) {
		return new Promise(async (resolve, reject) => {
			if (process.env.DEBUG) {
				console.log(message);
			}
	
			if (!this.initialized) {
				await this.initFile();
			}
	
			this.stream = createWriteStream(this.logFilePath, { flags: 'a' });
	
			this.stream.write("[DEBUG] " + message + "\n");
	
			this.stream.end();
			this.stream.close();

			this.stream.on('close', () => {
				resolve(true);
			});

			this.stream.on('error', (err) => {
				reject(err);
			});
		});
	}

	public log(message: string) {
		return new Promise(async (resolve, reject) => {

			console.log(message);
	
			if (!this.initialized) {
				await this.initFile();
			}
	
			this.stream = createWriteStream(this.logFilePath, { flags: 'a' });
	
			this.stream.write("[LOG] " + message + "\n");
	
			this.stream.end();
			this.stream.close();

			this.stream.on('close', () => {
				resolve(true);
			});

			this.stream.on('error', (err) => {
				reject(err);
			});
		});
	}
}