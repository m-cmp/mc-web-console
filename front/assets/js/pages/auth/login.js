document.getElementById("loginbtn").addEventListener('click',async function () {
    const data ={
        "request":{
            "id":document.getElementById("id").value,
            "password":document.getElementById("password").value
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry('/api/auth/login', data)
    if (response.status !== 200){
        alert("LoginFail\n"+response)
        document.getElementById("id").value = null
        document.getElementById("password").value = null
    }else{
        await webconsolejs["common/cookie/authcookie"].updateCookieAccessToken(response.data.access_token);
        const controller = "/api/mc-iam-manager/GetAllAvailableMenus";
        const getAllAvailableMenusResponse = await webconsolejs["common/api/http"].commonAPIPost(controller);
        console.log("getAllAvailableMenus response", getAllAvailableMenusResponse);
        const menuListresponse = getAllAvailableMenusResponse.data.responseData;
        
        try{
            let tempMenulist = menuListresponse
            const menuTree = convertToMenuTree(tempMenulist);
            webconsolejs["common/storage/localstorage"].setMenuLocalStorage(menuTree)
            window.location = "/"
        } catch(error){
            console.log(error)
            alert("dynamic menu error : " + error)
            window.location = "/"
        }
    }
});

document.getElementById('id').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('loginbtn').click();
    }
});

document.getElementById('password').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('loginbtn').click();
    }
});






// 평면 배열을 트리 구조로 변환하는 함수
function convertToMenuTree(menuList) {
    // 1. 메뉴 맵 생성 (빠른 검색용)
    const menuMap = new Map();
    menuList.forEach(menu => {
        menuMap.set(menu.id, {
            ...menu,
            menus: []
        });
    });
    
    // 2. 트리 구조 구성
    const rootMenus = [];
    menuList.forEach(menu => {
        const menuNode = menuMap.get(menu.id);
        
        if (menu.parentId === 'home' || !menu.parentId) {
            // 최상위 메뉴
            rootMenus.push(menuNode);
        } else {
            // 하위 메뉴
            const parentMenu = menuMap.get(menu.parentId);
            if (parentMenu) {
                parentMenu.menus.push(menuNode);
            }
        }
    });
    
    // 3. 정렬 (우선순위 -> 메뉴번호)
    const sortMenus = (menus) => {
        menus.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.menuNumber - b.menuNumber;
        });
        
        menus.forEach(menu => {
            if (menu.menus && menu.menus.length > 0) {
                sortMenus(menu.menus);
            }
        });
    };
    
    sortMenus(rootMenus);
    return rootMenus;
}