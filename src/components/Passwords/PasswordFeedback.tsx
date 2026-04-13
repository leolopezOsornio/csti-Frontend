import React from 'react';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';

interface PasswordFeedbackProps {
  password?: string;
}

const PasswordFeedback: React.FC<PasswordFeedbackProps> = ({ password = '' }) => {
  const { isValid, missing } = usePasswordValidation(password);

  if (!password) return null;

  const reqStyle = (isValid: boolean) => ({
    color: isValid ? '#28a745' : '#dc3545',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '5px',
  });

  if (isValid) {
    return (
      <span style={reqStyle(true)}>
        <i className="fi fi-br-check"></i> ¡Contraseña segura!
      </span>
    );
  }

  return (
    <span style={reqStyle(false)}>
      <i className="fi fi-br-cross-small"></i> Falta: {missing.join(', ')}.
    </span>
  );
};

export default PasswordFeedback;
