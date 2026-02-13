// ==================== DOM Elements ====================
const $ = id => document.getElementById(id);
const input = $('input');
const output = $('output');

// ==================== Toast Notification ====================
function toast(msg, type = 'success') {
    const t = $('toast');
    const icon = t.querySelector('.toast-icon');
    const text = $('toastMsg');

    text.textContent = msg;
    t.className = `toast ${type} show`;
    icon.className = `toast-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;

    setTimeout(() => t.classList.remove('show'), 3000);
}

// ==================== UI Actions ====================
function clearInput() {
    input.value = '';
    output.value = '';
    toast('Cleared!');
}

function clearOutput() {
    output.value = '';
}

function loadFile(el) {
    const file = el.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = e => input.value = e.target.result;
    reader.readAsText(file);
    el.value = '';
}

function copyOutput() {
    if(!output.value) return toast('Output is empty', 'error');
    navigator.clipboard.writeText(output.value).then(() => toast('Copied!'));
}

function downloadOutput() {
    if(!output.value) return toast('Output is empty', 'error');

    // Smart file extension based on content
    let filename = 'v2ray-config.txt';
    let mimetype = 'text/plain';

    try {
        JSON.parse(output.value);
        filename = 'config.json';
        mimetype = 'application/json';
    } catch {
        // Not JSON, keep as .txt for links
    }

    const blob = new Blob([output.value], {type: mimetype});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    toast('Downloaded as ' + filename);
}

// ==================== Base64 Utilities ====================
const b64encode = s => btoa(unescape(encodeURIComponent(s)));
const b64decode = s => {
    try {
        return decodeURIComponent(escape(atob(s.trim())));
    } catch {
        return null;
    }
};

function encodeBase64() {
    if(!output.value) return toast('Output is empty', 'error');
    output.value = b64encode(output.value);
    toast('Encoded to Base64');
}

function decodeBase64() {
    if(!input.value) return toast('Input is empty', 'error');
    const decoded = b64decode(input.value.replace(/\s/g, ''));
    if(decoded) {
        input.value = decoded;
        toast('Decoded!');
    } else {
        toast('Invalid Base64', 'error');
    }
}

// ==================== JSON → Links Conversion ====================
function jsonToUrl() {
    if(!input.value) return toast('Input is empty', 'error');
    try {
        const data = JSON.parse(input.value);
        const items = Array.isArray(data) ? data : [data];
        const links = [];

        items.forEach(item => {
            (item.outbounds || []).forEach(out => {
                if(['vless','vmess','trojan','shadowsocks'].includes(out.protocol)) {
                    const conf = extract(item, out);
                    if(conf) {
                        if(out.protocol === 'vmess') links.push(mkVmess(conf));
                        else if(out.protocol === 'vless') links.push(mkVless(conf));
                        else if(out.protocol === 'trojan') links.push(mkTrojan(conf));
                        else if(out.protocol === 'shadowsocks') links.push(mkSS(conf));
                    }
                }
            });
        });

        if(links.length) {
            output.value = links.join('\n');
            toast(`Generated ${links.length} links`);
        } else {
            toast('No configs found', 'error');
        }
    } catch {
        toast('Invalid JSON', 'error');
    }
}

// ==================== Links → JSON Conversion ====================
function urlToJson() {
    if(!input.value) return toast('Input is empty', 'error');
    const lines = input.value.split(/[\n\s]+/);
    const outbounds = [];

    lines.forEach(line => {
        try {
            if(line.startsWith('vmess://')) {
                const c = JSON.parse(b64decode(line.substring(8)));
                outbounds.push(buildVmess(c));
            } else if(line.startsWith('vless://')) {
                outbounds.push(buildVlessTrojan(line, 'vless'));
            } else if(line.startsWith('trojan://')) {
                outbounds.push(buildVlessTrojan(line, 'trojan'));
            }
        } catch {}
    });

    if(outbounds.length) {
        output.value = JSON.stringify({ remarks: "Imported", outbounds }, null, 2);
        toast(`Converted ${outbounds.length} configs`);
    } else {
        toast('No valid links', 'error');
    }
}

// ==================== Config Extraction ====================
function extract(item, out) {
    const s = out.settings || {};
    const st = out.streamSettings || {};
    const tls = st.tlsSettings || st.realitySettings || {};

    let addr, port, id;
    if(out.protocol === 'trojan' || out.protocol === 'shadowsocks') {
        addr = s.servers?.[0]?.address;
        port = s.servers?.[0]?.port;
        id = s.servers?.[0]?.password;
    } else {
        addr = s.vnext?.[0]?.address;
        port = s.vnext?.[0]?.port;
        id = s.vnext?.[0]?.users?.[0]?.id;
    }

    if(!addr) return null;
    if(addr.includes(':') && !addr.includes('[')) addr = `[${addr}]`;

    return {
        ps: item.remarks || out.tag || "Server",
        add: addr, port, id,
        net: st.network || "tcp",
        tls: st.security || "",
        sni: tls.serverName || "",
        alpn: tls.alpn?.join(',') || "",
        host: st.wsSettings?.headers?.Host || "",
        path: st.wsSettings?.path || st.grpcSettings?.serviceName || "",
        method: s.servers?.[0]?.method || "",
        flow: s.vnext?.[0]?.users?.[0]?.flow || "",
        pbk: tls.publicKey || "",
        sid: tls.shortId || ""
    };
}

// ==================== Link Builders ====================
function mkVmess(c) {
    const v = {
        v:"2", ps:c.ps, add:c.add, port:c.port, id:c.id, aid:"0",
        scy:"auto", net:c.net, type:"none", host:c.host, path:c.path,
        tls:c.tls, sni:c.sni, alpn:c.alpn
    };
    return "vmess://" + b64encode(JSON.stringify(v));
}

function mkVless(c) {
    const p = new URLSearchParams();
    p.set("type", c.net);
    if(c.tls) p.set("security", c.tls);
    if(c.sni) p.set("sni", c.sni);
    if(c.alpn) p.set("alpn", c.alpn);
    if(c.pbk) p.set("pbk", c.pbk);
    if(c.sid) p.set("sid", c.sid);
    if(c.flow) p.set("flow", c.flow);
    if(c.host) p.set("host", c.host);
    if(c.path) p.set(c.net === 'grpc' ? "serviceName" : "path", c.path);
    return `vless://${c.id}@${c.add}:${c.port}?${p}#${encodeURIComponent(c.ps)}`;
}

