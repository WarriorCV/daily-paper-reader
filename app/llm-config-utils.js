(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.DPRLLMConfigUtils = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // 1. 强制设定你的配置
  const MY_CONFIG = {
    baseUrl: 'https://gpt-agent.cc/v1',
    model: 'MiniMax-M2.7',
    apiKey: ''
  };

  const normalizeText = (value) => String(value || '').trim();

  // 改进的路径处理，防止 /v1/v1 出现
  const normalizeBaseUrlForStorage = (value) => {
    let text = normalizeText(value || MY_CONFIG.baseUrl).replace(/\/+$/g, '');
    text = text.replace(/\/chat\/completions$/i, '');
    return text;
  };

  const buildChatCompletionsEndpoint = (value) => {
    const normalized = normalizeBaseUrlForStorage(value);
    // 如果已经包含 v1，直接拼接
    if (/\/v\d+$/i.test(normalized)) {
      return `${normalized}/chat/completions`;
    }
    return `${normalized}/v1/chat/completions`;
  };

  const resolveChatModels = () => {
    return [{
      name: MY_CONFIG.model,
      apiKey: MY_CONFIG.apiKey,
      baseUrl: normalizeBaseUrlForStorage(MY_CONFIG.baseUrl),
    }];
  };

  const resolveSummaryLLM = () => {
    return {
      baseUrl: normalizeBaseUrlForStorage(MY_CONFIG.baseUrl),
      apiKey: MY_CONFIG.apiKey,
      model: MY_CONFIG.model
    };
  };

  const inferProviderType = () => 'openai-compatible';

  // 关键修改：强制返回 false，确保使用 "Authorization: Bearer" 而不是 "X-Api-Key"
  // 这是解决 401 无效令牌的核心
  const shouldUseXApiKeyHeader = () => false;

  const inferChatApiProfile = () => 'generic-openai';

  const buildStreamingChatPayload = ({ messages }) => {
    return {
      model: MY_CONFIG.model,
      messages: Array.isArray(messages) ? messages : [],
      stream: true,
      // 移除可能导致中转站报错的额外字段
    };
  };

  const buildConnectivityTestPayload = () => {
    return {
      model: MY_CONFIG.model,
      messages: [
        { role: 'user', content: 'hello' },
      ],
      max_tokens: 10,
    };
  };

  return {
    DEFAULT_PLATO_BASE_URL: MY_CONFIG.baseUrl,
    DEFAULT_PLATO_CHAT_MODELS: [MY_CONFIG.model],
    OPENAI_COMPATIBLE_PRESETS: {},
    normalizeText,
    normalizeBaseUrlForStorage,
    buildChatCompletionsEndpoint,
    sanitizeModelList: () => [MY_CONFIG.model],
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
