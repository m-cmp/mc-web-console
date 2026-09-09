import { refreshAvailableMenus } from "../../common/api/services/menus_api";

document.addEventListener("DOMContentLoaded", function () {
    updatemenu();
    bindSidebarClicks();
    setActiveMenu();

    document.addEventListener("refresh-sidebar", function () {
        updatemenu();
        bindSidebarClicks();
        setActiveMenu();
    });

    // localStorage 메뉴는 로그인 시점 캐시라 DB 메뉴 변경(displayName 등)이 재로그인 전까지
    // 반영되지 않는다 — 페이지 로드마다 백그라운드로 재동기화 (실패 시 기존 캐시 유지)
    refreshAvailableMenus().catch(function () { /* keep cached menu */ });
});

function bindSidebarClicks() {
    document.querySelectorAll('a[name^="sidebar_"], div[name^="sidebar_"]').forEach(function (item) {
        item.addEventListener('click', async function (e) {
            const viewType = this.getAttribute('data-viewtype');
            if (viewType === 'popup') {
                e.preventDefault();
                e.stopPropagation();
                await openPopupMenu(this);
                return;
            }
            const hrefStr = this.getAttribute('href');
            if (hrefStr && hrefStr !== '#navbar-extra' && hrefStr !== '#' && !hrefStr.startsWith('#popup')) {
                window.location = hrefStr;
                return;
            }
            if (this.classList.contains('dropdown-toggle')) {
                e.stopPropagation();
                const menu = this.nextElementSibling;
                if (menu && menu.classList.contains('dropdown-menu')) {
                    menu.classList.toggle('show');
                    this.classList.toggle('show');
                    this.setAttribute('aria-expanded', this.classList.contains('show'));
                }
            }
        });
    });
}

async function openPopupMenu(el) {
    const framework = el.getAttribute('data-framework') || '';
    const path = el.getAttribute('data-path') || '/';
    if (!framework) {
        alert('Menu resource: frameworkService is required for popup viewType');
        return;
    }
    const host = await webconsolejs['common/iframe/iframe'].GetApiHosts(framework);
    if (!host) {
        alert(framework + ' service URL not found.');
        return;
    }
    const loader = webconsolejs['pages/operation/plugins/genericMenuLoader'];
    const url = loader && loader.joinFrameworkUrl
        ? loader.joinFrameworkUrl(host, path)
        : host.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
    window.open(url, '_blank');
}

function updatemenu() {
    var menuData = webconsolejs['common/storage/localstorage'].getMenuLocalStorage();
    const menuHTML = generateMenuHTML(menuData);
    document.getElementById('sidebar-menu-inner').innerHTML = menuHTML;
}

/** WEB-FIX-002: viewType 기반 href / data attrs */
function resolveMenuHref(title, category, menu, parentMenu) {
    const viewType = (menu.viewType || 'local').toLowerCase();
    const convention = parentMenu
        ? `/webconsole/${title.id}/${category.id}/${parentMenu.id}/${menu.id}`
        : `/webconsole/${title.id}/${category.id}/${menu.id}`;

    if (viewType === 'iframe') {
        return { href: `/webconsole/_view/${menu.id}`, viewType, framework: menu.frameworkService || '', path: menu.path || '/' };
    }
    if (viewType === 'popup') {
        return { href: '#', viewType, framework: menu.frameworkService || '', path: menu.path || '/' };
    }
    // local
    if (menu.path) {
        const p = menu.path.startsWith('/') ? menu.path : '/' + menu.path;
        return { href: '/webconsole' + p, viewType: 'local', framework: '', path: menu.path };
    }
    return { href: convention, viewType: 'local', framework: '', path: '' };
}

function actionAttrs(resolved, nameAttr, idAttr) {
    if (!resolved) return '';
    const idPart = idAttr ? ` id="${idAttr}"` : '';
    const data =
        ` data-viewtype="${resolved.viewType}"` +
        (resolved.framework ? ` data-framework="${resolved.framework}"` : '') +
        (resolved.path != null ? ` data-path="${resolved.path}"` : '');
    return `href="${resolved.href}" name="${nameAttr}"${idPart}${data}`;
}

