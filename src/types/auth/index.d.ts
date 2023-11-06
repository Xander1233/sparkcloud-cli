export interface Tokens {
	id_token?: string;
	access_token: string;
	refresh_token?: string;
	scopes?: string[];
}

export interface User {
	uid: string;
	email: string;
	displayName: string;
}

export interface Account {
	user: User;
	tokens: Tokens;
}

export interface TokensWithExpiration extends Tokens {
	expires_at?: number;
}

export interface TokensWithTTL extends Tokens {
	expires_in?: number;
}

export interface UserCredentials {
	user: string | User;
	tokens: TokensWithExpiration;
	scopes: string[];
}

