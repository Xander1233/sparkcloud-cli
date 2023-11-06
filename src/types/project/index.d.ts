export interface Project {
	pid: string;
	publicName: string;
	name: string;
	environmentType: "development" | "production";
	defaultResourceLocation?: string;
}

export interface Secret {
	key: string;
	lastVersion: number;
	isRotating: boolean;
	expiresIn: number;
}