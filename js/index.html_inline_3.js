
                document.addEventListener('DOMContentLoaded', () => {
                    let currentHeroSlide = 0;
                    const slider = document.getElementById('hero-slider');
                    const totalSlides = 3;
                    let slideInterval;

                    function updateDots() {
                        for (let i = 0; i < totalSlides; i++) {
                            const dot = document.getElementById(`slide-dot-${i}`);
                            if (dot) dot.style.opacity = i === currentHeroSlide ? '1' : '0.4';
                        }
                    }

                    function goToSlide(index) {
                        if (!slider) return;

                        // Handle smooth rewind by fading out slightly during jump
                        if (currentHeroSlide === totalSlides - 1 && index === 0) {
                            slider.style.transition = 'none';
                            slider.style.opacity = '0.5';
                            setTimeout(() => {
                                currentHeroSlide = index;
                                slider.style.transform = `translateX(0%)`;
                                setTimeout(() => {
                                    slider.style.transition = 'transform 700ms ease-in-out, opacity 300ms ease-in-out';
                                    slider.style.opacity = '1';
                                    updateDots();
                                }, 50);
                            }, 300);
                            return;
                        } else if (currentHeroSlide === 0 && index === totalSlides - 1) {
                            slider.style.transition = 'none';
                            slider.style.opacity = '0.5';
                            setTimeout(() => {
                                currentHeroSlide = index;
                                slider.style.transform = `translateX(-${index * 33.333333}%)`;
                                setTimeout(() => {
                                    slider.style.transition = 'transform 700ms ease-in-out, opacity 300ms ease-in-out';
                                    slider.style.opacity = '1';
                                    updateDots();
                                }, 50);
                            }, 300);
                            return;
                        }

                        slider.style.transition = 'transform 700ms ease-in-out, opacity 300ms ease-in-out';
                        slider.style.opacity = '1';
                        currentHeroSlide = index;
                        slider.style.transform = `translateX(-${currentHeroSlide * 33.333333}%)`;
                        updateDots();
                    }

                    function nextSlide() {
                        goToSlide((currentHeroSlide + 1) % totalSlides);
                        resetInterval();
                    }

                    function prevSlide() {
                        goToSlide((currentHeroSlide - 1 + totalSlides) % totalSlides);
                        resetInterval();
                    }

                    function resetInterval() {
                        clearInterval(slideInterval);
                        slideInterval = setInterval(nextSlide, 4000);
                    }

                    resetInterval();

                    // Touch / Swipe support
                    let startX = 0;
                    let isDragging = false;

                    if (slider) {
                        slider.addEventListener('touchstart', (e) => {
                            startX = e.touches[0].clientX;
                            isDragging = true;
                            clearInterval(slideInterval);
                        }, { passive: true });

                        slider.addEventListener('touchend', (e) => {
                            if (!isDragging) return;
                            isDragging = false;
                            let endX = e.changedTouches[0].clientX;
                            let diff = startX - endX;

                            if (diff > 50) nextSlide();
                            else if (diff < -50) prevSlide();
                            else resetInterval();
                        }, { passive: true });
                    }

                    // Expose to window for buttons
                    window.heroNextSlide = nextSlide;
                    window.heroPrevSlide = prevSlide;
                });
            