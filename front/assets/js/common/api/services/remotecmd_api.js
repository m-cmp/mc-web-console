// Remote Command API Service
// 순수 API 호출 함수들만 포함

// 원격 명령어 실행 API
export async function postRemoteCmd(nsid, resourceId, targetId, cmdarr, targetType) {
    let data;

    if (targetType === 'vm') {
        // 기존 VM 로직
        data = {
            pathParams: {
                nsId: nsid,
                mciId: resourceId
            },
            queryParams: {
                vmId: targetId
            },
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    } else if (targetType === 'subgroup') {
        // SubGroup 로직
        data = {
            pathParams: {
                nsId: nsid,
                mciId: resourceId
            },
            queryParams: {
                subGroupId: targetId
            },
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    } else if (targetType === 'mci') {
        // MCI 로직 - queryParams 불필요 (pathParams에 이미 mciId 포함)
        data = {
            pathParams: {
                nsId: nsid,
                mciId: resourceId
            },
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    } else if (targetType === 'cluster') {
        // K8s Cluster 로직
        const queryParams = {
            k8sClusterNamespace: targetId.namespace,
            k8sClusterPodName: targetId.podName
        };

        // containerName이 있으면 추가
        if (targetId.containerName) {
            queryParams.k8sClusterContainerName = targetId.containerName;
        }

        data = {
            pathParams: {
                nsId: nsid,
                k8sClusterId: resourceId  // resourceId는 clusterId
            },
            queryParams: queryParams,
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    }

    let controller;
    if (targetType === 'cluster') {
        controller = "/api/" + "mc-infra-manager/" + "Postclusterremotecmd";
    } else {
        controller = "/api/" + "mc-infra-manager/" + "Postcmdmci";
    }

    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    const responseData = response.data.responseData;
    return responseData;
}

// 파일 전송 API
export async function postFileToMci(nsId, mciId, file, targetPath, targetType, targetId = null) {
    // 파일을 base64로 인코딩
    const fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    let data = {
        pathParams: {
            nsId: nsId,
            mciId: mciId
        },
        request: {
            path: targetPath,
            file: {
                name: file.name,
                size: file.size,
                type: file.type,
                data: fileBase64
            }
        }
    };

    // targetType에 따른 query parameter 추가
    if (targetType === 'subgroup' && targetId) {
        data.queryParams = { subGroupId: targetId };
    } else if (targetType === 'vm' && targetId) {
        data.queryParams = { vmId: targetId };
    }
    // 'mci' 타입은 query parameter 없음

    const controller = "/api/mc-infra-manager/Postfiletomci";

    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);

    // 에러 응답 처리
    if (response.status && response.status >= 400) {
        throw new Error(`API Error: ${response.status} - ${response.message || 'Unknown error'}`);
    }

    // 정상 응답 처리
    if (response.data && response.data.responseData) {
        return response.data.responseData;
    } else if (response.data) {
        return response.data;
    } else {
        return response;
    }
}