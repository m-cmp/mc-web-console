// DISK API 관련

// 해당 provider, connection 으로 사용가능한 Disk의 Type 정보(type, min, max ) 조회
// ex) AWS -> standard|1|1024, gp2|1|16384
export async function getCommonLookupDiskInfo(provider, connectionName) {
	const data = {
		queryParams: {
			"provider": provider,
			"connectionName": connectionName
		}
	}

	var controller = "/api/" + "disklookup";
	const response = await webconsolejs["common/api/http"].commonAPIPost(
		controller,
		data
	);
	console.log("lookup disk info response : ", response)
	var responseData = response.data.responseData
    
    return responseData
}