document.addEventListener('DOMContentLoaded', () => {
    //Menu
    var menuButton = document.querySelector('.menu-button');
    var navLinks = document.querySelector('.nav-links');
    var modelMM1 = document.getElementsByClassName('model-MM1') [0];

    menuButton.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
    //Cierra el menú al hacer clic fuera de él
    document.addEventListener('click', (event) => {
        var isClickInsideNav = event.target.closest('.nav-left');
        if (!isClickInsideNav && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });
    //Cerrar el menú al redimensionar la ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });

    //Redirigir a la página de MM1 al hacer clic en el modelo
    modelMM1.addEventListener('click', () => {
        window.location.href = 'models/MM1.html';
    });
});