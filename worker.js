// Edge TTS API Proxy - Minimal Version with Test UI

const MAX_TEXT_LENGTH = 1200;
const TOKEN_REFRESH_BEFORE_EXPIRY = 5 * 60;
const OPENAI_VOICE_MAP = {
  shimmer: "zh-CN-XiaoxiaoNeural",
  alloy: "zh-CN-YunyangNeural",
  fable: "zh-CN-YunjianNeural",
  onyx: "zh-CN-XiaoyiNeural",
  nova: "zh-CN-YunxiNeural",
  echo: "zh-CN-liaoning-XiaobeiNeural",
};

const LANG_VOICES = {
  "zh": "zh-CN-XiaoxiaoNeural",
  "en": "en-US-JennyNeural",
  "fr": "fr-FR-DeniseNeural",
  "de": "de-DE-KatjaNeural",
  "pt": "pt-BR-FranciscaNeural",
  "es": "es-ES-ElviraNeural",
  "hi": "hi-IN-SwaraNeural",
  "ja": "ja-JP-NanamiNeural",
  "ko": "ko-KR-SunHiNeural",
  "ru": "ru-RU-SvetlanaNeural",
  "it": "it-IT-ElsaNeural",
  "nl": "nl-NL-ColetteNeural",
  "pl": "pl-PL-AgnieszkaNeural",
  "tr": "tr-TR-EmelNeural",
  "ar": "ar-SA-ZariyahNeural",
  "th": "th-TH-PremwadeeNeural",
  "vi": "vi-VN-HoaiMyNeural",
  "id": "id-ID-GadisNeural",
  "sv": "sv-SE-SofieNeural",
  "da": "da-DK-ChristelNeural",
  "fi": "fi-FI-SelmaNeural",
  "no": "nb-NO-IselinNeural",
  "el": "el-GR-AthinaNeural",
  "cs": "cs-CZ-VlastaNeural",
  "ro": "ro-RO-AlinaNeural",
  "hu": "hu-HU-NoemiNeural",
  "uk": "uk-UA-PolinaNeural",
  "he": "he-IL-HilaNeural",
  "ms": "ms-MY-YasminNeural",
  "ta": "ta-IN-PallaviNeural",
  "te": "te-IN-ShrutiNeural",
  "bn": "bn-IN-TanishaaNeural",
  "mr": "mr-IN-AarohiNeural",
  "gu": "gu-IN-DhwaniNeural",
  "kn": "kn-IN-SapnaNeural",
  "ml": "ml-IN-SobhanaNeural",
  "pa": "pa-IN-VaaniNeural",
  "yue": "yue-CN-XiaoMinNeural",
  "bg": "bg-BG-KalinaNeural",
  "hr": "hr-HR-GabrijelaNeural",
  "sk": "sk-SK-ViktoriaNeural",
  "sl": "sl-SI-PetraNeural",
  "et": "et-EE-AnuNeural",
  "lv": "lv-LV-EveritaNeural",
  "lt": "lt-LT-OnaNeural",
  "sr": "sr-RS-SophieNeural",
  "ca": "ca-ES-JoanaNeural",
  "fil": "fil-PH-BlessicaNeural",
};

const LOCALE_VOICES = {
  "zh-tw": "zh-TW-HsiaoChenNeural",
  "zh-hk": "zh-HK-HiuGaaiNeural",
  "en-gb": "en-GB-SoniaNeural",
  "en-au": "en-AU-NatashaNeural",
  "en-in": "en-IN-NeerjaNeural",
  "en-ca": "en-CA-ClaraNeural",
  "fr-ca": "fr-CA-SylvieNeural",
  "de-at": "de-AT-IngridNeural",
  "de-ch": "de-CH-LeniNeural",
  "pt-pt": "pt-PT-RaquelNeural",
  "es-mx": "es-MX-DaliaNeural",
  "ar-eg": "ar-EG-SalmaNeural",
  "nb-no": "nb-NO-IselinNeural",
};

