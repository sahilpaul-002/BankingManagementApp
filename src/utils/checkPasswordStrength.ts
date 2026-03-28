import type { validatePasswordType } from "./validatePassword";

export type passwordStrengthType = {
  label: string,
  percent: number,
  color: string
}

export default function getPasswordStrength(rules: validatePasswordType): passwordStrengthType {

  const passed = rules.filter(r => r.valid).length;

  if (passed <= 2) return { label: "Weak", percent: 25, color: "text-red-500" };
  if (passed > 2 && passed <= 4) return { label: "Fair", percent: 50, color: "text-yellow-500" };
  if (passed > 4 && passed <= 6) return { label: "Good", percent: 75, color: "text-blue-500" };
  // if (passed >6 &&  passed <=7) 
  else {
    return { label: "Strong", percent: 100, color: "text-green-400" };
  }

}