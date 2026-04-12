(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.DPRLLMConfigUtils = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // 1. 修改默认配置为你自己的 URL 和 模型
  const DEFAULT_PLATO_BASE_URL = 'https://gpt-agent.cc/v1';
  const DEFAULT_PLATO_CHAT_MODELS = [
    'mimo-v2-omni',
  ];
  
  const OPENAI_COMPATIBLE_PRESETS = Object.freeze({}); // 预设可以忽略清空

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
    return ['mimo-v2-omni']; // 强制只返回你的模型
  };

  // ==========================================
  // 2. 核心修改：强制全局使用你的 Chat 接口配置
  // ==========================================
  const resolveChatModels = (secret) => {
    const safeSecret = secret && typeof secret === 'object' ? secret : {};
    
    // 尝试获取用户在界面上填写的 API Key（保护隐私推荐做法）
    let apiKey = '';
    if (Array.isArray(safeSecret.chatLLMs) && safeSecret.chatLLMs[0]) {
        apiKey = safeSecret.chatLLMs[0].apiKey;
    }
    
    // 如果界面上没填，则强制使用你硬编码的 Key（⚠️注意公开仓库泄露风险）
    if (!apiKey) {
        apiKey = 'sk-f8bMKUmgQlZcCEpBGnGxEoba7gw4hsR9bbxeS8fa20lKL2nY'; 
    }

    return [{
      name: 'mimo-v2-omni',
      apiKey: apiKey,
      baseUrl: 'https://gpt-agent.cc/v1',
    }];
  };

  // ==========================================
  // 3. 核心修改：强制全局使用你的 Summary 接口配置
  // ==========================================
  const resolveSummaryLLM = (secret) => {
    const safeSecret = secret && typeof secret === 'object' ? secret : {};
    const summarized = safeSecret.summarizedLLM || {};
    
    let apiKey = normalizeText(summarized.apiKey || '');
    if (!apiKey) {
        apiKey = 'sk-f8bMKUmgQlZcCEpBGnGxEoba7gw4hsR9bbxeS8fa20lKL2nY';
    }

    return {
      baseUrl: 'https://gpt-agent.cc/v1',
      apiKey: apiKey,
      model: 'mimo-v2-omni'
    };
  };

  // 4. 强制指定为标准的 OpenAI 兼容模式
  const inferProviderType = () => {
    return 'openai-compatible';
  };

  const getOpenAICompatiblePreset = (key) => {
    return null;
  };

  // 避免触发其他模型的特殊 Prompt 逻辑
  const inferChatApiProfile = (baseUrl, model) => {
    return 'generic-openai';
  };

  const shouldUseXApiKeyHeader = () => {
    return true; 
  };

  // 组装标准的 OpenAI Stream 请求体
  const buildStreamingChatPayload = ({ baseUrl, model, messages }) => {
    return {
      model: 'mimo-v2-omni', // 强制写入你的模型
      messages: Array.isArray(messages) ? messages : [],
      stream: true,
    };
  };

  const buildConnectivityTestPayload = ({ baseUrl, model }) => {
    return {
      model: 'mimo-v2-omni',
      messages: [
        { role: 'system', content: 'Reply with exactly: hello world' },
        { role: 'user', content: 'hello world' },
      ],
      temperature: 0,
      max_tokens: 256,
    };
  };

  return {
    DEFAULT_PLATO_BASE_URL,
    DEFAULT_PLATO_CHAT_MODELS,
    OPENAI_COMPATIBLE_PRESETS,
    normalizeText,
    normalizeBaseUrlForStorage,
    buildChatCompletionsEndpoint,
    sanitizeModelList,
    resolveChatModels,
    resolveSummaryLLM,
    inferProviderType,
    getOpenAICompatiblePreset,
    inferChatApiProfile,
    shouldUseXApiKeyHeader,
    buildStreamingChatPayload,
    buildConnectivityTestPayload,
  };
});