const LANG_TO_LOCALE = {
  "zh": "zh-CN",
  "en": "en-US",
  "fr": "fr-FR",
  "de": "de-DE",
  "pt": "pt-BR",
  "es": "es-ES",
  "hi": "hi-IN",
  "ja": "ja-JP",
  "ko": "ko-KR",
  "ru": "ru-RU",
  "it": "it-IT",
  "nl": "nl-NL",
  "pl": "pl-PL",
  "tr": "tr-TR",
  "ar": "ar-SA",
  "th": "th-TH",
  "vi": "vi-VN",
  "id": "id-ID",
  "sv": "sv-SE",
  "da": "da-DK",
  "fi": "fi-FI",
  "no": "nb-NO",
  "el": "el-GR",
  "cs": "cs-CZ",
  "ro": "ro-RO",
  "hu": "hu-HU",
  "uk": "uk-UA",
  "he": "he-IL",
  "ms": "ms-MY",
  "ta": "ta-IN",
  "te": "te-IN",
  "bn": "bn-IN",
  "mr": "mr-IN",
  "gu": "gu-IN",
  "kn": "kn-IN",
  "ml": "ml-IN",
  "pa": "pa-IN",
  "yue": "yue-CN",
  "bg": "bg-BG",
  "hr": "hr-HR",
  "sk": "sk-SK",
  "sl": "sl-SI",
  "et": "et-EE",
  "lv": "lv-LV",
  "lt": "lt-LT",
  "sr": "sr-RS",
  "ca": "ca-ES",
  "fil": "fil-PH",
};

function inferLang(voiceName) {
  var match = voiceName && voiceName.match(/^([a-z]{2,3}-[A-Z]{2})/);
  return match ? match[1] : null;
}

function lookupVoice(langKey) {
  if (!langKey) return null;
  if (LOCALE_VOICES[langKey]) return LOCALE_VOICES[langKey];
  if (LANG_VOICES[langKey]) return LANG_VOICES[langKey];
  var shortCode = langKey.split("-")[0];
  if (shortCode !== langKey && LANG_VOICES[shortCode]) return LANG_VOICES[shortCode];
  return null;
}

function isPresetVoice(name) {
  return name && !!OPENAI_VOICE_MAP[name];
}

function resolveVoiceAndLang(model, voice, language) {
  var langLower = typeof language === "string" && language.trim() ? language.trim().toLowerCase() : "";
  var langVoice = lookupVoice(langLower);
  var finalVoice;

  if (voice && isPresetVoice(voice)) {
    if (langLower && langVoice) {
      finalVoice = langVoice;
    } else {
      finalVoice = OPENAI_VOICE_MAP[voice];
    }
  } else if (voice) {
    finalVoice = voice;
  } else if (langLower && langVoice) {
    finalVoice = langVoice;
  } else {
    if (model === "tts-1" || model === "tts-1-hd") {
      finalVoice = "zh-CN-XiaoxiaoNeural";
    } else if (model.startsWith("tts-1-")) {
      finalVoice = OPENAI_VOICE_MAP[model.replace("tts-1-", "")] || "zh-CN-XiaoxiaoNeural";
    } else {
      finalVoice = model || "zh-CN-XiaoxiaoNeural";
    }
  }

  var xmlLang;
  if (langLower && LANG_TO_LOCALE[langLower]) {
    xmlLang = LANG_TO_LOCALE[langLower];
  } else if (langLower && /^[a-z]{2,3}-[a-z]{2,3}$/.test(langLower)) {
    var parts = langLower.split("-");
    xmlLang = parts[0].toLowerCase() + "-" + parts[1].toUpperCase();
  } else {
    xmlLang = inferLang(finalVoice) || "zh-CN";
  }

  return { voice: finalVoice, lang: xmlLang };
}

let tokenInfo = { endpoint: null, token: null, expiredAt: null };

