const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Enter your first name";
  if (!form.lastName.trim()) errors.lastName = "Enter your last name";
  if (!EMAIL.test(form.username.trim())) errors.username = "Enter a valid email address";
  if (form.password.length < 8) errors.password = "Use at least 8 characters";
  else if (form.password.length > 72) errors.password = "Use at most 72 characters";
  return errors;
}
