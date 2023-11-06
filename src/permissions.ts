export const PERMISSION = {
	project: (projectId: string) => ({
		cloudResources: {
			function: {
				codebase: {
					create: `project:${projectId}:function:codebase:create`,
					cid: (cid: string) => ({
						functions: {
							create: `project:${projectId}:function:codebase:${cid}:functions:create`,
							list: `project:${projectId}:function:codebase:${cid}:functions:list`,
							fname: (fname: string) => ({
								delete: `project:${projectId}:function:codebase:${cid}:functions:${fname}:delete`,
								update: `project:${projectId}:function:codebase:${cid}:functions:${fname}:update`,
							})
						}
					})
				},
				create: `project:${projectId}:function:create`,
				list: `project:${projectId}:function:list`,
				get: `project:${projectId}:function:get`,
				update: `project:${projectId}:function:update`,
				delete: `project:${projectId}:function:delete`,
				invoke: `project:${projectId}:function:invoke`
			}
		},
		delete: `project:${projectId}:delete`,
		information: {
			get: `project:${projectId}:information:get`,
			update: `project:${projectId}:information:update`,
		},
		members: {
			add: `project:${projectId}:members:add`,
			list: `project:${projectId}:members:list`,
			pending: {
				list: `project:${projectId}:members:pending:list`,
				remove: `project:${projectId}:members:pending:remove`
			},
			permissions: {
				list: `project:${projectId}:members:permissions:list`
			},
			remove: `project:${projectId}:members:remove`
		},
		permissions: {
			grant: `project:${projectId}:permissions:grant`,
			revoke: `project:${projectId}:permissions:revoke`
		},
		secrets: {
			create: `project:${projectId}:secrets:create`,
			list: `project:${projectId}:secrets:list`,
			value: {
				get: `project:${projectId}:secrets:value:get`
			},
			secret: (secret: string) => ({
				delete: `project:${projectId}:secrets:${secret}:delete`,
				update: `project:${projectId}:secrets:${secret}:update`,
				value: {
					get: `project:${projectId}:secrets:${secret}:value:get`
				}
			})
		}
	}),
	sparkcloud: {
		sandbox: {
			access: `sparkcloud:sandbox:access`,
		},
		users: {
			permissions: {
				list: `sparkcloud:users:permissions:list`
			}
		}
	}
}