// src/components/Hero/Hero.tsx
import { useState, useEffect } from 'react';
import './Hero.css';

/**
 * COMPONENTE: Hero
 * UBICACIÓN: src/components/Hero/Hero.tsx
 * * FUNCIÓN: 
 * Renderiza el carrusel principal (banner) de la página de inicio. 
 * Es un componente con estado interno (useState) que lleva el control de qué 
 * "slide" se está mostrando actualmente. Utiliza el hook useEffect para crear un 
 * intervalo que cambia la imagen automáticamente cada 6 segundos, simulando 
 * el comportamiento del Vanilla JS original.
 */

const slides = [
  {
    title: "Equipa tu empresa con la mejor tecnología.",
    subtitle: "Accede al catálogo más completo de Laptops, Servidores y Redes...",
    btnText: "Ver Ofertas Ahora",
    btnLink: "#catalogo-start",
    img: "/img/laptop.png",
    layout: "normal"
  },
  {
    title: "Servidores de Alto Rendimiento HP y Dell.",
    subtitle: "Potencia tu infraestructura con soluciones escalables.",
    btnText: "Cotizar Servidores",
    btnLink: "#catalogo-start",
    img: "/img/laptop.png",
    layout: "reverse"
  }
  // Agregar sliders adicionales aquí si es necesario
];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer); // Limpieza del intervalo
  }, []);

  const slide = slides[currentIndex];

  return (
    <section className="hero-wrapper">
      <div className={`hero-container ${slide.layout === 'reverse' ? 'reverse-layout' : ''}`}>
        
        {/* Usamos key para forzar la re-animación de CSS cuando cambia el index */}
        <div key={`content-${currentIndex}`} className="hero-content fade-anim">
          <h1 className="hero-title">{slide.title}</h1>
          <p className="hero-subtitle">{slide.subtitle}</p>
          <a href={slide.btnLink} className="hero-btn">{slide.btnText}</a>
        </div>
        
        <div key={`img-${currentIndex}`} className="hero-image-wrapper fade-anim">
          <img src={slide.img} alt="Hardware CSTI" className="hero-img" />
        </div>
        
      </div>
      
      <div className="hero-dots">
        {slides.map((_, idx) => (
          <span 
            key={idx} 
            className={`dot ${idx === currentIndex ? 'active' : ''}`} 
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;