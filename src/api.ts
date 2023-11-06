export const authUri = (path: string) => {
	return `https://iam.sparkcloud.link${path}`;
}

export const crmUri = (path: string) => {
	return `https://cloud-resource-manager.sparkcloud.link${path}`;
}

export const secretsVaultUri = (path: string) => {
	return `https://secrets-vault.sparkcloud.link${path}`;
}