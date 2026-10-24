// Einheitliche deutsche Zahlenschreibweise (72,5 statt 72.5; 2.465 statt 2465).
export function formatNumber(value) {
  return Number(value).toLocaleString("de-DE", { maximumFractionDigits: 2 });
}
