// 格式化已有的 JWT_PRIVATE_KEY，将换行符替换为空格
// 使用方法: bun run format-jwt-key.mjs

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDHJUa5cQIOW1Sv
VUiTYdfaX+zOb7MqP6ovJOALN+w9+8hIeE34uBtoVqrre4x/Us+dQQg0KRtdkBTX
SbaOlacEMR2g2hspbiSsBLTyi9+NtqU6gnq6AFZb5ASV+d7973GGigtIchdLX3dY
9x0exuaOrZVptKLnSbY2r5Hxz2VdEr+GkAjQdw6dMWKOim8syvKEj8UYL41qARXf
roM2kVXZqkSz0xIOjrpHsOBYOOloEriQ0r5iWLNZCODSKEZlmqQPm0KuF1iltn/z
s4UgRH+IXUCqCmoxLaeoCtkmOcJCHwqU8jitAV2L/wxms1pqEzwJRxIdPPLkRCi0
UuXwBOuJAgMBAAECggEAIOWNe1CpsElyAcyqwn3lNFOoQKm/BPmjWUpUIEZKpiqT
eTU2XCG9lUzLyz6LhPTfCvEVM9iehqQobS/mEkOyZUTfyhR9bCifsjLM2Uw1z6ke
Pj4Tm+o2WdOe1k+CgJwvOrRPDNab9n18r5uSmeTtbSBLkDygtGg+y2XRTAqgifEm
TQ0bW2sZ1OpvYSSht5+xp8D3+Ah+RAdJSODKU19XNn5W4O8TVMEjg+Y80cqvJjq4
AJ3qy0linuKTptMdFoFZ7bkN3TwvuBE0/y+CuAqFB6+l5zyXhQCwqv9ItIVKzJWf
UfKUK9ccwZPOSPAlQ18T6IEcy/5xLATaCjT0BW1rKQKBgQDjF34l8S1+VDH958UC
1yGlpHWGxjRU4HASalEy7FsM+I3rIrN+1uYfiRnfUr/LTSH2dekHsu53ZXo3zU5n
enMg7uBeVxIL1ZCBvynxHhBYQj7TQbxCh2gV5gthhhDlqimiAHhIMOQDQn6jn84P
0ZvBzu6JvdjXCiGPnU/GzMTlwwKBgQDgfxGv+NCm2AHMVDJFyMmqh5n9aOhkFRfQ
/gqFfcUY7XcGxedubVNgB1VL1s5dmU/cLflht6/mV/r/P87ae2Ooy6AuTNn042wa
qqoqaacZRSgt90MSAybQDQGydqLM8T0ntBIgkox6ekuV7LhnsUmqws+WTE1teEjD
NBMBwmf4wwKBgCtYR5a8Yv+S2HvrKhpxr5VrP5d663Ar6phJPLhojrR6GLSByhry
r7fjNlH+/Ga0kT/2n4T9rTCS6PIPuOBdae4mSiMXoXUqzUtGjp3cLCh8dHtkN6fH
KqHLZ+60ZTNA+HNYfZzh4BOTNJLMpMs2KfGjKrqVxva8k01TLG/4k7h7AoGBALZj
5n3em76Bzmwwl6uEpvuKMfzlR7FQRcpBK1ErTn+jJkn1bcKUxeFF8/Gqsnzu+yf6
nhra/ukY386TC78L8nsH/LrBK28/eevsblYJAn6QZkV6Fx7COr1bY96XbkstT687
KGMYTVOQmmpTKbrtGdnHbppAocNnr04Qt8R9KrW7AoGAQaEpnkX0gk4RpzFyzu5t
b04SU+tHrFtoM5lZVnAwM46Y7Lv444lnnfuCdHdIQ9aGHcXLDTYBTAJkrEz7N0hf
VnkTZa10VhG4xJ4Rr8teA5ANDheW+vEz29EblMs0kiWIv4hi9KzTozyorsAoXyZF
AFv6l9kPJ80/hckuTCqCT14=
-----END PRIVATE KEY-----`;

// 格式化：将换行符替换为空格
const formattedKey = privateKey.trimEnd().replace(/\n/g, " ");

console.log("\n=== 格式化后的 JWT_PRIVATE_KEY ===\n");
console.log(formattedKey);
console.log("\n=== 设置步骤 ===\n");
console.log("1. 复制上面的整行（包括 BEGIN 和 END）");
console.log("2. 打开 https://dashboard.convex.dev");
console.log("3. 选择你的项目");
console.log("4. 进入 Settings → Environment Variables");
console.log("5. 添加环境变量:");
console.log("   - 名称: JWT_PRIVATE_KEY");
console.log("   - 值: 粘贴上面格式化后的密钥（整行）");
console.log("\n或者使用 CLI:");
console.log(`npx convex env set JWT_PRIVATE_KEY "${formattedKey}"\n`);
