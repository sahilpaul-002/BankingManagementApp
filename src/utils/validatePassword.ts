type RulesTypes = {
  regex: RegExp,
  message: string
}

export type validatePasswordType = Array<{
  valid: boolean,
  message: string
}>

export default function validatePassword(password: string): validatePasswordType {
  if (typeof password !== "string") {
    return [{ valid: false, message: "Password must be a string" }];
  }

  const rules: RulesTypes[] = [
    {
      regex: /.{8,}/,
      message: "Password must be atleast 8 characters."
    },
    {
      regex: /^\S(?:.*\S)?$/,
      message: "Must not start or end with a space"
    },
    {
      regex: /[A-Z]/,
      message: "At least one uppercase letter"
    },
    {
      regex: /[a-z]/,
      message: "At least one lowercase letter"
    },
    {
      regex: /\d/,
      message: "Must have atleast one digit"
    },
    {
      // NO SPACE INCLUDED
      regex: /[@$!%*?&^#()[\]{}\-_=+|\\:;"'<>,./~`]/,
      message: "At least one special character (@$!%*?&^#...)"
    },
    {
      // Allowed characters only (no emojis / unicode)
      regex: /^[A-Za-z0-9@$!%*?&^#()[\]{}\-_=+|\\:;"'<>,./~`\s]+$/,
      message: "Only letters, numbers, and allowed special characters"
    }
  ];

  return rules.map(rule => ({
    valid: rule.regex.test(password),
    message: rule.message
  }));
}
