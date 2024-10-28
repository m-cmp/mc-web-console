
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
        const menuListresponse = await webconsolejs["common/api/http"].commonAPIPost('/api/getmenutree')
        try{
            let tempMenulist = menuListresponse.data.responseData
            sortMenu(tempMenulist);
            webconsolejs["common/storage/localstorage"].setMenuLocalStorage(tempMenulist)
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

// function sortMenus(menu) {
//     if (menu.menus && Array.isArray(menu.menus)) {
//         menu.menus.sort((a, b) => parseInt(a.menunumber) - parseInt(b.menunumber));
//         menu.menus.forEach(subMenu => sortMenus(subMenu));
//     }
//     return menu;
// }

// function sortMenu(menus) {
//     menus.sort((a, b) => {
//         if (a.priority === b.priority) {
//             return a.menunumber - b.menunumber;
//         }
//         return a.priority - b.priority;
//     });

//     menus.forEach(menu => {
//         if (menu.menus && menu.menus.length > 0) {
//             sortMenu(menu.menus);
//         }
//     });
// }


// function sortMenu(menus) {
//     // 우선순위가 2와 다르면 우선순위로 정렬, 우선순위가 같다면 메뉴 넘버로 정렬
//     menus.sort((a, b) => {
//         if (a.priority !== b.priority) {
//             return a.priority - b.priority;
//         } else {
//             return a.menunumber - b.menunumber;
//         }
//     });

//     // 하위 메뉴가 존재하는 경우 재귀적으로 정렬
//     menus.forEach(menu => {
//         if (menu.menus && menu.menus.length > 0) {
//             sortMenu(menu.menus);
//         }
//     });
// }


function sortMenu(menus) {
    // 재귀적으로 메뉴들을 정렬하는 함수
    const sortRecursive = (menuArray) => {
        // 메뉴 배열이 유효한지 확인 후, 정렬
        if (!menuArray || menuArray.length === 0) return;

        // 메뉴 배열 정렬: 우선순위 오름차순 -> 메뉴 넘버 오름차순
        menuArray.sort((a, b) => {
            // 우선순위 비교
            const priorityA = parseInt(a.priority, 10);
            const priorityB = parseInt(b.priority, 10);
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
                // console.log("우선순위 다름!", priorityA, priorityB)
                // return priorityB - priorityA;
            }
            // 우선순위가 같다면 메뉴 넘버 비교
            const menuNumberA = parseInt(a.menunumber, 10);
            const menuNumberB = parseInt(b.menunumber, 10);
            return menuNumberA - menuNumberB;
            // console.log("우선순위 같음! 메뉴 넘버 비교 ", menuNumberA, menuNumberB)

            // return menuNumberB - menuNumberA;
        });

        // 각 메뉴의 하위 메뉴들도 재귀적으로 정렬
        menuArray.forEach(menu => {
            if (menu.menus) {
                sortRecursive(menu.menus);
            }
        });
    };

    // 최상위 메뉴 정렬 실행
    sortRecursive(menus);
}