// 역할 목록 조회
export async function getRoleList() {
    const controller = "/api/mc-iam-manager/GetRoleList";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    console.log("getRoles response", response);
    return response.data.responseData;
}