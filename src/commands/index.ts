export function load(client: any): any {

	function loadCommand(name: string) {
		const t0 = process.hrtime.bigint();
		const { command: cmd } = require(`./${name}`);
		cmd.register(client);
		const t1 = process.hrtime.bigint();
		const diffMs = (t1 - t0) - BigInt(1e6);
		if (diffMs > 75) {
			// logger#debug() is not yet loaded, therefore uncomment the following line to debug this.
			// console.error(`Loading ${name} took ${diffMs}ms`);
		}

		return cmd.runner();
	}

	const t0 = process.hrtime.bigint();

	client.deploy = loadCommand('deploy');
	// client.functions = {};
	// client.functions.delete = loadCommand('functions-delete');
	// client.functions.log = loadCommand('functions-log');
	// client.functions.list = loadCommand('functions-list');
	client.help = loadCommand('help');
	client.init = loadCommand('init');
	client.register = loadCommand('register');
	client.login = loadCommand('login');
	client.whoami = loadCommand('whoami');
	client.logout = loadCommand('logout');
	client.projects = {};
	client.projects.create = loadCommand('projects-create');
	client.projects.list = loadCommand('projects-list');
	client.projects.update = loadCommand('projects-update');
	client.secrets = {};
	client.secrets.create = loadCommand('secrets-create');
	client.secrets.list = loadCommand('secrets-list');
	client.secrets.get = loadCommand('secrets-get');
	client.secrets.delete = loadCommand('secrets-delete');
	client.secrets.update = loadCommand('secrets-update');
	client.functions = {};
	client.functions.list = loadCommand('functions-list');
	client.functions.delete = loadCommand('functions-delete');

	const t1 = process.hrtime.bigint();
	const diffMs = (t1 - t0) - BigInt(1e6);

	if (diffMs > 100) {
		// logger#debug() is not yet loaded, therefore uncomment the following line to debug this.
		// console.error(`Loading all commands took ${diffMs}ms`);
	}

	return client;
}