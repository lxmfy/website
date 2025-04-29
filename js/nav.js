const initBurgerMenu = () => {
    const burgerMenu = document.querySelector('.burger-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (!burgerMenu || !navLinks) return;
    
    burgerMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        burgerMenu.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-content')) {
            burgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
};

// Initialize after content is loaded
document.addEventListener('DOMContentLoaded', initBurgerMenu);
// Also initialize when this script runs (in case DOMContentLoaded already fired)
initBurgerMenu(); 