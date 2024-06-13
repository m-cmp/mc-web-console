document.addEventListener("DOMContentLoaded", function () {
    const path = window.location.pathname.split('/')
    const depth2 = 'sidebar_'+ path[3]
    const depth3 = 'sidebar_'+path[3]+'_'+path[4]

    if( document.getElementById(depth2) != undefined){
        document.getElementsByName(depth2).forEach(i => i.classList.add('show', 'active'));
    }
    if( document.getElementById(depth3) != undefined){
        console.log("dep3 ", document.getElementById(depth3))
        document.getElementById(depth3).classList.add('active');
    }
    
});