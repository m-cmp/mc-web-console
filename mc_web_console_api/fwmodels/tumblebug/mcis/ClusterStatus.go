package mcis

// 2023-11-14 https://github.com/cloud-barista/cb-spider/blob/fa4bd91fdaa6bb853ea96eca4a7b4f58a2abebf2/cloud-control-manager/cloud-driver/interfaces/resources/ClusterHandler.go#L15

type ClusterStatus string

const (
	ClusterCreating ClusterStatus = "Creating"
	ClusterActive   ClusterStatus = "Active"
	ClusterInactive ClusterStatus = "Inactive"
	ClusterUpdating ClusterStatus = "Updating"
	ClusterDeleting ClusterStatus = "Deleting"
)
