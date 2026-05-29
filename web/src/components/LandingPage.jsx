import React, { useState } from "react";
import FilterViewer3D from "./FilterViewer3D";

export default function LandingPage({ onNavigate }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      num: '01',
      label: 'El Jagüey',
      title: 'La Crisis del Agua de Jagüey',
      desc: 'Las comunidades Wayúu dependen de pozos de agua cruda expuestos (jagüeyes) compartidos con la fauna local, acumulando sedimentos gruesos, parásitos y bacterias letales para el organismo infantil.',
      img: '/assets/slide_jaguey.jpg',
      fallback: 'https://images.unsplash.com/photo-1571401835393-8c5f35328320?q=80&w=1200'
    },
    {
      num: '02',
      label: 'Brote de EDA',
      title: 'El Nexo con las Enfermedades Diarreicas',
      desc: 'Las constantes infecciones estomacales (EDA) causan inflamación e impiden la absorción de los nutrientes. Proveer agua segura es el paso indispensable antes de nutrir.',
      img: '/assets/slide_eda.jpg',
      fallback: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200'
    },
    {
      num: '03',
      label: 'Filtro Orgánico',
      title: 'Purificación Ecológica por Capas',
      desc: 'Un sistema pasivo descentralizado de filtración por gravedad que purifica el agua utilizando zeolita activa (intercambio iónico), bagazo de caña de azúcar (adsorción de metales) y arena silícea.',
      img: '/assets/slide_filtro.jpg',
      fallback: 'https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=1200'
    },
    {
      num: '04',
      label: 'Telemetría IoT',
      title: 'Vigilancia Sanitaria Activa en Tiempo Real',
      desc: 'Sensores de TDS, turbidez y volumen con un microcontrolador ESP32 transmiten datos en vivo a la nube para mapear el riesgo sanitario de forma predictiva mediante modelos de IA.',
      img: '/assets/slide_telemetria.jpg',
      fallback: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200'
    },
    {
      num: '05',
      label: 'Escalabilidad',
      title: 'Arquitectura Modular para el Territorio Expandido',
      desc: 'Nuestra arquitectura modular está diseñada para escalar exponencialmente. El cerebro electrónico del ESP32 y sus sensores analógicos pueden acoplarse no solo a jagüeyes, sino también a sistemas de captación de agua de lluvia, pozos profundos artesanales, tomas de acueductos veredales y tanques de distribución. Adaptamos dinámicamente los umbrales a cualquier tipología de fuente hídrica.',
      img: '/assets/slide_escalabilidad.jpg',
      fallback: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200'
    },
  ];


  const cards = [
    {
      num: '01',
      title: 'Bagazo de Caña',
      subtitle: 'Adsorbente molecular orgánico',
      desc: 'Retiene compuestos químicos, plaguicidas, olores y metales pesados de forma pasiva mediante microporosidades celulósicas renovables.',
      img: '/assets/card_bagazo.jpg',
      fallback: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=600&auto=format&fit=crop',
    },
    {
      num: '02',
      title: 'Zeolita Activa',
      subtitle: 'Intercambio iónico a escala micro',
      desc: 'Atrapa selectivamente iones de metales pesados, neutraliza gérmenes, elimina el amoníaco y reduce significativamente la dureza del agua.',
      img: '/assets/card_zeolita.jpg',
      fallback: 'https://img.lalr.co/cms/2015/07/09125829/zeolita0626-000.jpg',
    },
    {
      num: '03',
      title: 'Arena Silícea',
      subtitle: 'Filtración mecánica primaria',
      desc: 'Retiene los sedimentos gruesos, partículas suspendidas y lodo, garantizando la claridad física antes de las fases microbacterianas.',
      img: '/assets/card_arena.jpg',
      fallback: 'https://tierrasupplyco.com/cdn/shop/files/9D21B002-5856-4D91-BE4A-2D13B08F7D2D.jpg?v=1775305785&width=1946',
    },
    {
      num: '04',
      title: 'Telemetría ESP32',
      subtitle: 'Inteligencia y monitoreo continuo',
      desc: 'Mide TDS, claridad y nivel en tiempo real. Envía alertas de mantenimiento y opera de forma offline en áreas remotas sin cobertura.',
      img: '/assets/card_telemetria.jpg',
      fallback: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ═══════════════════════════════════════════
          HERO SECTION — Full Viewport, Asymmetric Grid
          ═══════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr',
        position: 'relative',
        overflow: 'hidden',
        background: 'hsl(var(--bg-base))',
        width: '100%',
      }}>

        {/* Watermark Number — massive background element */}
        <span
          className="watermark-number"
          style={{
            right: '8%',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14rem',
            zIndex: 1,
          }}
        >
          {slides[activeSlide].num}
        </span>

        {/* ── Left Column: Editorial Content ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(2rem, 5vw, 6rem) clamp(1.5rem, 4vw, 4rem)',
          position: 'relative',
          zIndex: 3,
        }}>

          {/* Section Label */}
          <span className="section-label" style={{ marginBottom: 'var(--space-lg)' }}>
            TECNOLOGÍA SOCIAL DE CÓDIGO ABIERTO
          </span>

          {/* Main Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.5rem',
            lineHeight: 1.1,
            fontWeight: 700,
            color: 'hsl(var(--text-primary))',
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-lg)',
          }}>
            Agua Segura, Nutrición Posible e Inteligencia de Datos
          </h1>

          {/* Slide Detail Panel — with decorative ocean-blue left border */}
          <div style={{
            borderLeft: '3px solid hsl(var(--ocean))',
            paddingLeft: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            transition: 'var(--transition)',
          }}>
            <span style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'hsl(var(--sky))',
              display: 'block',
              marginBottom: '0.4rem',
            }}>
              {slides[activeSlide].num} — {slides[activeSlide].label}
            </span>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              color: 'hsl(var(--sky))',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}>
              {slides[activeSlide].title}
            </h3>
            <p style={{
              fontFamily: 'var(--font-ui)',
              color: 'hsl(var(--text-secondary))',
              fontSize: '1rem',
              lineHeight: 1.65,
              maxWidth: '520px',
            }}>
              {slides[activeSlide].desc}
            </p>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('docs')}>
              Explorar Documentación
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('login')}>
              Acceso Comunitario
            </button>
          </div>
        </div>

        {/* ── Right Column: Background Image with Gradient Mask ── */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* The landscape photo */}
          <img 
            key={activeSlide}
            src={slides[activeSlide].img}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = slides[activeSlide].fallback;
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'all 0.5s ease-in-out',
            }}
            alt={slides[activeSlide].title}
          />
          {/* Left-side gradient mask that blends into the bg */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, hsl(207 50% 8%) 0%, transparent 40%)',
            zIndex: 2,
          }} />
          {/* Bottom fade for clean transition */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, hsl(207 50% 8%) 0%, transparent 30%)',
            zIndex: 2,
          }} />

          {/* ── Slide Selector: Vertical Dots ── */}
          <div style={{
            position: 'absolute',
            right: 'var(--space-lg)',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1.75rem',
            zIndex: 4,
          }}>
            {slides.map((slide, idx) => {
              const isActive = activeSlide === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    opacity: isActive ? 1 : 0.4,
                  }}
                >
                  {/* Slide number + label */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: isActive ? '1.25rem' : '0.95rem',
                      fontWeight: 700,
                      color: isActive ? 'hsl(var(--sky))' : 'hsl(var(--text-dim))',
                      display: 'block',
                      transition: 'var(--transition)',
                    }}>
                      {slide.num}
                    </span>
                    {isActive && (
                      <span style={{
                        fontFamily: 'var(--font-label)',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'hsl(var(--text-secondary))',
                      }}>
                        {slide.label}
                      </span>
                    )}
                  </div>
                  {/* Dot */}
                  <div style={{
                    width: isActive ? '10px' : '6px',
                    height: isActive ? '10px' : '6px',
                    borderRadius: '50%',
                    background: isActive ? 'hsl(var(--sky))' : 'hsl(var(--text-dim))',
                    border: isActive ? '2px solid hsl(var(--sky))' : '1.5px solid hsl(var(--text-dim))',
                    transition: 'var(--transition)',
                    flexShrink: 0,
                  }} />
                </div>
              );
            })}
            {/* Connecting vertical line behind dots */}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PROBLEM SECTION — Two Columns with Vertical Divider
          ═══════════════════════════════════════════ */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr',
        gap: 0,
        padding: 'clamp(2rem, 5vw, 9rem) clamp(1.5rem, 4vw, 6rem)',
        background: 'hsl(var(--bg-base))',
        width: '100%',
      }}>

        {/* Left: Narrative */}
        <div style={{
          paddingRight: 'var(--space-xl)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'var(--space-sm)',
        }}>
          <span className="section-label section-label-warm">
            EL DESAFÍO HUMANITARIO
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
            color: 'hsl(var(--text-primary))',
            lineHeight: 1.15,
            marginTop: 'var(--space-xs)',
          }}>
            El Diagnóstico de la Desnutrición Infantil
          </h2>
          <p style={{
            fontFamily: 'var(--font-ui)',
            color: 'hsl(var(--text-secondary))',
            fontSize: '1rem',
            lineHeight: 1.7,
            marginTop: 'var(--space-sm)',
          }}>
            En las comunidades Wayúu, la desnutrición infantil crónica no solo ocurre
            por la falta de alimentos, sino porque el agua insalubre que consumen les
            causa <strong style={{ color: 'hsl(var(--text-primary))' }}>Enfermedades
            Diarreicas Agudas (EDA)</strong> constantes.
          </p>
          <p style={{
            fontFamily: 'var(--font-ui)',
            color: 'hsl(var(--text-secondary))',
            fontSize: '1rem',
            lineHeight: 1.7,
          }}>
            Las infecciones continuas destruyen las vellosidades intestinales, <strong
            style={{ color: 'hsl(var(--text-primary))' }}>impidiendo que los niños
            absorban los nutrientes</strong> de las ayudas humanitarias. Proveer agua
            segura es el paso indispensable antes de nutrir.
          </p>
        </div>

        {/* Vertical Divider */}
        <div style={{
          width: '1px',
          background: 'hsl(var(--ocean))',
          opacity: 0.5,
          alignSelf: 'stretch',
        }} />

        {/* Right: Data Points */}
        <div style={{
          paddingLeft: 'var(--space-xl)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'var(--space-md)',
        }}>
          {/* Data Card 1 */}
          <div style={{
            background: 'hsla(var(--bg-surface) / 0.6)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsla(var(--peach) / 0.15)',
            display: 'flex',
            gap: 'var(--space-md)',
            alignItems: 'flex-start',
          }}>
            {/* Structured indicator instead of emoji */}
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'hsl(var(--peach))',
              lineHeight: 1,
              flexShrink: 0,
              width: '40px',
              textAlign: 'center',
            }}>
              I
            </span>
            <div>
              <h4 style={{
                fontFamily: 'var(--font-label)',
                color: 'hsl(var(--text-primary))',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginBottom: '0.3rem',
              }}>
                Surge de la EDA
              </h4>
              <p style={{
                fontFamily: 'var(--font-ui)',
                color: 'hsl(var(--text-secondary))',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}>
                Causa inflamación e impide la absorción digestiva de macronutrientes.
              </p>
            </div>
          </div>

          {/* Data Card 2 */}
          <div style={{
            background: 'hsla(var(--bg-surface) / 0.6)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsla(var(--sky) / 0.12)',
            display: 'flex',
            gap: 'var(--space-md)',
            alignItems: 'flex-start',
          }}>
            {/* Structured indicator instead of emoji */}
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'hsl(var(--sky))',
              lineHeight: 1,
              flexShrink: 0,
              width: '40px',
              textAlign: 'center',
            }}>
              II
            </span>
            <div>
              <h4 style={{
                fontFamily: 'var(--font-label)',
                color: 'hsl(var(--text-primary))',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginBottom: '0.3rem',
              }}>
                Agua de Jagüey
              </h4>
              <p style={{
                fontFamily: 'var(--font-ui)',
                color: 'hsl(var(--text-secondary))',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}>
                Alta turbidez física y cargas bacterianas letales para el colon infantil.
              </p>
            </div>
          </div>

          {/* Data Card 3 */}
          <div style={{
            background: 'hsla(var(--bg-surface) / 0.6)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsla(var(--success) / 0.12)',
            display: 'flex',
            gap: 'var(--space-md)',
            alignItems: 'flex-start',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'hsl(var(--success))',
              lineHeight: 1,
              flexShrink: 0,
              width: '40px',
              textAlign: 'center',
            }}>
              III
            </span>
            <div>
              <h4 style={{
                fontFamily: 'var(--font-label)',
                color: 'hsl(var(--text-primary))',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginBottom: '0.3rem',
              }}>
                Ciclo de Desnutrición
              </h4>
              <p style={{
                fontFamily: 'var(--font-ui)',
                color: 'hsl(var(--text-secondary))',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}>
                Sin agua potable, las intervenciones nutricionales fracasan. El intestino
                inflamado no absorbe lo que se le entrega.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FILTER CARDS SECTION — Capas del Filtro
          ═══════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(2rem, 5vw, 6rem) clamp(1.5rem, 4vw, 6rem) clamp(1.5rem, 3vw, 2.5rem)',
        background: 'hsl(var(--bg-base))',
        width: '100%',
      }}>
        {/* Section Header */}
        <div style={{
          maxWidth: '600px',
          marginBottom: 'var(--space-xl)',
        }}>
          <span className="section-label">
            TECNOLOGÍA ABIERTA
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
            color: 'hsl(var(--text-primary))',
            lineHeight: 1.15,
            marginTop: 'var(--space-xs)',
          }}>
            El Filtro Físico-Químico por Capas Orgánicas
          </h2>
          <p style={{
            fontFamily: 'var(--font-ui)',
            color: 'hsl(var(--text-secondary))',
            fontSize: '1rem',
            lineHeight: 1.65,
            marginTop: 'var(--space-sm)',
          }}>
            Purificación eficiente usando recursos renovables abundantes y de fácil recambio.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          gap: 'var(--space-lg)',
          width: '100%',
        }}>
          {cards.map((card, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                minHeight: '340px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                border: '1px solid hsla(var(--border))',
                transition: 'var(--transition)',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'hsl(var(--border-active))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'hsl(var(--border))';
              }}
            >
              {/* Background Image */}
              <img 
                src={card.img}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = card.fallback;
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'var(--transition)',
                }}
                alt={card.title}
              />

              {/* Darker Overlay at bottom */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(10, 24, 34, 0.92) 0%, rgba(20, 41, 58, 0.6) 50%, rgba(0, 0, 0, 0.1) 100%)',
                zIndex: 1,
              }} />

              {/* Large Display Number — watermark style within card */}
              <span style={{
                position: 'absolute',
                top: 'var(--space-md)',
                right: 'var(--space-md)',
                fontFamily: 'var(--font-display)',
                fontSize: '4.5rem',
                fontWeight: 900,
                color: 'hsl(var(--text-primary))',
                opacity: 0.08,
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 2,
              }}>
                {card.num}
              </span>

              {/* Card Content */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                padding: 'var(--space-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}>
                <span style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'hsl(var(--sky))',
                }}>
                  {card.subtitle}
                </span>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  color: 'hsl(var(--text-primary))',
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-ui)',
                  color: 'hsl(var(--text-secondary))',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  marginTop: '0.25rem',
                }}>
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          APP DOWNLOAD SECTION — Premium Glassmorphic Call to Action
          ═══════════════════════════════════════════ */}
      <section id="download-app" style={{
        padding: 'clamp(3rem, 6vw, 6rem) clamp(1.5rem, 4vw, 6rem)',
        background: 'linear-gradient(to bottom, hsl(var(--bg-base)), hsla(var(--bg-surface) / 0.3))',
        borderTop: '1px solid hsla(var(--border) / 0.2)',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div className="card-static" style={{
          maxWidth: '960px',
          width: '100%',
          background: 'linear-gradient(135deg, hsla(var(--bg-surface) / 0.7) 0%, hsla(var(--bg-base) / 0.9) 100%)',
          border: '1px solid hsla(var(--sky) / 0.15)',
          borderRadius: 'var(--radius-lg)',
          padding: 'clamp(2rem, 4vw, 4rem)',
          boxShadow: 'var(--shadow-float)',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: 'var(--space-xl)',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle watermark background circles */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsla(var(--sky) / 0.05) 0%, transparent 70%)',
            top: '-50px',
            right: '-50px',
            zIndex: 1,
            pointerEvents: 'none'
          }} />

          {/* Left Column: Copy */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span className="section-label" style={{ color: 'hsl(var(--peach))', marginBottom: '0.5rem', display: 'inline-block' }}>
              MONITOREO EN LA PALMA DE TU MANO
            </span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              color: 'hsl(var(--text-primary))',
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '1rem'
            }}>
              Descarga nuestra app, disponible en Android y iOS
            </h2>
            <p style={{
              fontFamily: 'var(--font-ui)',
              color: 'hsl(var(--text-secondary))',
              fontSize: '1rem',
              lineHeight: 1.65,
              marginBottom: '1.5rem'
            }}>
              Lleva el control de calidad del agua y reporta incidencias de turbidez, sequedad o averías físicas directamente desde el territorio, incluso en zonas rurales sin cobertura móvil gracias a nuestra tecnología offline integrada.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'hsl(var(--success))',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              <span className="pulse-indicator" style={{ width: '8px', height: '8px' }}></span>
              <span>Sincronización híbrida fuera de línea y escaneo QR incluidos</span>
            </div>
          </div>

          {/* Right Column: Download Buttons */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            justifyContent: 'center',
            alignItems: 'stretch'
          }}>
            {/* Android Download Button */}
            <a 
              href="https://github.com/CoralGamer/Aquora-/raw/main/mobile/builds/aquora-comunidad.apk" 
              className="btn btn-primary"
              style={{
                padding: '1rem 1.5rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--ocean))',
                borderColor: 'hsl(var(--ocean))',
                textDecoration: 'none'
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', fill: 'currentColor' }}>
                <path d="M16.6 14c-.52 0-.95-.43-.95-.95 0-.52.43-.95.95-.95.52 0 .95.43.95.95 0 .52-.43.95-.95.95m-9.2 0c-.52 0-.95-.43-.95-.95 0-.52.43-.95.95-.95.52 0 .95.43.95.95 0 .52-.43.95-.95.95M12 5.01c2.41 0 4.47 1.48 5.37 3.57H6.63C7.53 6.49 9.59 5.01 12 5.01m7.42 3.58C19.78 8.1 20 7.57 20 7s-.22-1.1-.63-1.52l1.37-1.37a.996.996 0 1 0-1.41-1.41l-1.37 1.37C16.48 3.39 14.34 3 12 3s-4.48.39-5.96 1.08L4.67 2.7a.996.996 0 1 0-1.41 1.41l1.37 1.37C4.22 5.9 4 6.43 4 7s.22 1.1.63 1.52c-.6.18-1 .73-1 1.38v6c0 .83.67 1.5 1.5 1.5h1.22c.4 1.14 1.48 1.95 2.76 1.95v2c0 .55.45 1 1 1s1-.45 1-1v-2h2v2c0 .55.45 1 1 1s1-.45 1-1v-2c1.28 0 2.36-.81 2.76-1.95h1.22c.83 0 1.5-.67 1.5-1.5v-6c0-.65-.4-1.2-1-1.38z" />
              </svg>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disponible para Android</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Descargar APK (.apk)</span>
              </div>
            </a>

            {/* iOS Download Button */}
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                alert("Instalación de iOS:\n\nEl instalador corporativo iOS (.ipa) para el piloto comunal de AQUORA puede descargarse desde la carpeta /mobile/builds/ en el repositorio. Para instalar en dispositivos Apple en fase de pruebas:\n\n1. Registre el UUID de su dispositivo en la consola de Apple Developer.\n2. Instale mediante Cydia Impactor o Xcode.");
              }}
              className="btn btn-secondary"
              style={{
                padding: '1rem 1.5rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none'
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', fill: 'currentColor' }}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.68-1.12 1.82-.98 2.92.1.08.2.12.3.12.87 0 1.97-.57 2.51-1.43z" />
              </svg>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disponible para iOS</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Descargar iOS (.ipa)</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PUBLIC 3D FILTER VIEWER SECTION
          ═══════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(2rem, 5vw, 6rem) clamp(1.5rem, 4vw, 6rem) clamp(3rem, 6vw, 9rem)',
        background: 'hsl(var(--bg-base))',
        borderTop: '1px solid hsla(var(--border) / 0.3)',
        width: '100%',
      }}>
        <div style={{ maxWidth: '800px', marginBottom: 'var(--space-xl)' }}>
          <span className="section-label">
            EXPLORACIÓN TÉCNICA E INTERACTIVA
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
            color: 'hsl(var(--text-primary))',
            lineHeight: 1.15,
            marginTop: 'var(--space-xs)',
          }}>
            Desarmado del Purificador en 3D
          </h2>
          <p style={{
            fontFamily: 'var(--font-ui)',
            color: 'hsl(var(--text-secondary))',
            fontSize: '1rem',
            lineHeight: 1.65,
            marginTop: 'var(--space-sm)',
          }}>
            Mueve el deslizador para ver la estructura interna por capas biológicas y el posicionamiento de los componentes de telemetría IoT. Cualquier visitante puede interactuar directamente con nuestro diseño abierto.
          </p>
        </div>

        <FilterViewer3D />
      </section>

    </div>
  );
}
