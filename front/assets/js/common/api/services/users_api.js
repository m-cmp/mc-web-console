// 유저 목록 조회
export async function getUserList() {
    const controller = "/api/mc-iam-manager/Listusers";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    console.log("Listusers response", response);
    return response.data.responseData;
}

// export async function getUserById(userId) {
//     const controller = "/api/mc-iam-manager/Getuserbyid";
//     const data = {
//         userId: userId
//     }
//     const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
//     console.log("getUserById response", response);
//     return response.data.responseData;
// }

export async function getUserByName(username) {
    const controller = "/api/mc-iam-manager/Getuserbyname";
    const data = {
        username: username
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    console.log("getUserByName response", response);
    return response.data.responseData;
}