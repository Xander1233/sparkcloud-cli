import { logout } from "../all/auth/checkLogin"
import { configstore } from "../util/configstore"

(async () => {
	let data = configstore.get("user");
	await logout(data.token);
	configstore.delete("user");
})()