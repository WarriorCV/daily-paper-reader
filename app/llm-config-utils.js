(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.DPRLLMConfigUtils = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const normalizeText = (value) => String(value || '').trim();

  const normalizeBaseUrlForStorage = (value) => {
    let text = normalizeText(value).replace(/\/+$/g, '');
    if (!text) return '';
    text = text.replace(/\/chat\/completions$/i, '');
    return text.replace(/\/+$/g, '');
  };

  const buildChatCompletionsEndpoint = (value) => {
    const raw = normalizeText(value).replace(/\/+$/g, '');
    if (!raw) return '';
    if (/\/chat\/completions$/i.test(raw)) return raw;
    const normalized = normalizeBaseUrlForStorage(raw);
    if (!normalized) return '';
    if (/\/v\d+$/i.test(normalized)) {
      return `${normalized}/chat/completions`;
    }
    return `${normalized}/v1/chat/completions`;
  };

  const sanitizeModelList = (values, maxCount = 3) => {
    const rawList = Array.isArray(values) ? values : [values];
    const out = [];
    const seen = new Set();
    for (const value of rawList) {
      const parts = String(value || '').split(/[\n,]+/).map(normalizeText).filter(Boolean);
      for (const name of parts) {
        const key = name.toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(name);
        if (out.length >= Math.max(Number(maxCount) || 0, 1)) return out;
      }
    }
    return out;
  };

  // 1. 动态读取：从网页界面（UI）传递进来的配置读取 Chat 接口
  const resolveChatModels = (secret) => {
    const safeSecret = secret && typeof secret === 'object' ? secret : {};
    const chatList = Array.isArray(safeSecret.chatLLMs) ? safeSecret.chatLLMs : [];
    const models = [];
    const seen = new Set();

    chatList.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const baseUrl = normalizeBaseUrlForStorage(item.baseUrl || '');
      const apiKey = normalizeText(item.apiKey || '');
      const modelNames = sanitizeModelList(item.models || [], 99);

      if (!baseUrl || !apiKey || !modelNames.length) return;

      modelNames.forEach((name) => {
        const dedupeKey = `${name.toLowerCase()}\u0000${baseUrl}\u0000${apiKey}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        models.push({ name, apiKey, baseUrl });
      });
    });
    return models;
  };

  // 2. 动态读取：从网页界面（UI）读取 Summary 接口配置
  const resolveSummaryLLM = (secret) => {
    const safeSecret = secret && typeof secret === 'object' ? secret : {};
    const summarized = safeSecret.summarizedLLM || {};
    const baseUrl = normalizeBaseUrlForStorage(summarized.baseUrl || '');
    const apiKey = normalizeText(summarized.apiKey || '');
    const model = normalizeText(summarized.model || '');

    if (baseUrl && apiKey && model) {
      return { baseUrl, apiKey, model };
    }

    const chatModels = resolveChatModels(safeSecret);
    if (!chatModels.length) return null;
    return {
      baseUrl: normalizeBaseUrlForStorage(chatModels[0].baseUrl || ''),
      apiKey: normalizeText(chatModels[0].apiKey || ''),
      model: normalizeText(chatModels[0].name || ''),
    };
  };

  // ==========================================
  // 下方是保留的“中转站兼容性硬连线”配置
  // ==========================================

  // 强制全局按 OpenAI 兼容标准运行
  const inferProviderType = () => 'openai-compatible';

  // 关键修复：强制禁止 X-Api-Key，解决 gpt-agent 报 401 的问题
  const shouldUseXApiKeyHeader = () => false;

  // 强制不生成 Plato/DeepSeek 特有的 prompt 字段
  const inferChatApiProfile = () => 'generic-openai';

  // 构建纯净的流式请求头
  const buildStreamingChatPayload = ({ baseUrl, model, messages }) => {
    return {
      model: normalizeText(model),
      messages: Array.isArray(messages) ? messages : [],
      stream: true,
    };
  };

  const buildConnectivityTestPayload = ({ baseUrl, model }) => {
    return {
      model: normalizeText(model),
      messages: [
        { role: 'user', content: 'hello world' },
      ],
      max_tokens: 10,
    };
  };

  return {
    DEFAULT_PLATO_BASE_URL: '',
    DEFAULT_PLATO_CHAT_MODELS: [],
    OPENAI_COMPATIBLE_PRESETS: {},
    normalizeText,
    normalizeBaseUrlForStorage,
    buildChatCompletionsEndpoint,
    sanitizeModelList,
    resolveChatModels,
    resolveSummaryLLM,
    inferProviderType,
    getOpenAICompatiblePreset: () => null,
    inferChatApiProfile,
    shouldUseXApiKeyHeader,
    buildStreamingChatPayload,
    buildConnectivityTestPayload,
  };
});
