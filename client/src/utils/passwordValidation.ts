export type PasswordChangeValidationInput = {
  confirmPassword?: string;
  currentPassword?: string;
  newPassword: string;
};

export const PASSWORD_MIN_LENGTH = 8;

export function validatePasswordChange({
  confirmPassword,
  currentPassword,
  newPassword,
}: PasswordChangeValidationInput) {
  console.log("[Password Change] Validation stage", {
    hasCurrentPassword: Boolean(currentPassword),
    hasNewPassword: Boolean(newPassword),
    sameAsCurrent: currentPassword === newPassword,
    newPasswordLength: newPassword.length,
  });

  if (currentPassword !== undefined && !currentPassword) {
    return "Current password is required.";
  }

  if (!newPassword) {
    return "New password is required.";
  }

  if (confirmPassword !== undefined && !confirmPassword) {
    return "Please confirm your new password.";
  }

  if (
    (currentPassword !== undefined && currentPassword.trim() !== currentPassword) ||
    newPassword.trim() !== newPassword ||
    (confirmPassword !== undefined && confirmPassword.trim() !== confirmPassword)
  ) {
    return "Passwords cannot start or end with spaces.";
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return "New password and confirmation do not match.";
  }

  if (currentPassword !== undefined && newPassword === currentPassword) {
    return "The new password must be different from your current password.";
  }

  return null;
}

export function getPasswordChangeErrorMessage(message: string, code?: string) {
  const normalizedCode = String(code ?? "").toUpperCase();
  const normalizedMessage = message.toLowerCase();

  if (normalizedCode === "PASSWORD_SAME_AS_CURRENT") {
    return "The new password must be different from your current password.";
  }

  if (
    normalizedCode === "PASSWORD_TOO_WEAK" ||
    normalizedMessage.includes("weak password") ||
    normalizedMessage.includes("password should be") ||
    normalizedMessage.includes("password is too weak") ||
    normalizedMessage.includes("password is too common") ||
    normalizedMessage.includes("compromised")
  ) {
    return "This password is too common or does not meet the password-security requirements. Please choose a stronger password.";
  }

  return message || "Unable to change password. Please try again.";
}
