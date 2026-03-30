// Strip leading option labels like "A. " or "A) " from quiz options
export function cleanOption(opt) {
  if (!opt) return '';
  // Remove patterns like "A. " "B) " "C. " etc at the start
  return opt.replace(/^[A-D][.)]\s*/u, '').trim();
}