function generateUserIdFromDomain(requestUrl) {
  try {
    var url = new URL(requestUrl);
    var domain = url.hostname;
    var hash = 0;
    for (var i = 0; i < domain.length; i++) {
      hash = (hash << 5) - hash + domain.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, "0") + Math.abs(hash * 31).toString(16).padStart(8, "0");
  } catch (e) {
    return "0f04d16a175c411e";
  }
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  var result = 0;
  for (var i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export default {
  async fetch(request, env) {
    if (env.API_KEY) globalThis.API_KEY = env.API_KEY;
    if (env.MAX_TEXT_LENGTH) globalThis.MAX_TEXT_LENGTH = parseInt(env.MAX_TEXT_LENGTH, 10);
    return await handleRequest(request);
  },
};

async function handleRequest(request) {
  var url = new URL(request.url);

  if (url.pathname === "/" || url.pathname === "/index.html") {
    return errorResponse("Not Found", 404, "not_found");
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (url.pathname.startsWith("/v1/")) {
    var authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Missing or invalid authorization header.", 401, "invalid_api_key");
    }
    var providedKey = authHeader.slice(7);
    if (globalThis.API_KEY) {
      if (!timingSafeEqual(providedKey, globalThis.API_KEY)) {
        return errorResponse("Invalid API key.", 403, "invalid_api_key");
      }
    } else {
      return errorResponse("API key not configured on server.", 500, "server_config_error");
    }
  }

  try {
    if (url.pathname === "/v1/audio/speech") return await handleSpeechRequest(request);
    if (url.pathname === "/v1/models") return handleModelsRequest();
  } catch (err) {
    return errorResponse(err.message, 500, "internal_server_error");
  }

  return errorResponse("Not Found", 404, "not_found");
}

async function handleSpeechRequest(request) {
  if (request.method !== "POST") return errorResponse("Method Not Allowed", 405, "method_not_allowed");

  var body = await request.json();
  if (!body.input) return errorResponse("'input' is a required parameter.", 400, "invalid_request_error");

  var maxLength = globalThis.MAX_TEXT_LENGTH || MAX_TEXT_LENGTH;
  if (body.input.length > maxLength) {
    return errorResponse(
      "Input text exceeds maximum length of " + maxLength + " characters. Current: " + body.input.length,
      400,
      "text_too_long"
    );
  }

  var model = body.model || "tts-1";
  var input = body.input;
  var voice = body.voice;
  var speed = body.speed !== undefined ? body.speed : 1.0;
  var pitch = body.pitch !== undefined ? body.pitch : 1.0;
  var style = body.style || "general";
  var role = body.role || "";
  var styleDegree = body.styleDegree !== undefined ? body.styleDegree : 1.0;
  var stream = body.stream || false;
  var language = typeof body.language === "string" ? body.language.trim() : "";
  var cleaning_options = body.cleaning_options || {};

  var resolved = resolveVoiceAndLang(model, voice, language);
  var finalVoice = resolved.voice;
  var xmlLang = resolved.lang;

  var opts = {
    remove_markdown: cleaning_options.remove_markdown !== undefined ? cleaning_options.remove_markdown : true,
    remove_emoji: cleaning_options.remove_emoji !== undefined ? cleaning_options.remove_emoji : true,
    remove_urls: cleaning_options.remove_urls !== undefined ? cleaning_options.remove_urls : true,
    remove_line_breaks: cleaning_options.remove_line_breaks || false,
    remove_citation_numbers: cleaning_options.remove_citation_numbers !== undefined ? cleaning_options.remove_citation_numbers : true,
    custom_keywords: cleaning_options.custom_keywords || "",
  };
  var cleanedInput = cleanText(input, opts);
  if (!cleanedInput) {
    return errorResponse("Input text is empty after cleaning.", 400, "invalid_request_error");
  }
  var rate = ((speed - 1) * 100).toFixed(0);
  var numPitch = ((pitch - 1) * 100).toFixed(0);
  var outputFormat = "audio-24khz-48kbitrate-mono-mp3";

  if (stream) {
    return await getVoiceStream(cleanedInput, finalVoice, rate, numPitch, style, role, styleDegree, outputFormat, xmlLang, request);
  }
  return await getVoice(cleanedInput, finalVoice, rate, numPitch, style, role, styleDegree, outputFormat, xmlLang, request);
}

function handleModelsRequest() {
  var models = [
    { id: "tts-1", object: "model", created: Date.now(), owned_by: "openai" },
    { id: "tts-1-hd", object: "model", created: Date.now(), owned_by: "openai" },
  ];
  var keys = Object.keys(OPENAI_VOICE_MAP);
  for (var i = 0; i < keys.length; i++) {
    models.push({
      id: "tts-1-" + keys[i],
      object: "model",
      created: Date.now(),
      owned_by: "openai",
    });
  }
  return new Response(JSON.stringify({ object: "list", data: models }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

// 智能分块：按句子边界切分，避免硬切
function splitTextIntoChunks(text, maxChunkSize) {
  var chunks = [];
  var sentenceBreaks = ["。", "！", "？", "；", "…", ".", "!", "?", "\n"];

  while (text.length > 0) {
    if (text.length <= maxChunkSize) {
      chunks.push(text);
      break;
    }

    var chunk = text.slice(0, maxChunkSize);
    var lastBreakIndex = -1;

    // 从后往前找句子边界
    for (var i = chunk.length - 1; i >= Math.floor(maxChunkSize * 0.5); i--) {
      var found = false;
      for (var j = 0; j < sentenceBreaks.length; j++) {
        if (chunk[i] === sentenceBreaks[j]) {
          lastBreakIndex = i;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (lastBreakIndex > 0) {
      chunks.push(text.slice(0, lastBreakIndex + 1));
      text = text.slice(lastBreakIndex + 1);
    } else {
      // 找不到句子边界，硬切
      chunks.push(chunk);
      text = text.slice(maxChunkSize);
    }
  }

  return chunks;
}

async function getVoice(text, voiceName, rate, pitch, style, role, styleDegree, outputFormat, xmlLang, request) {
  var chunks = splitTextIntoChunks(text, 2000);
  var audioChunks = [];

  for (var i = 0; i < chunks.length; i++) {
    var blob = await getAudioChunk(chunks[i], voiceName, rate, pitch, style, role, styleDegree, outputFormat, xmlLang, request);
    audioChunks.push(blob);
  }

  return new Response(new Blob(audioChunks, { type: "audio/mpeg" }), {
    headers: { "Content-Type": "audio/mpeg", "Access-Control-Allow-Origin": "*" },
  });
}

async function getVoiceStream(text, voiceName, rate, pitch, style, role, styleDegree, outputFormat, xmlLang, request) {
  var chunks = splitTextIntoChunks(text, 2000);
  var transform = new TransformStream();
  var writer = transform.writable.getWriter();

  (async function () {
    try {
      for (var i = 0; i < chunks.length; i++) {
        var blob = await getAudioChunk(chunks[i], voiceName, rate, pitch, style, role, styleDegree, outputFormat, xmlLang, request);
        var buffer = await blob.arrayBuffer();
        await writer.write(new Uint8Array(buffer));
      }
    } catch (e) {
      await writer.abort(e);
    } finally {
      await writer.close();
    }
  })();

  return new Response(transform.readable, {
    headers: { "Content-Type": "audio/mpeg", "Access-Control-Allow-Origin": "*" },
  });
}

async function getAudioChunk(text, voiceName, rate, pitch, style, role, styleDegree, outputFormat, xmlLang, request) {
  var endpoint = await getEndpoint(request);
  var url = "https://" + endpoint.r + ".tts.speech.microsoft.com/cognitiveservices/v1";
  var escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  var content = '<prosody rate="' + rate + '%" pitch="' + pitch + '%">' + escaped + "</prosody>";
  if (style && style !== "general") {
    var attr = styleDegree !== 1.0 ? ' styledegree="' + styleDegree + '"' : "";
    content = '<mstts:express-as style="' + style + '"' + attr + ">" + content + "</mstts:express-as>";
  } else if (role) {
    content = '<mstts:express-as role="' + role + '">' + content + "</mstts:express-as>";
  }

  var ssml =
    '<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="' +
    xmlLang +
    '"><voice name="' +
    voiceName +
    '">' +
    content +
    "</voice></speak>";

  var res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: endpoint.t,
      "Content-Type": "application/ssml+xml",
      "User-Agent": "okhttp/4.5.0",
      "X-Microsoft-OutputFormat": outputFormat,
    },
    body: ssml,
  });
  if (!res.ok) {
    throw new Error("Edge TTS API error: " + res.status);
  }
  return res.blob();
}

async function getEndpoint(request) {
  var now = Date.now() / 1000;

  // 检查缓存的 token 是否有效
  if (tokenInfo.token && tokenInfo.expiredAt && now < tokenInfo.expiredAt - TOKEN_REFRESH_BEFORE_EXPIRY) {
    return tokenInfo.endpoint;
  }

  var endpointUrl = "https://dev.microsofttranslator.com/apps/endpoint?api-version=1.0";
  var clientId = crypto.randomUUID().replace(/-/g, "");
  var userId = generateUserIdFromDomain(request.url);
  var lastError = null;

  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      var res = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Accept-Language": "zh-Hans",
          "X-ClientVersion": "4.0.530a 5fe1dc6c",
          "X-UserId": userId,
          "X-HomeGeographicRegion": "zh-Hans-CN",
          "X-ClientTraceId": clientId,
          "X-MT-Signature": await sign(endpointUrl),
          "User-Agent": "okhttp/4.5.0",
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": "0",
          "Accept-Encoding": "gzip",
        },
      });
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      var data = await res.json();
      var jwt = JSON.parse(atob(data.t.split(".")[1]));
      tokenInfo = { endpoint: data, token: data.t, expiredAt: jwt.exp };
      return data;
    } catch (e) {
      lastError = e;
      if (attempt < 3) {
        await new Promise(function (r) {
          setTimeout(r, 1000 * attempt);
        });
      }
    }
  }

  // 所有重试都失败后的兜底逻辑
  if (tokenInfo.token) {
    // 强制标记为过期，下次请求会重新刷新
    tokenInfo.expiredAt = 0;
    return tokenInfo.endpoint;
  }

  throw new Error("Failed to get endpoint: " + (lastError ? lastError.message : "unknown"));
}

