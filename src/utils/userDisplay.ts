export const getUserInitials = (
  firstName?: string,
  lastName?: string,
  email?: string,
) => {
  const firstInitial = firstName?.trim().charAt(0);
  const lastInitial = lastName?.trim().charAt(0);
  const emailInitial = email?.trim().charAt(0);

  return `${firstInitial || emailInitial || 'U'}${lastInitial || ''}`.toUpperCase();
};
