export async function getAllPolicy() {

    var controller = "/api/" + "mc-observability/" + "ListUsingGET4";

    const response = webconsolejs["common/api/http"].commonAPIPost(
        controller,
    );

    return response
}
