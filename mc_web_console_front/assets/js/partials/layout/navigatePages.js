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
    if (elem.classList.contains("active")){
        console.log("here")
        elem.classList.remove('active')
    }else{
        console.log("zzz")
        elem.classList.add('active')
    }
}



window.addEventListener('hashchange', showSection);
window.addEventListener('load', showSection);
window.addEventListener('load', hideLoader);