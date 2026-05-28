import React, { useState } from "react";

export default function LandingPage({ onNavigate }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      num: '01',
      label: 'El Jagüey',
      title: 'La Crisis del Agua de Jagüey',
      desc: 'Las comunidades Wayúu dependen de pozos de agua cruda expuestos (jagüeyes) compartidos con la fauna local, acumulando sedimentos gruesos, parásitos y bacterias letales para el organismo infantil.',
    },
    {
      num: '02',
      label: 'Brote de EDA',
      title: 'El Nexo con las Enfermedades Diarreicas',
      desc: 'Las constantes infecciones estomacales (EDA) causan inflamación e impiden la absorción de los nutrientes. Proveer agua segura es el paso indispensable antes de nutrir.',
    },
    {
      num: '03',
      label: 'Filtro Orgánico',
      title: 'Purificación Ecológica por Capas',
      desc: 'Un sistema pasivo descentralizado de filtración por gravedad que purifica el agua utilizando zeolita activa (intercambio iónico), bagazo de caña de azúcar (adsorción de metales) y arena silícea.',
    },
    {
      num: '04',
      label: 'Telemetría IoT',
      title: 'Vigilancia Sanitaria Activa en Tiempo Real',
      desc: 'Sensores de TDS, turbidez y volumen con un microcontrolador ESP32 transmiten datos en vivo a la nube para mapear el riesgo sanitario de forma predictiva mediante modelos de IA.',
    },
    {
      num: '05',
      label: 'Escalabilidad',
      title: 'Arquitectura Modular para el Territorio Expandido',
      desc: 'Nuestra arquitectura modular está diseñada para escalar exponencialmente. El cerebro electrónico del ESP32 y sus sensores analógicos pueden acoplarse no solo a jagüeyes, sino también a sistemas de captación de agua de lluvia, pozos profundos artesanales, tomas de acueductos veredales y tanques de distribución. Adaptamos dinámicamente los umbrales a cualquier tipología de fuente hídrica.',
    },
  ];

  const cards = [
    {
      num: '01',
      title: 'Bagazo de Caña',
      subtitle: 'Adsorbente molecular orgánico',
      desc: 'Retiene compuestos químicos, plaguicidas, olores y metales pesados de forma pasiva mediante microporosidades celulósicas renovables.',
      img: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=600&auto=format&fit=crop',
    },
    {
      num: '02',
      title: 'Zeolita Activa',
      subtitle: 'Intercambio iónico a escala micro',
      desc: 'Atrapa selectivamente iones de metales pesados, neutraliza gérmenes, elimina el amoníaco y reduce significativamente la dureza del agua.',
      img: 'https://images.unsplash.com/photo-1518152006812-cdab29b069a8?q=80&w=600&auto=format&fit=crop',
    },
    {
      num: '03',
      title: 'Arena Silícea',
      subtitle: 'Filtración mecánica primaria',
      desc: 'Retiene los sedimentos gruesos, partículas suspendidas y lodo, garantizando la claridad física antes de las fases microbacterianas.',
      img: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=600&auto=format&fit=crop',
    },
    {
      num: '04',
      title: 'Telemetría ESP32',
      subtitle: 'Inteligencia y monitoreo continuo',
      desc: 'Mide TDS, claridad y nivel en tiempo real. Envía alertas de mantenimiento y opera de forma offline en áreas remotas sin cobertura.',
      img: 'https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=600&auto=format&fit=crop',
    },
  ];

  const heroImageUrl = 'https://images.unsplash.com/photo-1571401835393-8c5f35328320?q=80&w=1200';

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
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${heroImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
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
        padding: 'clamp(2rem, 5vw, 6rem) clamp(1.5rem, 4vw, 6rem) clamp(3rem, 6vw, 9rem)',
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
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${card.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} />

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

    </div>
  );
}
