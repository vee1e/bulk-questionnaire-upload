export interface RuntimeConfig {
    API_URL?: string;
}

let _config: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
    if (_config) return _config;
    try {
        const resp = await fetch('/assets/config.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error('config.json not found');
        _config = await resp.json();
    } catch (e) {
        // fallback to empty config
        _config = {};
    }
    return _config ?? {};
}

export function getRuntimeConfig(): RuntimeConfig {
    if (!_config) return {};
    return _config;
}
