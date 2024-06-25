function showSection() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    const hash = window.location.hash || '#index';
    const activeSection = document.querySelector(hash);
    if (activeSection) {
        activeSection.classList.add('active');
    }
}

function hideLoader() {
    document.getElementById("loader").classList.remove('active')
}

export function toggleElement(elem){
    // 자기 자신에 대한 Toggle
    if (elem.classList.contains("active")){
        console.log("here")
        elem.classList.remove('active')
        window.location.hash = ""
    }else{
        console.log("zzz")
        elem.classList.add('active')
        console.log(elem)
    }
}

export function toggleSubElement(elem){
    // 자기 자신에 대한 Toggle
    if (elem.classList.contains("active")){
        console.log("subhere")
        elem.classList.remove('active')
        // window.location.hash = ""
    }else{
        console.log("subzzz")
        elem.classList.add('active')
        console.log(elem)
    }
}


window.addEventListener('hashchange', showSection);
window.addEventListener('load', showSection);
window.addEventListener('load', hideLoader);