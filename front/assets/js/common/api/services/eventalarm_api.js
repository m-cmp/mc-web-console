export async function getAllPolicy() {

    var controller = "/api/" + "mc-observability/" + "ListUsingGET4";

    const response = webconsolejs["common/api/http"].commonAPIPost(
        controller,
    );

    return response
}

export async function getPolicyOfSeqHistory(policySeq) {
    var data = {
        queryParams: {
            policySeq: policySeq,
        },
    };
    var controller = "/api/" + "mc-observability/" + "ListUsingGET5";

    const response = webconsolejs["common/api/http"].commonAPIPost(
        controller,
        data
    );

    return response

}

export async function getPolicyOfSeq(policySeq) {
    var data = {
        queryParams: {
            policySeq: policySeq,
        },
    };
    var controller = "/api/" + "mc-observability/" + "GetPolicyOfSeq";

    const response = webconsolejs["common/api/http"].commonAPIPost(
        controller,
        data
    );

    return response

}
