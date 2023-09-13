import Dockerode from "dockerode";
import { Debuglog } from "../../debuglogs";

function _buildImage(docker: Dockerode, file: any, options: any) {
	return new Promise(async (resolve, reject) => {
		docker.buildImage(file, options, (err, stream) => {
			if (err) {
				console.error("Could not build image.");
				reject(err);
			}

			stream.on('data', (data) => {
				console.log(data.toString());
			});

			stream.on('end', () => {
				resolve(true);
			});

			stream.on('error', (err) => {
				reject(err);
			});
		});
	});
}

export async function buildImage(docker: Dockerode, file: any, options: any) {
	await Debuglog.instance.debug("Building Docker image.");
	await _buildImage(docker, file, options).catch(async (err) => {
		console.error("Could not build Docker image.");
		await Debuglog.instance.log("Could not build Docker image.");
		process.exit(1);
	});
	await Debuglog.instance.debug("Docker image built.");
}