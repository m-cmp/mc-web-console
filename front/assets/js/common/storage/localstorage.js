export function getMenuLocalStorage() {
    return JSON.parse(localStorage.getItem("menuList"))
}

export function setMenuLocalStorage(workspace) {
    localStorage.setItem('menuList', JSON.stringify(workspace))
}