async function sign(urlStr) {
  var url = urlStr.split("://")[1];
  var encodedUrl = encodeURIComponent(url);
  var uuid = crypto.randomUUID().replace(/-/g, "");
  var date = new Date().toUTCString().replace(/GMT/, "").trim() + " GMT";
  var toSign = ("MSTranslatorAndroidApp" + encodedUrl + date + uuid).toLowerCase();
  var keyStr = "oik6PdDdMnOXemTbwvMn9de/h9lFnfBaCWbGMMZqqoSaQaqUOqjVGm5NqsmjcBI1x+sS9ugjB55HEJWRiFXYFw==";
  var keyBytes = Uint8Array.from(atob(keyStr), function (c) {
    return c.charCodeAt(0);
  });
  var cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  var sigBytes = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(toSign)));
  var sig = btoa(String.fromCharCode.apply(null, sigBytes));
  return "MSTranslatorAndroidApp::" + sig + "::" + date + "::" + uuid;
}

function cleanText(text, opts) {
  var t = text;
  if (opts.remove_urls) {
    t = t.replace(/(https?:\/\/[^\s]+)/g, "");
  }
  if (opts.remove_markdown) {
    t = t
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
      .replace(/#{1,6}\s/g, "");
  }
  if (opts.custom_keywords) {
    var kw = opts.custom_keywords
      .split(",")
      .map(function (k) {
        return k.trim();
      })
      .filter(function (k) {
        return k;
      });
    if (kw.length) {
      var pattern = kw
        .map(function (k) {
          return k.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        })
        .join("|");
      t = t.replace(new RegExp(pattern, "g"), "");
    }
  }
  if (opts.remove_emoji) {
    t = t.replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ""
    );
  }
  if (opts.remove_citation_numbers) {
    t = t.replace(/\[\d+\]/g, "").replace(/【\d+】/g, "");
  }
  if (opts.remove_line_breaks) {
    t = t.replace(/(\r\n|\n|\r)/gm, "");
    return t.trim().replace(/\s+/g, " ");
  }
  return t.trim().replace(/[ \t]+/g, " ");
}

function errorResponse(message, status, code) {
  return new Response(JSON.stringify({ error: { message: message, type: "api_error", code: code } }), {
    status: status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

