package mciammanager

var (
	alive = "/alive"

	login          = "/api/auth/login"
	loginrefresh   = "/api/auth/login/refresh"
	logout         = "/api/auth/logout"
	getuserinfo    = "/api/auth/userinfo"
	getusevalidate = "/api/auth/validate"

	getprojectlist = "/api/prj"
	createproject  = "/api/prj"
	deleteproject  = "/api/prj/project/{projectId}"
	getproject     = "/api/prj/project/{projectId}"
	updateproject  = "/api/prj/project/{projectId}"

	getrolelist = "/api/role"
	createrole  = "/api/role"
	deleterole  = "/api/role/{roleId}"
	getrole     = "/api/role/{roleId}"

	securitykey = "/api/sts/securitykey"

	getworkspacelist = "/api/ws"
	createworkspace  = "/api/ws"
	deleteworkspace  = "/api/ws/workspace/{workspaceId}"
	getworkspace     = "/api/ws/workspace/{workspaceId}"
	updateworkspace  = "/api/ws/workspace/{workspaceId}"

	getworkspaceprojectmapping                  = "/api/wsprj"
	deleteworkspaceprojectmappingallbyworkspace = "/api/wsprj/workspace/{workspaceId}"
	getworkspaceprojectmappingbyworkspace       = "/api/wsprj/workspace/{workspaceId}"
	createworkspaceprojectmapping               = "/api/wsprj/workspace/{workspaceId}"
	updateworkspaceprojectmapping               = "/api/wsprj/workspace/{workspaceId}"
	deleteworkspaceprojectmapping               = "/api/wsprj/workspace/{workspaceId}/project/{projectId}"

	getworkspaceuserrolemapping                = "/api/wsuserrole"
	getworkspaceuserrolemappingbyworkspaceuser = "/api/wsuserrole/user/{userId}"
	deleteworkspaceuserrolemappingall          = "/api/wsuserrole/workspace/{workspaceId}"
	getworkspaceuserrolemappingbyworkspace     = "/api/wsuserrole/workspace/{workspaceId}"
	createworkspaceuserrolemapping             = "/api/wsuserrole/workspace/{workspaceId}"
	deleteworkspaceuserrolemapping             = "/api/wsuserrole/workspace/{workspaceId}/user/{userId}"
	// getworkspaceuserrolemappingbyuser          = "/api/wsuserrole/workspace/{workspaceId}/user/{userId}"
	getworkspaceuserrolemappingbyuser          = "/api/wsuserrole/workspace/{workspace}/user/{user}"
	updateworkspaceuserrolemappingbyuser       = "/api/wsuserrole/workspace/{workspaceId}/user/{userId}"
)
