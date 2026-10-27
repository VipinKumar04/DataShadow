/**
 * DataShadow AI - Frontend Application
 * Vanilla JavaScript implementation following the Final API Contract v1.
 * Connects to the same-origin endpoint POST /api/analyze.
 * Strictly uses safe DOM APIs (textContent, createElement) to prevent XSS.
 * Validates responses, handles documented error codes, and renders safely.
 */

(function () {
  'use strict';

  // Constants & Thresholds
  const MAX_STRING_CODE_UNITS = 50000;
  const API_ENDPOINT = '/api/analyze';
  const EMPTY_DISCLOSURE_TEXT_EN = 'No explicit disclosure was identified in the supplied text; this does not prove the practice does not occur.';
  const EMPTY_DISCLOSURE_TEXT_HI = 'प्रदान किए गए पाठ में कोई स्पष्ट प्रकटीकरण नहीं पाया गया; यह साबित नहीं करता कि यह गतिविधि नहीं होती है।';

  // Documented Error Messages Mapping (English and Hindi)
  const ERROR_MESSAGES = {
    en: {
      INVALID_JSON: 'The request payload was malformed. Please verify your input and try again.',
      INVALID_INPUT: 'The privacy policy text is missing or invalid. Please provide valid text to analyze.',
      POLICY_TOO_LONG: 'The privacy policy text exceeds the maximum limit of 50,000 characters.',
      REQUEST_TOO_LARGE: 'The request body is too large. Please reduce the size of your input and try again.',
      UNSUPPORTED_MEDIA_TYPE: 'Unsupported request format. The server requires JSON content.',
      UNSUPPORTED_LANGUAGE: 'The selected language is not supported. Please choose English (en) or Hindi (hi).',
      RATE_LIMITED: 'Too many analysis requests. Please wait a few moments before trying again.',
      AI_INVALID_RESPONSE: 'The analysis service generated an unparseable response. Please retry.',
      AI_PROVIDER_UNAVAILABLE: 'The AI analysis service is currently unavailable. Please try again later.',
      AI_TIMEOUT: 'The analysis request timed out. Please try again with a shorter policy excerpt.',
      INTERNAL_SERVER_ERROR: 'An internal server error occurred while processing your request. Please try again.',
      NETWORK_ERROR: 'Unable to connect to the analysis service. Please verify your network connection or ensure the backend server is running.',
      MALFORMED_RESPONSE: 'Received an unexpected response shape from the server. Please try again.',
      DEFAULT_ERROR: 'An unexpected error occurred during analysis. Please try again.'
    },
    hi: {
      INVALID_JSON: 'अनुरोध डेटा अमान्य है। कृपया इनपुट की जाँच करें और पुनः प्रयास करें।',
      INVALID_INPUT: 'प्रदान किया गया नीति पाठ अमान्य या खाली है। कृपया मान्य पाठ दर्ज करें।',
      POLICY_TOO_LONG: 'नीति पाठ 50,000 वर्णों की अधिकतम सीमा से अधिक है।',
      REQUEST_TOO_LARGE: 'अनुरोध का आकार बहुत बड़ा है। कृपया पाठ को छोटा करें।',
      UNSUPPORTED_MEDIA_TYPE: 'असमर्थित अनुरोध प्रारूप। सर्वर को JSON सामग्री की आवश्यकता है।',
      UNSUPPORTED_LANGUAGE: 'चयनित भाषा समर्थित नहीं है। कृपया अंग्रेज़ी (en) या हिन्दी (hi) चुनें।',
      RATE_LIMITED: 'बहुत अधिक अनुरोध। कृपया पुनः प्रयास करने से पहले कुछ समय प्रतीक्षा करें।',
      AI_INVALID_RESPONSE: 'विश्लेषण सेवा से त्रुटिपूर्ण प्रतिक्रिया प्राप्त हुई। कृपया पुनः प्रयास करें।',
      AI_PROVIDER_UNAVAILABLE: 'AI विश्लेषण सेवा वर्तमान में अनुपलब्ध है। कृपया बाद में प्रयास करें।',
      AI_TIMEOUT: 'अनुरोध समय समाप्त (टाइमआउट)। कृपया छोटे पाठ के साथ पुनः प्रयास करें।',
      INTERNAL_SERVER_ERROR: 'सर्वर पर आंतरिक त्रुटि उत्पन्न हुई। कृपया पुनः प्रयास करें।',
      NETWORK_ERROR: 'विश्लेषण सेवा से कनेक्ट करने में असमर्थ। कृपया नेटवर्क कनेक्शन जांचें या बैकएंड सर्वर प्रारंभ करें।',
      MALFORMED_RESPONSE: 'सर्वर से अनपेक्षित प्रतिक्रिया प्राप्त हुई। कृपया पुनः प्रयास करें।',
      DEFAULT_ERROR: 'विश्लेषण के दौरान एक अनपेक्षित त्रुटि हुई। कृपया पुनः प्रयास करें।'
    }
  };

  // DOM Elements Cache
  const policyText = document.getElementById('policyText');
  const charCounter = document.getElementById('charCounter');
  const languageSelect = document.getElementById('languageSelect');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const validationAlert = document.getElementById('validationAlert');
  const loadingState = document.getElementById('loadingState');
  const resultsSection = document.getElementById('resultsSection');
  const resultLanguageBadge = document.getElementById('resultLanguageBadge');

  // Result Card Body Elements
  const bodySummary = document.getElementById('bodySummary');
  const bodyDataCollected = document.getElementById('bodyDataCollected');
  const bodySharing = document.getElementById('bodySharing');
  const bodyRetention = document.getElementById('bodyRetention');
  const bodyConcerns = document.getElementById('bodyConcerns');
  const bodyRecommendations = document.getElementById('bodyRecommendations');
  const bodyLimitations = document.getElementById('bodyLimitations');

  /**
   * Updates the character counter element based on textarea value length.
   * Tracks JavaScript string code units up to MAX_STRING_CODE_UNITS (50,000).
   */
  function updateCharacterCounter() {
    if (!policyText || !charCounter) return;

    const currentLength = policyText.value.length;
    charCounter.textContent = currentLength.toLocaleString() + ' / ' + MAX_STRING_CODE_UNITS.toLocaleString() + ' characters';

    // Visual boundary indicators
    if (currentLength >= MAX_STRING_CODE_UNITS) {
      charCounter.classList.add('limit-reached');
      charCounter.classList.remove('limit-near');
    } else if (currentLength >= MAX_STRING_CODE_UNITS * 0.9) {
      charCounter.classList.add('limit-near');
      charCounter.classList.remove('limit-reached');
    } else {
      charCounter.classList.remove('limit-near', 'limit-reached');
    }
  }

  /**
   * Safely empties all child nodes from a given parent element.
   * @param {HTMLElement} element
   */
  function clearElement(element) {
    if (!element) return;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  /**
   * Displays an accessible validation alert message.
   * @param {string} message
   */
  function showValidationError(message) {
    if (!validationAlert) return;
    clearElement(validationAlert);

    const textNode = document.createTextNode(message);
    validationAlert.appendChild(textNode);
    validationAlert.classList.remove('hidden');

    if (policyText) {
      policyText.focus();
    }
  }

  /**
   * Hides the validation alert element.
   */
  function hideValidationError() {
    if (!validationAlert) return;
    validationAlert.classList.add('hidden');
    clearElement(validationAlert);
  }

  /**
   * Creates an accessible empty disclosure disclaimer element.
   * Standardized text explaining that the absence of disclosure does not prove the practice does not occur.
   * @param {string} language
   * @returns {HTMLElement}
   */
  function createEmptyDisclosureNotice(language) {
    const box = document.createElement('div');
    box.className = 'empty-disclosure-box';

    const text = language === 'hi' ? EMPTY_DISCLOSURE_TEXT_HI : EMPTY_DISCLOSURE_TEXT_EN;
    box.textContent = text;
    return box;
  }

  /**
   * Creates a styled evidence excerpt callout block.
   * @param {string} evidenceText
   * @returns {HTMLElement}
   */
  function createEvidenceBox(evidenceText) {
    const box = document.createElement('div');
    box.className = 'evidence-box';

    const label = document.createElement('div');
    label.className = 'evidence-label';
    label.textContent = 'Policy Excerpt / Evidence:';

    const quote = document.createElement('blockquote');
    quote.className = 'evidence-quote';
    quote.textContent = '“' + evidenceText + '”';

    box.appendChild(label);
    box.appendChild(quote);
    return box;
  }

  /**
   * Resolves a user-friendly error message from an error code or response body.
   * Never exposes raw internal server traces.
   * @param {string|null} code
   * @param {string} language
   * @returns {string}
   */
  function resolveErrorMessage(code, language) {
    const langKey = language === 'hi' ? 'hi' : 'en';
    const dict = ERROR_MESSAGES[langKey] || ERROR_MESSAGES.en;

    if (code && dict[code]) {
      return dict[code];
    }
    return dict.DEFAULT_ERROR;
  }

  /**
   * Extracts a documented error code from response data.
   * @param {any} data
   * @returns {string|null}
   */
  function extractErrorCode(data) {
    if (!data) return null;

    if (typeof data === 'object') {
      if (data.error && typeof data.error === 'object' && data.error.code) {
        const c = String(data.error.code).toUpperCase();
        if (ERROR_MESSAGES.en[c]) return c;
      }
      if (data.error && typeof data.error === 'string') {
        const c = data.error.toUpperCase();
        if (ERROR_MESSAGES.en[c]) return c;
      }
      if (data.code && typeof data.code === 'string') {
        const c = data.code.toUpperCase();
        if (ERROR_MESSAGES.en[c]) return c;
      }
      if (data.message && typeof data.message === 'string') {
        const upper = data.message.toUpperCase();
        for (const code of Object.keys(ERROR_MESSAGES.en)) {
          if (upper.includes(code)) return code;
        }
      }
    }

    if (typeof data === 'string') {
      const upper = data.toUpperCase();
      for (const code of Object.keys(ERROR_MESSAGES.en)) {
        if (upper.includes(code)) return code;
      }
    }

    return null;
  }

  /**
   * Validates the structure of the API success response according to Final API Contract v1.
   * Response must have success: true and an analysis object with all seven required sections.
   * @param {any} data
   * @returns {boolean}
   */
  function validateAnalysisResponse(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }
    if (data.success !== true) {
      return false;
    }
    if (!data.analysis || typeof data.analysis !== 'object') {
      return false;
    }

    const a = data.analysis;
    const requiredKeys = ['summary', 'dataCollected', 'sharing', 'retention', 'concerns', 'recommendations', 'limitations'];
    for (let i = 0; i < requiredKeys.length; i++) {
      if (!(requiredKeys[i] in a)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Renders the 1. Summary card.
   * @param {string} summary
   * @param {string} language
   */
  function renderSummary(summary, language) {
    clearElement(bodySummary);
    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      bodySummary.appendChild(createEmptyDisclosureNotice(language));
      return;
    }
    const paragraph = document.createElement('p');
    paragraph.textContent = summary;
    bodySummary.appendChild(paragraph);
  }

  /**
   * Renders the 2. Data Collected card.
   * @param {Array} dataItems
   * @param {string} language
   */
  function renderDataCollected(dataItems, language) {
    clearElement(bodyDataCollected);
    if (!Array.isArray(dataItems) || dataItems.length === 0) {
      bodyDataCollected.appendChild(createEmptyDisclosureNotice(language));
      return;
    }

    const list = document.createElement('ul');
    list.className = 'findings-list';

    dataItems.forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'finding-item';

      if (typeof item === 'string') {
        li.textContent = item;
      } else if (item && typeof item === 'object') {
        if (item.category) {
          const title = document.createElement('div');
          title.className = 'finding-title';
          title.textContent = item.category;
          li.appendChild(title);
        }
        if (item.purpose || item.details) {
          const purpose = document.createElement('div');
          purpose.className = 'finding-desc';
          purpose.textContent = item.purpose || item.details;
          li.appendChild(purpose);
        }
        if (item.evidence) {
          li.appendChild(createEvidenceBox(item.evidence));
        }
      }

      list.appendChild(li);
    });

    bodyDataCollected.appendChild(list);
  }

  /**
   * Renders the 3. Third-Party Sharing card.
   * @param {Array} sharingItems
   * @param {string} language
   */
  function renderSharing(sharingItems, language) {
    clearElement(bodySharing);
    if (!Array.isArray(sharingItems) || sharingItems.length === 0) {
      bodySharing.appendChild(createEmptyDisclosureNotice(language));
      return;
    }

    const list = document.createElement('ul');
    list.className = 'findings-list';

    sharingItems.forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'finding-item';

      if (typeof item === 'string') {
        li.textContent = item;
      } else if (item && typeof item === 'object') {
        if (item.recipient || item.entity) {
          const title = document.createElement('div');
          title.className = 'finding-title';
          title.textContent = item.recipient || item.entity;
          li.appendChild(title);
        }
        if (item.purpose || item.details) {
          const desc = document.createElement('div');
          desc.className = 'finding-desc';
          desc.textContent = item.purpose || item.details;
          li.appendChild(desc);
        }
        if (item.evidence) {
          li.appendChild(createEvidenceBox(item.evidence));
        }
      }

      list.appendChild(li);
    });

    bodySharing.appendChild(list);
  }

  /**
   * Renders the 4. Data Retention card.
   * Supports array, string, and object shapes seamlessly.
   * @param {Array|Object|string} retentionData
   * @param {string} language
   */
  function renderRetention(retentionData, language) {
    clearElement(bodyRetention);
    if (!retentionData) {
      bodyRetention.appendChild(createEmptyDisclosureNotice(language));
      return;
    }

    // Array format
    if (Array.isArray(retentionData)) {
      if (retentionData.length === 0) {
        bodyRetention.appendChild(createEmptyDisclosureNotice(language));
        return;
      }
      const list = document.createElement('ul');
      list.className = 'findings-list';

      retentionData.forEach(function (item) {
        const li = document.createElement('li');
        li.className = 'finding-item';

        if (typeof item === 'string') {
          li.textContent = item;
        } else if (item && typeof item === 'object') {
          const textVal = item.policy || item.text || item.period || '';
          if (textVal) {
            const desc = document.createElement('div');
            desc.className = 'finding-desc';
            desc.textContent = textVal;
            li.appendChild(desc);
          }
          if (item.evidence) {
            li.appendChild(createEvidenceBox(item.evidence));
          }
        }
        list.appendChild(li);
      });
      bodyRetention.appendChild(list);
      return;
    }

    // String format
    if (typeof retentionData === 'string') {
      if (retentionData.trim().length === 0) {
        bodyRetention.appendChild(createEmptyDisclosureNotice(language));
        return;
      }
      const p = document.createElement('p');
      p.textContent = retentionData;
      bodyRetention.appendChild(p);
      return;
    }

    // Object format
    if (typeof retentionData === 'object') {
      const policyTextVal = retentionData.policy || retentionData.text || retentionData.period || '';
      if (policyTextVal) {
        const p = document.createElement('p');
        p.textContent = policyTextVal;
        bodyRetention.appendChild(p);
      } else {
        bodyRetention.appendChild(createEmptyDisclosureNotice(language));
      }

      if (retentionData.evidence) {
        bodyRetention.appendChild(createEvidenceBox(retentionData.evidence));
      }
    }
  }

  /**
   * Renders the 5. Privacy Concerns card with severity badges (low, medium, high) and evidence excerpts.
   * @param {Array} concernsList
   * @param {string} language
   */
  function renderConcerns(concernsList, language) {
    clearElement(bodyConcerns);
    if (!Array.isArray(concernsList) || concernsList.length === 0) {
      bodyConcerns.appendChild(createEmptyDisclosureNotice(language));
      return;
    }

    const container = document.createElement('div');
    container.className = 'concerns-list';

    concernsList.forEach(function (item) {
      const itemEl = document.createElement('div');
      itemEl.className = 'concern-item';

      const header = document.createElement('div');
      header.className = 'concern-header';

      const title = document.createElement('span');
      title.className = 'concern-text';
      title.textContent = item.concern || item.title || item.text || item.description || 'Identified Concern';

      const badge = document.createElement('span');
      const severity = (item.severity || 'low').toLowerCase();

      if (severity === 'high') {
        badge.className = 'badge badge-severity-high';
        badge.textContent = 'High Severity';
      } else if (severity === 'medium') {
        badge.className = 'badge badge-severity-medium';
        badge.textContent = 'Medium Severity';
      } else {
        badge.className = 'badge badge-severity-low';
        badge.textContent = 'Low Severity';
      }

      header.appendChild(title);
      header.appendChild(badge);
      itemEl.appendChild(header);

      if (item.evidence) {
        itemEl.appendChild(createEvidenceBox(item.evidence));
      }

      container.appendChild(itemEl);
    });

    bodyConcerns.appendChild(container);
  }

  /**
   * Renders the 6. Recommendations card.
   * @param {Array} recommendationsList
   * @param {string} language
   */
  function renderRecommendations(recommendationsList, language) {
    clearElement(bodyRecommendations);
    if (!Array.isArray(recommendationsList) || recommendationsList.length === 0) {
      bodyRecommendations.appendChild(createEmptyDisclosureNotice(language));
      return;
    }

    const ol = document.createElement('ol');
    ol.className = 'bullet-list';

    recommendationsList.forEach(function (rec) {
      const li = document.createElement('li');
      li.className = 'bullet-item';
      li.textContent = typeof rec === 'string' ? rec : (rec && rec.text ? rec.text : String(rec));
      ol.appendChild(li);
    });

    bodyRecommendations.appendChild(ol);
  }

  /**
   * Renders the 7. Limitations card.
   * @param {Array} limitationsList
   * @param {string} language
   */
  function renderLimitations(limitationsList, language) {
    clearElement(bodyLimitations);
    if (!Array.isArray(limitationsList) || limitationsList.length === 0) {
      bodyLimitations.appendChild(createEmptyDisclosureNotice(language));
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'bullet-list';

    limitationsList.forEach(function (lim) {
      const li = document.createElement('li');
      li.className = 'bullet-item';
      li.textContent = typeof lim === 'string' ? lim : (lim && lim.text ? lim.text : String(lim));
      ul.appendChild(li);
    });

    bodyLimitations.appendChild(ul);
  }

  /**
   * Safely populates all seven result cards from the validated API analysis object.
   * @param {Object} analysis
   * @param {string} selectedLang
   */
  function displayResults(analysis, selectedLang) {
    // Update language badge
    if (resultLanguageBadge) {
      resultLanguageBadge.textContent = selectedLang === 'hi' ? 'Language: हिन्दी (hi)' : 'Language: English (en)';
    }

    // Render all seven contract fields
    renderSummary(analysis.summary, selectedLang);
    renderDataCollected(analysis.dataCollected, selectedLang);
    renderSharing(analysis.sharing, selectedLang);
    renderRetention(analysis.retention, selectedLang);
    renderConcerns(analysis.concerns, selectedLang);
    renderRecommendations(analysis.recommendations, selectedLang);
    renderLimitations(analysis.limitations, selectedLang);

    // Make results section visible and set focus for accessibility
    if (resultsSection) {
      resultsSection.classList.remove('hidden');
      resultsSection.focus();
    }
  }

  /**
   * Handles the 'Analyze Policy' button click.
   * Performs client-side validation, transitions loading states, sends POST /api/analyze,
   * validates response, handles error codes, and renders results safely.
   */
  function handleAnalyzeClick() {
    hideValidationError();

    const inputText = policyText ? policyText.value : '';
    const trimmed = inputText.trim();
    const selectedLang = languageSelect ? languageSelect.value : 'en';

    // Empty or whitespace-only validation
    if (trimmed.length === 0) {
      const emptyMsg = selectedLang === 'hi'
        ? 'कृपया विश्लेषण का अनुरोध करने से पहले गोपनीयता नीति पाठ दर्ज करें।'
        : 'Please enter or paste privacy policy text before requesting analysis.';
      showValidationError(emptyMsg);
      if (resultsSection) {
        resultsSection.classList.add('hidden');
      }
      return;
    }

    // Code unit limit enforcement check (50,000 code units)
    if (inputText.length > MAX_STRING_CODE_UNITS) {
      const tooLongMsg = selectedLang === 'hi'
        ? 'नीति पाठ 50,000 वर्णों की अधिकतम सीमा से अधिक है। कृपया इनपुट छोटा करें।'
        : 'Policy text exceeds the maximum limit of 50,000 characters. Please shorten your input.';
      showValidationError(tooLongMsg);
      return;
    }

    // Transition to loading state and disable repeated submissions
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute('aria-busy', 'true');
    }
    if (clearBtn) {
      clearBtn.disabled = true;
    }
    if (resultsSection) {
      resultsSection.classList.add('hidden');
    }
    if (loadingState) {
      loadingState.classList.remove('hidden');
    }

    // Exact payload: only policyText and language
    const requestPayload = {
      policyText: inputText,
      language: selectedLang
    };

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    })
      .then(function (response) {
        return response.text().then(function (rawText) {
          let json = null;
          try {
            json = JSON.parse(rawText);
          } catch (e) {
            json = null;
          }
          return {
            ok: response.ok,
            status: response.status,
            data: json,
            rawText: rawText
          };
        });
      })
      .then(function (res) {
        if (!res.ok) {
          // Resolve error code
          let code = extractErrorCode(res.data);
          if (!code) {
            if (res.status === 413) code = 'REQUEST_TOO_LARGE';
            else if (res.status === 415) code = 'UNSUPPORTED_MEDIA_TYPE';
            else if (res.status === 429) code = 'RATE_LIMITED';
            else if (res.status === 504) code = 'AI_TIMEOUT';
            else if (res.status === 503) code = 'AI_PROVIDER_UNAVAILABLE';
            else if (res.status >= 500) code = 'INTERNAL_SERVER_ERROR';
            else code = 'DEFAULT_ERROR';
          }
          const message = resolveErrorMessage(code, selectedLang);
          showValidationError(message);
          return;
        }

        // Validate success response structure
        if (!validateAnalysisResponse(res.data)) {
          const malformedMsg = resolveErrorMessage('MALFORMED_RESPONSE', selectedLang);
          showValidationError(malformedMsg);
          return;
        }

        // Render validated results
        displayResults(res.data.analysis, selectedLang);
      })
      .catch(function () {
        // Network failure / server unreachable - user input is preserved
        const netMsg = resolveErrorMessage('NETWORK_ERROR', selectedLang);
        showValidationError(netMsg);
      })
      .finally(function () {
        // Restore UI in every success/failure path
        if (loadingState) {
          loadingState.classList.add('hidden');
        }
        if (analyzeBtn) {
          analyzeBtn.disabled = false;
          analyzeBtn.removeAttribute('aria-busy');
        }
        if (clearBtn) {
          clearBtn.disabled = false;
        }
      });
  }

  /**
   * Clears the textarea, resets character count, hides errors, and clears results.
   */
  function handleClearClick() {
    if (policyText) {
      policyText.value = '';
      policyText.focus();
    }
    updateCharacterCounter();
    hideValidationError();
    if (resultsSection) {
      resultsSection.classList.add('hidden');
    }
    if (loadingState) {
      loadingState.classList.add('hidden');
    }
  }

  // Bind Event Listeners
  if (policyText) {
    policyText.addEventListener('input', updateCharacterCounter);
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', handleAnalyzeClick);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', handleClearClick);
  }

  // Initial Counter State
  updateCharacterCounter();
})();
