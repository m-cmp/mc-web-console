// Remote Command API Service
// 순수 API 호출 함수들만 포함

// mc-infra-manager(cb-tumblebug) rejects transfers larger than 10MB.
// Enforced here before base64 encoding so an oversized file fails immediately
// instead of after the whole encode/upload round trip. front/actions/upload.go
// applies the same limit on the server side.
export const MAX_TRANSFER_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_TRANSFER_FILE_SIZE_LABEL = '10MB';

// 원격 명령어 실행 API
export async function postRemoteCmd(nsid, resourceId, targetId, cmdarr, targetType) {
    let data;

    if (targetType === 'vm') {
        // 기존 VM 로직
        data = {
            pathParams: {
                nsId: nsid,
                infraId: resourceId
            },
            queryParams: {
                nodeId: targetId
            },
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    } else if (targetType === 'nodegroup') {
        // NodeGroup 로직
        data = {
            pathParams: {
                nsId: nsid,
                infraId: resourceId
            },
            queryParams: {
                nodeGroupId: targetId
            },
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    } else if (targetType === 'mci') {
        // MCI 로직 - queryParams 불필요 (pathParams에 이미 infraId 포함)
        data = {
            pathParams: {
                nsId: nsid,
                infraId: resourceId
            },
            Request: {
                command: cmdarr,
                userName: "cb-user"
            }
        };
    }

    const controller = "/api/" + "mc-infra-manager/" + "PostCmdInfra";

    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    const responseData = response.data.responseData;
    return responseData;
}

// 파일 전송 API
export async function postFileToMci(nsId, mciId, file, targetPath, targetType, targetId = null) {
    // 인코딩 전 크기 검증 — 초과 파일은 여기서 즉시 실패시킨다
    if (file.size > MAX_TRANSFER_FILE_SIZE) {
        throw new Error(`"${file.name}" is ${formatFileSize(file.size)}, which exceeds the ${MAX_TRANSFER_FILE_SIZE_LABEL} transfer limit.`);
    }

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
            infraId: mciId
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
    if (targetType === 'nodegroup' && targetId) {
        data.queryParams = { nodeGroupId: targetId };
    } else if (targetType === 'vm' && targetId) {
        data.queryParams = { nodeId: targetId };
    }
    // 'mci' 타입은 query parameter 없음

    const controller = "/api/mc-infra-manager/PostFileToInfra";

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

// 파일 크기를 사람이 읽는 단위로 변환 (검증 메시지용)
export function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return 'unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
