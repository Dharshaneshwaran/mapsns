// Require repeated GPS evidence, but react sooner at vehicle speeds.
export function isRerouteDue(
  mode: "walking" | "vehicle",
  fixes: number,
  deviationDurationMs: number,
  sinceLastRequestMs: number,
) {
  return mode === "vehicle"
    ? fixes >= 2 && deviationDurationMs >= 1000 && sinceLastRequestMs > 2500
    : fixes >= 3 && deviationDurationMs >= 3000 && sinceLastRequestMs > 10000;
}
