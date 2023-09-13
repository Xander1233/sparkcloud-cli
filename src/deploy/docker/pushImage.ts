import Dockerode from "dockerode";
import { Debuglog } from "../../debuglogs";
import { RemoteConfig } from "../../util/getRemoteConfig";

function _pushImage(docker: Dockerode, imageName: string, auth: any): Promise<boolean> {
	return new Promise(async (resolve, reject) => {
		const dockerImage = docker.getImage(imageName);

		const pushImageStream = await dockerImage.push({
			authconfig: auth
		});

		pushImageStream.on('data', (data) => {
			console.log(data.toString());
		});

		pushImageStream.on('end', () => {
			resolve(true);
		});

		pushImageStream.on('error', (err) => {
			reject(err);
		});
	});
}

export async function pushImage(docker: Dockerode, imageName: string, remoteConfig: RemoteConfig) {
	await Debuglog.instance.debug("Pushing Docker image to registry.");
	const auth = {
		username: remoteConfig.deploy.auth.username,
		password: remoteConfig.deploy.auth.password,
		serveraddress: `https://${remoteConfig.deploy.host}:${remoteConfig.deploy.port}/v2`,
		auth: ''
	};
	const pushed = await _pushImage(docker, imageName, auth);

	if (!pushed) {
		console.error("Could not push Docker image to registry.");
		await Debuglog.instance.log("Could not push Docker image to registry.");
		process.exit(1);
	}

	await Debuglog.instance.log("Docker image pushed to registry successfully.");
}