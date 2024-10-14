export async function getMciList(nsId) {

    if (nsId == "") {
      console.log("Project has not set")
      return;
    }
  
    var data = {
      pathParams: {
        nsId: nsId,
      },
    };
  
    var controller = "/api/" + "mc-infra-manager/" + "GetAllMci";
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    )
  
    console.log("aaa", response)
  
    var mciList = response.data.responseData;
  
    return mciList
  }