function mkTrojan(c) {
    const p = new URLSearchParams();
    if(c.tls) p.set("security", c.tls);
    if(c.sni) p.set("sni", c.sni);
    if(c.alpn) p.set("alpn", c.alpn);
    if(c.net === 'ws') {
        p.set("type", "ws");
        if(c.host) p.set("host", c.host);
        if(c.path) p.set("path", c.path);
    } else if(c.net === 'grpc') {
        p.set("type", "grpc");
        if(c.path) p.set("serviceName", c.path);
    }
    return `trojan://${c.id}@${c.add}:${c.port}?${p}#${encodeURIComponent(c.ps)}`;
}

function mkSS(c) {
    return `ss://${b64encode(c.method + ':' + c.id)}@${c.add}:${c.port}#${encodeURIComponent(c.ps)}`;
}

// ==================== JSON Builders ====================
function buildVmess(c) {
    return {
        tag: "proxy",
        protocol: "vmess",
        settings: {
            vnext: [{
                address: c.add,
                port: +c.port,
                users: [{
                    id: c.id,
                    alterId: +c.aid||0
                }]
            }]
        },
        streamSettings: {
            network: c.net,
            security: c.tls,
            tlsSettings: c.tls === 'tls' ? {
                serverName: c.sni,
                alpn: c.alpn?.split(',')
            } : undefined,
            wsSettings: c.net === 'ws' ? {
                path: c.path,
                headers: { Host: c.host }
            } : undefined,
            grpcSettings: c.net === 'grpc' ? {
                serviceName: c.path
            } : undefined
        }
    };
}

function buildVlessTrojan(url, proto) {
    const u = new URL(url);
    const p = new URLSearchParams(u.search);
    const user = decodeURIComponent(u.username);
    const host = u.hostname;
    const port = +u.port;
    const net = p.get('type') || 'tcp';
    const sec = p.get('security') || 'none';

    const ob = {
        tag: "proxy",
        protocol: proto,
        settings: proto === 'trojan' 
            ? { servers: [{ address: host, port, password: user }] }
            : { vnext: [{ address: host, port, users: [{ id: user, encryption: "none", flow: p.get('flow') }] }] },
        streamSettings: { network: net, security: sec }
    };

    if(sec === 'tls') {
        ob.streamSettings.tlsSettings = {
            serverName: p.get('sni'),
            alpn: p.get('alpn')?.split(',')
        };
    }

    if(net === 'ws') {
        ob.streamSettings.wsSettings = {
            path: p.get('path'),
            headers: { Host: p.get('host') }
        };
    }

    if(net === 'grpc') {
        ob.streamSettings.grpcSettings = {
            serviceName: p.get('serviceName') || p.get('path')
        };
    }

    return ob;
}