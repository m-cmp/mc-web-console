
document.addEventListener("DOMContentLoaded", function () {
    updatemenu();
    setActiveMenu();
    
    document.querySelectorAll('div[name^="sidebar_"]').forEach(function(item) {
        item.addEventListener('click', function() {
            const hrefStr = this.getAttribute('href')
            if( "#navbar-extra" !== hrefStr) {
                window.location = hrefStr
            }
        });
    });
});

function updatemenu(){
    var  menuData = webconsolejs["common/storage/localstorage"].getMenuLocalStorage()
    const menuHTML = generateMenuHTML(menuData);
    document.getElementById("sidebar-menu-inner").innerHTML = menuHTML;
}

function generateMenuHTML(menus) {
    // let html = ''; //<- 메뉴 완료될때까지 유지 
    let html = document.getElementById("sidebar-menu-inner").innerHTML ;
    menus.forEach(title => {
        html += ` <li class="nav-item">`
        html += ` <div class="hr-text fs-3">${title.displayName}</div>`
        html += ` </li>`
        title.menus.forEach(category => {
            html += ` <li class="nav-item">`
            html += ` <span class="nav-link">${category.displayName}</span>`
            html += ` </li>`
            if (category.menus && category.menus.length > 0) {
                category.menus.forEach(menu => {
                    html += `<li class="nav-item box-link dropdown" name="sidebar_${menu.id}">`;
                    html += `<div class="nav-link dropdown-toggle" name="sidebar_${menu.id}" href="${stringToBool(menu.isAction) ? `/webconsole/${title.id}/${category.id}/${menu.id}` : "#navbar-extra"}" data-bs-toggle="dropdown" data-bs-auto-close="false" role="button" aria-expanded="false">`;
                    html += `<span class="nav-link-icon d-md-none d-lg-inline-block">${iconsArr[menu.id] ? iconsArr[menu.id] : iconsArr["undefined"] }</span>`; // svg
                    html += `<span class="nav-link-title">${menu.displayName}</span>`;
                    html += `</div>`;
                    if (menu.menus && menu.menus.length > 0) {
                        html += `<div class="dropdown-menu" name="sidebar_${menu.id}"><div class="dropdown-menu-columns">`;
                        menu.menus.forEach(subMenu => {
                            html += `<div class="dropdown-menu-column">`;
                            html += `<a class="dropdown-item" href="/webconsole/${title.id}/${category.id}/${menu.id}/${subMenu.id}" id="sidebar_${subMenu.id}_${subMenu.id}">`;
                            html += `${subMenu.displayName}</a>`;
                            html += `</div>`;
                        });
                        html += `</div></div>`;
                    }
                    html += `</li>`;
                });
            }
        });
    });

    console.log("@@@@ menus", stringToBool(menus[0].isAction))

    return html;
}


function stringToBool(str) {
    return str.toLowerCase() === 'true';
}

function setActiveMenu(){
    try {
        const path = window.location.pathname.split('/');
        console.log("path ", path)
        const depth2 = 'sidebar_' + path[3]
        const depth3 = 'sidebar_' + path[3] + '_' + path[4]
        console.log("depth2 ", depth2)
        document.getElementsByName(depth2).forEach(i => i.classList.add('show', 'active'));
        document.getElementById(depth3).classList.add('active');
        } catch (error) {
            console.log('An error occurred navbar.js:', error.message);
        }
}



const iconsArr = {
    "workloads" : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round"
    class="icon icon-tabler icons-tabler-outline icon-tabler-layout-dashboard">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
    <path d="M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
    <path
        d="M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
    <path d="M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
</svg>`,
    "undefined" : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round"
    class="icon icon-tabler icons-tabler-outline icon-tabler-layout-dashboard">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
    <path d="M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
    <path
        d="M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
    <path d="M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
</svg>`,
}
