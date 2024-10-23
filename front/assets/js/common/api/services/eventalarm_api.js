export async function getAllPolicy() {

    var controller = "/api/" + "mc-observability/" + "Gettriggerpolicyalllist";

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
    var controller = "/api/" + "mc-observability/" + "Gettriggerhistoryalllist";

    const response = webconsolejs["common/api/http"].commonAPIPost(
        controller,
        data
    );

    return response

}

export async function getPolicyOfSeq(policySeq) {
    var data = {
        queryParams: {
            // policySeq: policySeq,
            policySeq: "11",
        },
    };
    var controller = "/api/" + "mc-observability/" + "Gettriggertargetalllist";

    const response = webconsolejs["common/api/http"].commonAPIPost(
        controller,
        data
    );

    return response

}
