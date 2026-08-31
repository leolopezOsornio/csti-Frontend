import re

with open('src/pages/auth/RecoverPassword/RecoverPassword.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace wrapper
content = content.replace("className={styles['auth-wrapper']}", "className={styles['split-wrapper']}")
content = content.replace("<div className={styles['auth-background']}></div>", "")

# Replace card to split-left-inner
content = re.sub(r'<div className={\$\{styles\[\'auth-card\'\]\}.*?}>', 
    r'''<div className={styles['split-left']}>
        <div className={${styles['split-left-inner']} animate__animated animate__fadeIn}>''', content)

# Close split-left and add split-right before the last two closing divs
content = re.sub(r'(</div>\s*</div>\s*);\s*};\s*export default RecoverPassword;',
    r'''</div>
      </div>
      <div className={styles['split-right']}>
        <div
          className={${styles['carousel-slide']} }
          style={{ backgroundImage: url(/img/Fondo.png) }}
        >
          <div className={styles['carousel-overlay']} />
          <div className={styles['carousel-content']}>
            <h2 className={styles['carousel-title']}>Velocidad sin límites</h2>
            <p className={styles['carousel-subtitle']}>La plataforma más rápida y confiable para tus operaciones diarias.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoverPassword;''', content)

# Change title
content = content.replace("className={styles['auth-title']}", "className={styles['split-title']}")

# Change logo / add logo
content = content.replace('<h2 className={styles[\'split-title\']}>Recuperar Contraseña</h2>',
    '''<Link to="/home">
            <img
              src="/img/descarga.png"
              alt="Faster Click Logo"
              className={styles['split-logo']}
              style={{ width: '90px', marginBottom: '10px' }}
            />
          </Link>
          <h1 className={styles['split-title']}>Recuperar Contraseña</h1>''')

# Change subtitles
content = content.replace("className={styles['auth-subtitle']}", "className={styles['split-subtitle']}")

# Change forms
content = content.replace("className={styles['auth-form']}", "className={styles['split-form']}")
content = content.replace("className={styles['form-group']}", "className={styles['split-form-group']}")
content = content.replace("className={styles['form-label']}", "className={styles['split-label']}")
content = re.sub(r'className=\{\$\{styles\[\'form-label\'\]\}.*?\}', "className={styles['split-label']}", content)

content = content.replace("className={styles['form-input']}", "className={styles['split-input']}")
content = re.sub(r'className=\{\$\{styles\[\'form-input\'\]\}.*?\}', "className={styles['split-input']} style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px' }}", content)

# Change passwords wrappers
content = content.replace("className={styles['password-wrapper']}", "className={styles['split-input-wrapper']}")
content = content.replace("className={i  }", "className={i  }")
content = content.replace("className={i  }", "className={i  }")


# Change buttons
content = content.replace("className={${styles['btn-cyan']} }", "className={styles['split-btn']}")
content = content.replace("className={${styles['btn-dark']} }", "className={styles['split-btn']}")
content = content.replace("className={${styles['btn-link']} }", "className={styles['split-btn']} style={{ background: 'transparent', color: '#00b8d4', border: '1px solid #00b8d4' }}")
content = content.replace("className={styles['btn-resend']}", "style={{ background: 'none', border: 'none', color: '#00b8d4', cursor: 'pointer', textDecoration: 'underline' }}")

# Auth header icon circle
content = content.replace("className={styles['auth-icon-circle']}", "style={{ display: 'none' }}")
content = content.replace("className={styles['auth-header']}", "style={{ textAlign: 'center', marginBottom: '20px' }}")
content = content.replace("className={styles['auth-inline-actions']}", "style={{ display: 'flex', gap: '10px', marginTop: '15px' }}")

with open('src/pages/auth/RecoverPassword/RecoverPassword.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
