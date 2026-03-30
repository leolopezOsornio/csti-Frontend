import { useState, useEffect } from 'react';

export interface PasswordRules {
  passLength: boolean;
  passUpper: boolean;
  passLower: boolean;
  passNum: boolean;
  passSpecial: boolean;
  isValid: boolean;
  missing: string[];
}

export const usePasswordValidation = (password: string): PasswordRules => {
  const [rules, setRules] = useState<PasswordRules>({
    passLength: false,
    passUpper: false,
    passLower: false,
    passNum: false,
    passSpecial: false,
    isValid: false,
    missing: [],
  });

  useEffect(() => {
    const passLength = password.length >= 8;
    const passUpper = /[A-Z]/.test(password);
    const passLower = /[a-z]/.test(password);
    const passNum = /[0-9]/.test(password);
    const passSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const missing: string[] = [];
    if (!passLength) missing.push('8 caracteres');
    if (!passUpper) missing.push('mayúscula');
    if (!passLower) missing.push('minúscula');
    if (!passNum) missing.push('número');
    if (!passSpecial) missing.push('carácter especial');

    const isValid = missing.length === 0;

    setRules({
      passLength,
      passUpper,
      passLower,
      passNum,
      passSpecial,
      isValid,
      missing,
    });
  }, [password]);

  return rules;
};
