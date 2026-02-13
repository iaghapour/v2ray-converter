# V2Ray Converter ⚡

A simple web tool to convert between V2Ray JSON configs and share links.

🔗 **[Try it online](https://iaghapour.github.io/v2ray-converter/)**

## What is this?

This tool helps you convert V2Ray/Xray configurations in two ways:

- **JSON → Links**: Convert your JSON config to shareable links (vless://, vmess://, etc.)
- **Links → JSON**: Convert share links back to standard JSON format

Everything runs in your browser - no data is sent to any server.

## Features

✅ Bidirectional conversion (JSON ↔ Links)  
✅ Supports VLESS, VMess, Trojan, Shadowsocks  
✅ Base64 encoding/decoding for subscriptions  
✅ File upload support  
✅ 100% client-side (private & secure)

## Usage

### Convert JSON to Links

1. Paste your JSON config in the **Input** panel
2. Click **JSON → Links**
3. Copy or download the generated links

### Convert Links to JSON

1. Paste V2Ray links in the **Input** panel (one per line)
2. Click **Links → JSON**
3. Get standard JSON config for Xray/V2Ray

### Base64 Subscription

- **Encode**: Convert links to Base64 subscription format
- **Decode**: Decode Base64 subscriptions back to readable links

## Supported Protocols

| Protocol | Status |
|----------|--------|
| VLESS | ✅ Full support |
| VMess | ✅ Full support |
| Trojan | ✅ Full support |
| Shadowsocks | ✅ Basic support |

**Transport**: TCP, WebSocket, gRPC  
**Security**: TLS, Reality, None

## License

MIT License - Free to use for personal and commercial purposes.

## Support

⭐ Star this repo if you find it useful  
📺 [YouTube: @iAghapour](https://www.youtube.com/@iAghapour?sub_confirmation=1)

---

Made with ❤️ for internet freedom
