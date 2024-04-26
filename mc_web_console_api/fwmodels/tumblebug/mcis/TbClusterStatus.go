package mcis

// 2023-11-14 https://github.com/cloud-barista/cb-spider/blob/fa4bd91fdaa6bb853ea96eca4a7b4f58a2abebf2/cloud-control-manager/cloud-driver/interfaces/resources/ClusterHandler.go#L15

type TbClusterStatus string

const (
	ClusterCreating TbClusterStatus = "Creating"
	ClusterActive   TbClusterStatus = "Active"
	ClusterInactive TbClusterStatus = "Inactive"
	ClusterUpdating TbClusterStatus = "Updating"
	ClusterDeleting TbClusterStatus = "Deleting"
)
