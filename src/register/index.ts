import { PromptBuilder, Terminal, Text } from "@xandrrrr/prompt-kit";
import { register } from "../init/SparkcloudBackend/register"

(async () => {

	let email = await new PromptBuilder()
		.setMessage("Enter your email:")
		.prompt();

	let password = await new PromptBuilder()
		.setMessage("Enter your password:")
		.prompt();

	let passwordConfirmBuilder = new PromptBuilder()
		.setMessage("Confirm your password:")
		.setValidation((input: string) => {
			return input === password;
		});

	if (!passwordConfirmBuilder.validateUserInput(await passwordConfirmBuilder.prompt())) {
		console.log("Passwords do not match.");
		process.exit(1);
	}

	let displayName = await new PromptBuilder()
		.setMessage("Enter your display name:")
		.prompt();

	const uid = await register(email, password, displayName);

	console.log(`Successfully registered with uid ${uid}.`);
})();