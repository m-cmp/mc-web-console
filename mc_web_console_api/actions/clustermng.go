package actions

import (
	"log"
	"mc_web_console_api/fwmodels/tumblebug/mcis"
	"mc_web_console_api/handler"
	"mc_web_console_api/util"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func ClusterList(c buffalo.Context) error {
	namespaceID := c.Param("nsId")

	optionParam := c.Params().Get("option")
	log.Println("=========clusterlist")
	if optionParam == "id" {
		clusterList, respStatus := handler.ClusterIDList(namespaceID)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":     "success",
			"status":      respStatus.StatusCode,
			"ClusterList": clusterList,
		}))
	} else {
		clusterList, respStatus := handler.ClusterList(namespaceID, optionParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":     "success",
			"status":      respStatus.StatusCode,
			"ClusterList": clusterList,
		}))
	}
}

func ClusterReg(c buffalo.Context) error {
	namespaceID := c.Param("nsId")
	optionParam := c.Params().Get("option")
	clusterReq := &mcis.TbClusterReq{}
	if err := c.Bind(clusterReq); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	go handler.CreateCluster(namespaceID, optionParam, clusterReq)
	// 원래는 호출 결과를 return하나 go routine으로 바꾸면서 요청성공으로 return
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func DelCluster(c buffalo.Context) error {
	namespaceID := c.Param("nsId")
	clusterID := c.Param("clusterId")

	taskKey := namespaceID + "||" + "mcks" + "||" + clusterID
	handler.StoreWebsocketMessage(util.TASK_TYPE_MCKS, taskKey, util.TUMBLEBUG, util.TASK_STATUS_REQUEST, c) // session에 작업내용 저장

	go handler.DelCluster(namespaceID, clusterID)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func RegNodeGroup(c buffalo.Context) error {

	namespaceID := c.Param("nsId")

	clusterName := c.Param("mcksName")

	nodeRegReq := &mcis.TbNodeGroupReq{}
	if err := c.Bind(nodeRegReq); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}

	nodeInfo, respStatus := handler.AddNodeGroup(namespaceID, clusterName, nodeRegReq)
	log.Println("RegNode service returned")
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":       "success",
		"status":        respStatus.StatusCode,
		"NodeGroupInfo": nodeInfo,
	}))
}

// del all cluster
func DelAllCluster(c buffalo.Context) error {
	namespaceID := c.Param("nsId")
	matchParam := c.Params().Get("match")

	go handler.DelAllCluster(namespaceID, matchParam)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// remove a nodegroup
func DelNodeGroup(c buffalo.Context) error {

	namespaceID := c.Param("nsId")
	clusterID := c.Param("clusterId")
	nodeGroupName := c.Param("nodeGroupName")

	resultStatusInfo, respStatus := handler.DelNodeGroup(namespaceID, clusterID, nodeGroupName)
	log.Println("DelNodeGroup service returned")
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":    "success",
		"status":     respStatus.StatusCode,
		"StatusInfo": resultStatusInfo,
	}))
}

// change a nodegroup's autoscale size
func EditNodeGroupAutoscalesize(c buffalo.Context) error {
	nameSpaceID := c.Param("nsId")
	clusterID := c.Param("clusterId")
	nodeGroupName := c.Param("nodeGroupName")

	resultNodegroupAutoscalesize, respStatus := handler.EditNodeGroupAutoscalesize(nameSpaceID, clusterID, nodeGroupName)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":    "success",
		"status":     respStatus.StatusCode,
		"StatusInfo": resultNodegroupAutoscalesize,
	}))

}

// set a nodegrouop's autoscaling on/off

func EditAutoscaling(c buffalo.Context) error {
	nameSpaceID := c.Param("nsId")
	clusterID := c.Param("clusterId")
	nodeGroupName := c.Param("nodeGroupName")

	resultAutoscaling, respStatus := handler.EditAutoscaling(nameSpaceID, clusterID, nodeGroupName)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":    "success",
		"status":     respStatus.StatusCode,
		"StatusInfo": resultAutoscaling,
	}))

}

// upgrage a cluster's version

func EditClusterVersion(c buffalo.Context) error {
	nameSpaceID := c.Param("nsId")
	clusterID := c.Param("clusterId")

	resultClusterVersion, respStatus := handler.UpgradeClusterVersion(nameSpaceID, clusterID)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":    "success",
		"status":     respStatus.StatusCode,
		"StatusInfo": resultClusterVersion,
	}))

}
