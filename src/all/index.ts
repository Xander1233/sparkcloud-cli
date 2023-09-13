#!/usr/bin/env node

const args = process.argv.slice(2);

const command = args[0];

switch (command) {
	case "deploy":
		require("../deploy");
		break;
	case "init":
		require("../init");
		break;
	case "login":
		require("../login");
		break;
	case "logout":
		require("../logout");
		break;
	case "register":
		require("../register");
		break;
	default:
		console.error(`Unknown command "${command}".`);
		process.exit(1);
}