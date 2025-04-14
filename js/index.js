document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.querySelector('.menu-button');
    const navLinks = document.querySelector('.nav-links');

    menuButton.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    //Se cierra el menú al hacer clic fuera de él
    document.addEventListener('click', (event) => {
        const isClickInsideNav = event.target.closest('.nav-left');
        if (!isClickInsideNav && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });

    //Se cierra el menú al cambiar de tamaño la ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });
});