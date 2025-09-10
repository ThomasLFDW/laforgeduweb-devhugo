window.addEventListener('load', function() {
    const counters = document.querySelectorAll('.stat-number');

    const animateCount = (el) => {
        const target = parseInt(el.dataset.target, 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        let current = 0;
        const step = Math.max(1, Math.ceil(target / 50));

        const update = () => {
            current += step;
            if (current >= target) {
                el.textContent = `${prefix}${target}${suffix}`;
            } else {
                el.textContent = `${prefix}${current}${suffix}`;
                requestAnimationFrame(update);
            }
        };

        update();
    };

    counters.forEach(animateCount);

    // Ajout des bullets carousel
    const glideTrack = document.querySelectorAll('.glide');
    glideTrack.forEach(track => {
        const slides = track.querySelectorAll('.glide__slide:not(.glide__slide--clone)');
        const bulletsContainer = track.querySelector('.glide__bullets');
        slides.forEach((slide, index) => {
            const bullet = document.createElement('button');
            bullet.className = 'glide__bullet';
            bullet.setAttribute('data-glide-dir', `=${index}`);
            if (bulletsContainer) {
                bulletsContainer.appendChild(bullet);
            }
        });

        const bullets = document.querySelectorAll('.glide__bullet');
        bullets.forEach((bullet, index) => {
            bullet.setAttribute('aria-label', `Aller à la slide ${index + 1}`);
            bullet.setAttribute('type', 'button');
            bullet.setAttribute('role', 'tab');

            // Texte pour lecteurs d'écran
            if (!bullet.querySelector('.sr-only')) {
                bullet.innerHTML = `<span class="sr-only">Slide ${index + 1}</span>`;
            }
        });
    })

    // Ajout de l'animation d'ouverture de l'accordéon avec transition fluide
    const items = document.querySelectorAll(".faq-item");
    let activeItem = null;
    items.forEach(item => {
        const question = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");
        question.addEventListener("click", () => {
            const isActive = item === activeItem;
            if (activeItem) {
                activeItem.classList.remove("active");
                const openAnswer = activeItem.querySelector(".faq-answer");
                openAnswer.style.maxHeight = null;
            }
            if (!isActive) {
                item.classList.add("active");
                answer.style.maxHeight = answer.scrollHeight + "px";
                activeItem = item;
            } else {
                activeItem = null;
            }
        });
    });

    // Initialisation du carousel Glide.js pour les réalisations
    const carouselRealisation = new Glide('.glide-realisations', {
        type: 'carousel',
        startAt: 0,
        perView: 3,
        focusAt: 'center',
        autoplay: 4000,
        hoverpause: true,
        gap: 24,
        breakpoints: {
            768: {
                perView: 1
            }
        }
    });

    // Préchargement des images suivantes lors du changement de slide
    carouselRealisation.on('run', function () {
        const currentIndex = carouselRealisation.index;
        const slides = document.querySelectorAll('.glide__slide img[loading="lazy"]');

        // Précharge les 2 prochaines images
        for (let i = 0; i < 2; i++) {
            const nextIndex = (currentIndex + i + 1) % slides.length;
            if (slides[nextIndex] && slides[nextIndex].loading === 'lazy') {
                slides[nextIndex].loading = 'eager';
            }
        }
    });

    setTimeout(function () {
        if (document.querySelector('.glide-realisations')) {
            carouselRealisation.mount();
        }
    }, 100); // Petit délai pour éviter les reflows


    var elem = document.querySelector('.testimonials-grid');
    new Masonry(elem, {
        // options
        itemSelector: '.testimonial-card',
        gutter: 50,
        fitWidth: true

    });

    const popup = document.getElementById('contact-popup');
    document.getElementById('open-popup').addEventListener('click', e => {
        e.preventDefault();
        popup.classList.add('active');
    });
    document.querySelector('.popup-close').addEventListener('click', () => {
        popup.classList.remove('active');
    });

    const form = document.getElementById('contact-form');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(form);
        try {
            const response = await fetch('/send.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                const html = await fetch('/merci.html').then(r => r.text());
                document.querySelector('.popup-content').innerHTML = html;
            } else {
                alert("Erreur : " + result.error);
            }
        } catch (error) {
            alert("Erreur de connexion.");
        }
    });
});
