export async function register() {
  if (typeof process !== "undefined" && process.env) {
    const mask = (value: string) => {
      const first3 = value.slice(0, 3);
      const last3 = value.slice(-3);
      return `${first3}***${last3}`;
    };
    const envKeys = Object.keys(process.env).sort();
    console.log("[env] Loaded environment variables (values masked):");
    for (const key of envKeys) {
      const value = process.env[key] ?? "";
      console.log(`  ${key}=${mask(value)}`);
    }
  }
}