function generateMenuHTML(menus) {
    let html = '';
    if (!menus || !menus.length) return html;
    menus.forEach((title) => {
        html += ` <li class="nav-item">`;
        html += ` <div class="hr-text fs-3">${title.displayName}</div>`;
        html += ` </li>`;
        (title.menus || []).forEach((category) => {
            html += ` <li class="nav-item">`;
            html += ` <span class="nav-link hr-text-color" id="sidebar_${category.id}">${category.displayName}</span>`;
            html += ` </li>`;
            if (category.menus && category.menus.length > 0) {
                category.menus.forEach((menu) => {
                    if (!menu.menus || menu.menus.length === 0) {
                        const resolved = stringToBool(menu.isAction)
                            ? resolveMenuHref(title, category, menu, null)
                            : null;
                        html += `<li class="nav-item">`;
                        html += `<a class="nav-link" ${resolved ? actionAttrs(resolved, 'sidebar_' + menu.id) : `name="sidebar_${menu.id}"`}>`;
                        html += `<span class="nav-link-icon d-md-none d-lg-inline-block">${resolveMenuIcon(menu)}</span>`;
                        html += `<span class="nav-link-title">${menu.displayName}</span>`;
                        html += `</a>`;
                        html += `</li>`;
                    } else {
                        html += `<li class="nav-item box-link dropdown" name="sidebar_${menu.id}">`;
                        const parentHref = stringToBool(menu.isAction)
                            ? resolveMenuHref(title, category, menu, null).href
                            : '#navbar-extra';
                        html += `<div class="nav-link dropdown-toggle" name="sidebar_${menu.id}" href="${parentHref}" role="button" aria-expanded="false">`;
                        html += `<span class="nav-link-icon d-md-none d-lg-inline-block">${resolveMenuIcon(menu)}</span>`;
                        html += `<span class="nav-link-title">${menu.displayName}</span>`;
                        html += `</div>`;
                    }
                    if (menu.menus && menu.menus.length > 0) {
                        html += `<div class="dropdown-menu" name="sidebar_${menu.id}"><div class="dropdown-menu-columns">`;
                        menu.menus.forEach((subMenu) => {
                            const resolved = resolveMenuHref(title, category, subMenu, menu);
                            const disabled = stringToBool(subMenu.isAction) ? '' : ' disabled';
                            html += `<div class="dropdown-menu-column">`;
                            html += `<a class="dropdown-item${disabled}" ${actionAttrs(resolved, 'sidebar_' + menu.id, 'sidebar_' + menu.id + '_' + subMenu.id)}>`;
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
    return html;
}

function setActiveMenu() {
    const path = window.location.pathname.split('/');
    // /webconsole/_view/{menuId}
    if (path[2] === '_view' && path[3]) {
        const name = `sidebar_${path[3]}`;
        document.querySelectorAll(`[name="${name}"]`).forEach((i) => {
            i.classList.add('show', 'active');
        });
        return;
    }
    const depth3 = path[3] ? `sidebar_${path[3]}` : null;
    const depth4 = path[4] ? `sidebar_${path[4]}` : null;
    const depth5 = path[5] ? `sidebar_${path[4]}_${path[5]}` : null;
    if (depth4) {
        document.querySelectorAll(`[name="${depth4}"]`).forEach((i) => {
            if (!i.classList.contains('show')) i.classList.add('show');
            if (!i.classList.contains('active')) i.classList.add('active');
        });
    }
    if (depth5) {
        const element = document.getElementById(depth5);
        if (element && !element.classList.contains('active')) {
            element.classList.add('active');
        }
    }
    if (depth4 && depth5) {
        var pretitle = document.getElementById('page-pretitle');
        var title = document.getElementById('page-title');
        if (pretitle && title) {
            const navLinkTitle = document.querySelector(`[name="${depth4}"].dropdown-toggle`);
            if (navLinkTitle) {
                const innerText = navLinkTitle.querySelector('.nav-link-title').innerText;
                pretitle.innerHTML = innerText;
            }
            const depth5Element = document.getElementById(depth5);
            if (depth5Element) {
                title.innerHTML = depth5Element.innerHTML;
            }
        }
    } else if (depth3 && depth4) {
        var pretitle2 = document.getElementById('page-pretitle');
        var title2 = document.getElementById('page-title');
        if (pretitle2 && title2) {
            const d3 = document.getElementById(depth3);
            if (d3) pretitle2.innerHTML = d3.innerHTML;
            const navLinkTitle = document.querySelector(`[name="${depth4}"].dropdown-toggle`);
            if (navLinkTitle) {
                title2.innerHTML = navLinkTitle.querySelector('.nav-link-title').innerText;
            } else {
                const navLinkTitle2 = document.querySelector(`[name="${depth4}"].nav-link`);
                if (navLinkTitle2) {
                    title2.innerHTML = navLinkTitle2.querySelector('.nav-link-title').innerText;
                }
            }
        }
    }
}

function stringToBool(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
}

const iconsArr = {
    workloads: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round"
        class="icon icon-tabler icons-tabler-outline icon-tabler-layout-dashboard">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
        <path d="M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
        <path d="M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
        <path d="M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
        </svg>`,
    undefined: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round"
        class="icon icon-tabler icons-tabler-outline icon-tabler-layout-dashboard">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
        <path d="M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
        <path d="M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
        <path d="M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
        </svg>`,
    approvals: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="icon icon-tabler icons-tabler-outline icon-tabler-user-check">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"/>
        <path d="M6 21v-2a4 4 0 0 1 4 -4h4"/>
        <path d="M15 19l2 2l4 -4"/>
        </svg>`,
};

// 메뉴 아이콘 조회 — 데이터 필드(menu.icon) 우선, 없으면 기존 id 기반 조회로 하위호환, 그마저 없으면 기본 아이콘
function resolveMenuIcon(menu) {
    return iconsArr[menu.icon] || iconsArr[menu.id] || iconsArr['undefined'];
}
