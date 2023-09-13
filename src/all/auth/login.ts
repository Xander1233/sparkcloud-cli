import { PromptBuilder } from "@xandrrrr/prompt-kit";
import { Debuglog } from "../../debuglogs";
import { fetch } from "../../util/fetch";
import { configstore } from "../../util/configstore";
import { checkToken } from "./checkLogin";
import * as os from "os";

export async function login() {

	await Debuglog.instance.debug("Starting login process.");
	await Debuglog.instance.log("Log in to SparkCloud.");

	const email = await new PromptBuilder()
		.setMessage("Enter your SparkCloud email:")
		.prompt();

	await Debuglog.instance.debug(`Using ${email}.`);

	const password = await new PromptBuilder()
		.setMessage("Enter your SparkCloud password:")
		.prompt();

	await Debuglog.instance.debug(`Using "REDACTED".`);

	const device = {
		os: os.type(),
		arch: os.arch(),
		hostname: os.hostname()
	}

	const { body, response: { status } } = await fetch("http://127.0.0.1:3006/auth/user/signin", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ email, password, device })
	});

	if (status !== 200) {
		await Debuglog.instance.debug(`Login failed with status ${status}.`);
		await Debuglog.instance.log("Login failed. Please try it again.");
		process.exit(1);
	}

	const { token } = body;

	const { uid } = await checkToken(token);

	await Debuglog.instance.debug(`Login was successful.`);
	await Debuglog.instance.log("Logged in to SparkCloud.");

	configstore.set("user", {
		token, uid
	});

	return { token, uid };
}
