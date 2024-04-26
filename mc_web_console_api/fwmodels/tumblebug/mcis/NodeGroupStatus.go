package mcis

type NodeGroupStatus string

const (
	NodeGroupCreating NodeGroupStatus = "Creating"
	NodeGroupActive   NodeGroupStatus = "Active"
	NodeGroupInactive NodeGroupStatus = "Inactive"
	NodeGroupUpdating NodeGroupStatus = "Updating"
	NodeGroupDeleting NodeGroupStatus = "Deleting"
)
