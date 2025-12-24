import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", {
  extractable: true,
});
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

console.log("\n=== JWT Keys Generated ===\n");
console.log("JWT_PRIVATE_KEY:");
console.log(privateKey.trimEnd().replace(/\n/g, " "));
console.log("\nJWKS:");
console.log(jwks);
console.log("\n=== Copy JWT_PRIVATE_KEY to your Convex environment variables ===\n");
console.log("To set in Convex Dashboard:");
console.log("1. Go to https://dashboard.convex.dev");
console.log("2. Select your project");
console.log("3. Go to Settings → Environment Variables");
console.log("4. Add JWT_PRIVATE_KEY with the value above\n");
console.log("Or use CLI:");
console.log('npx convex env set JWT_PRIVATE_KEY "' + privateKey.trimEnd().replace(/\n/g, " ") + '"\n');
