import Dockerode from "dockerode";
import { Debuglog } from "../../debuglogs";

export async function initializeDockerClient() {
	await Debuglog.instance.debug("Initializing Docker client.");
	const docker = new Dockerode();
	await Debuglog.instance.debug("Docker client initialized.");
	return docker;
}