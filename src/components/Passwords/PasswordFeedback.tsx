import React from 'react';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';

interface PasswordFeedbackProps {
  password?: string;
}

const PasswordFeedback: React.FC<PasswordFeedbackProps> = ({ password = '' }) => {
  const { isValid, missing } = usePasswordValidation(password);

  const isVisible = password.length > 0;

  const reqStyle = (isValid: boolean) => ({
    color: isValid ? 'var(--color-success-feedback, #28a745)' : 'var(--color-error-feedback, #dc3545)',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    maxHeight: isVisible ? '30px' : '0px',
    opacity: isVisible ? 1 : 0,
    marginTop: isVisible ? '5px' : '0px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  });

  return (
    <div style={{ overflow: 'hidden' }}>
      <span style={reqStyle(isValid)}>
        {isValid ? (
          <>
            <i className="fi fi-br-check"></i> ¡Contraseña segura!
          </>
        ) : (
          <>
            <i className="fi fi-br-cross-small"></i> Falta: {missing.join(', ')}.
          </>
        )}
      </span>
    </div>
  );
};

export default PasswordFeedback;
