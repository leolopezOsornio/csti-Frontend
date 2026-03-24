import { useEffect, useState } from 'react';
import styles from '../Hero/Hero.module.css';

/**
 * COMPONENTE: Hero
 * UBICACIÓN: src/components/Hero/Hero.tsx
 *
 * FUNCIÓN:
 * Renderiza el carrusel principal (banner) de la página de inicio.
 * Es un componente con estado interno que controla qué slide se muestra.
 * Cambia automáticamente cada 6 segundos y permite navegación manual con dots.
 */

const slides = [
  {
    title: 'Equipa tu empresa con la mejor tecnología.',
    subtitle:
      'Accede al catálogo más completo de Laptops, Servidores y Redes...',
    btnText: 'Ver Ofertas Ahora',
    btnLink: '#catalogo-start',
    img: '/img/laptop.png',
    layout: 'normal',
  },
  {
    title: 'Servidores de Alto Rendimiento HP y Dell.',
    subtitle: 'Potencia tu infraestructura con soluciones escalables.',
    btnText: 'Cotizar Servidores',
    btnLink: '#catalogo-start',
    img: '/img/laptop.png',
    layout: 'reverse',
  },
];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentIndex];

  return (
    <section className={styles.heroWrapper}>
      <div
        className={`${styles.heroContainer} ${slide.layout === 'reverse' ? styles.reverseLayout : ''
          }`}
      >
        <div key={`content-${currentIndex}`} className={`${styles.heroContent} ${styles.fadeAnim}`}>
          <h1 className={styles.heroTitle}>{slide.title}</h1>
          <p className={styles.heroSubtitle}>{slide.subtitle}</p>
          <a href={slide.btnLink} className={styles.heroBtn}>
            {slide.btnText}
          </a>
        </div>

        <div
          key={`img-${currentIndex}`}
          className={`${styles.heroImageWrapper} ${styles.fadeAnim}`}
        >
          <img src={slide.img} alt="Hardware CSTI" className={styles.heroImg} />
        </div>
      </div>

      <div className={styles.heroDots}>
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`${styles.dot} ${idx === currentIndex ? styles.active : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;