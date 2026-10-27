/**
 * DataShadow AI - Frontend Application
 * Vanilla JavaScript implementation following the Final API Contract v1.
 * Strictly uses safe DOM APIs (textContent, createElement) to prevent XSS.
 * Simulates analysis using mock fixtures; does not call backend or AI endpoints.
 */

(function () {
  'use strict';

  // Constants & Thresholds
  const MAX_STRING_CODE_UNITS = 50000;
  const SIMULATED_LATENCY_MS = 600;
  const EMPTY_DISCLOSURE_TEXT_EN = 'No explicit disclosure was identified in the supplied text; this does not prove the practice does not occur.';
  const EMPTY_DISCLOSURE_TEXT_HI = 'प्रदान किए गए पाठ में कोई स्पष्ट प्रकटीकरण नहीं पाया गया; यह साबित नहीं करता कि यह गतिविधि नहीं होती है।';

  // Mock Fixtures strictly conforming to Final API Contract v1
  // Seven top-level fields: summary, dataCollected, sharing, retention, concerns, recommendations, limitations
  const MOCK_FIXTURES = {
    en: {
      summary: 'This policy governs how user account information, device telemetry, and location records are processed. While essential data is collected for service delivery, continuous background location tracking and behavioral ad-targeting present notable privacy considerations.',
      dataCollected: [
        {
          category: 'Account Credentials & Contact Data',
          purpose: 'Account creation, identity verification, and transactional security.',
          evidence: 'When you register, we collect your name, email address, and verified phone number.'
        },
        {
          category: 'Precise Geolocation Data',
          purpose: 'Localized search functionality and personalized ad-targeting.',
          evidence: 'We collect precise GPS coordinates and sensor data from your device, including when the app is in the background.'
        },
        {
          category: 'Device Telemetry & Usage Logs',
          purpose: 'System performance monitoring, debugging, and analytics.',
          evidence: 'We automatically record device hardware models, operating system versions, and interaction timestamps.'
        }
      ],
      sharing: [
        {
          recipient: 'Analytics and Advertising Partners',
          purpose: 'Delivering interest-based advertising and cross-platform campaign measurement.',
          evidence: 'We share device identifiers and aggregated behavioral segments with verified marketing networks.'
        },
        {
          recipient: 'Cloud Infrastructure Service Providers',
          purpose: 'Secure data hosting, database redundancy, and compute infrastructure.',
          evidence: 'Data is stored on cloud servers managed by third-party hosting contractors bound by confidentiality.'
        }
      ],
      retention: {
        policy: 'Personal profile data is stored as long as your account remains open, plus an additional 90 days following formal deletion requests for fraud prevention.',
        evidence: 'We retain your personal information for the period necessary to fulfill account obligations, plus up to 90 days post-termination.'
      },
      concerns: [
        {
          severity: 'high',
          concern: 'Continuous Background Location Access',
          evidence: 'We collect precise GPS coordinates from your device even when the mobile app is not actively open on your screen.'
        },
        {
          severity: 'medium',
          concern: 'Third-Party Behavioral Ad Targeting',
          evidence: 'Your browsing habits and activity logs may be combined with external data sources for targeted marketing.'
        },
        {
          severity: 'low',
          concern: 'Automatic Policy Updates Without Prior Notice',
          evidence: 'We may modify this policy at our discretion; continued use signifies acceptance of updated terms.'
        }
      ],
      recommendations: [
        'Disable continuous background location access in your mobile operating system settings.',
        'Review device ad-tracking toggles and opt out of cross-site identifier sharing.',
        'Request export or deletion of your historical location telemetry via privacy settings.'
      ],
      limitations: [
        'DataShadow AI is an informational tool, not a substitute for professional legal advice.',
        'Analysis is strictly bounded by the explicit text provided in the input window.',
        'The absence of an explicit disclosure in the supplied text does not prove that a practice does not occur.'
      ]
    },
    hi: {
      summary: 'यह गोपनीयता नीति बताती है कि उपयोगकर्ता खाता जानकारी, डिवाइस टेलीमेट्री और स्थान रिकॉर्ड कैसे संसाधित होते हैं। आवश्यक सेवा संचालन के साथ-साथ निरंतर बैकग्राउंड लोकेशन ट्रैकिंग और लक्षित विज्ञापन चिंताजनक बिंदु हैं।',
      dataCollected: [
        {
          category: 'खाता क्रेडेंशियल्स और संपर्क डेटा',
          purpose: 'खाता निर्माण, पहचान सत्यापन और सुरक्षा।',
          evidence: 'पंजीकरण के समय, हम आपका नाम, ईमेल पता और सत्यापित फ़ोन नंबर एकत्र करते हैं।'
        },
        {
          category: 'सटीक भौगोलिक स्थान (GPS) डेटा',
          purpose: 'स्थानीयकृत सेवाएँ और लक्षित विज्ञापन।',
          evidence: 'हम आपके डिवाइस से सटीक GPS निर्देशांक एकत्र करते हैं, भले ही ऐप बैकग्राउंड में हो।'
        },
        {
          category: 'डिवाइस टेलीमेट्री और उपयोग लॉग',
          purpose: 'सिस्टम प्रदर्शन विश्लेषण और डिबगिंग।',
          evidence: 'हम स्वचालित रूप से डिवाइस मॉडल, ऑपरेटिंग सिस्टम और इंटरैक्शन टाइमस्टैम्प रिकॉर्ड करते हैं।'
        }
      ],
      sharing: [
        {
          recipient: 'विज्ञापन और एनालिटिक्स भागीदार',
          purpose: 'रुचि-आधारित विज्ञापनों का वितरण।',
          evidence: 'हम सत्यापित मार्केटिंग नेटवर्क के साथ डिवाइस पहचानकर्ता साझा करते हैं।'
        },
        {
          recipient: 'क्लाउड इन्फ्रास्ट्रक्चर प्रदाता',
          purpose: 'सुरक्षित होस्टिंग और डेटा भंडारण।',
          evidence: 'डेटा गोपनीयता समझौतों से बंधे तीसरे पक्ष के क्लाउड सर्वर पर संग्रहीत किया जाता है।'
        }
      ],
      retention: {
        policy: 'जब तक आपका खाता सक्रिय है, डेटा बनाए रखा जाता है, और खाता हटाने के बाद धोखाधड़ी रोकथाम हेतु 90 दिनों तक अतिरिक्त रखा जा सकता है।',
        evidence: 'हम खाता दायित्वों को पूरा करने के लिए आवश्यक अवधि तक और समाप्ति के बाद 90 दिनों तक डेटा सुरक्षित रखते हैं।'
      },
      concerns: [
        {
          severity: 'high',
          concern: 'सक्रिय बैकग्राउंड लोकेशन ट्रैकिंग',
          evidence: 'हम आपके डिवाइस से सटीक GPS डेटा एकत्र करते हैं, भले ही ऐप सक्रिय रूप से खुला न हो।'
        },
        {
          severity: 'medium',
          concern: 'व्यवहारिक विज्ञापन लक्ष्यीकरण',
          evidence: 'आपकी ब्राउज़िंग आदतों को बाहरी डेटा स्रोतों के साथ मिलाकर लक्षित विज्ञापन दिखाए जा सकते हैं।'
        },
        {
          severity: 'low',
          concern: 'पूर्व सूचना के बिना नीति परिवर्तन',
          evidence: 'हम अपने विवेक से इस नीति को संशोधित कर सकते हैं; निरंतर उपयोग को स्वीकृति माना जाएगा।'
        }
      ],
      recommendations: [
        'अपने डिवाइस की सेटिंग्स में जाकर बैकग्राउंड लोकेशन अनुमति को बंद करें।',
        'लक्षित विज्ञापन और ट्रैकिंग पहचानकर्ताओं को अस्वीकार (ऑप्ट-आउट) करें।',
        'खाता सेटिंग्स से अपने ऐतिहासिक स्थान रिकॉर्ड को हटाने का अनुरोध करें।'
      ],
      limitations: [
        'DataShadow AI केवल सूचनात्मक उपकरण है, यह कानूनी सलाह का विकल्प नहीं है।',
        'विश्लेषण पूरी तरह से उपयोगकर्ता द्वारा इनपुट किए गए पाठ पर आधारित है।',
        'प्रदान किए गए पाठ में किसी अभ्यास का उल्लेख न होना यह साबित नहीं करता कि वह अभ्यास नहीं किया जाता।'
      ]
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
        if (item.purpose) {
          const purpose = document.createElement('div');
          purpose.className = 'finding-desc';
          purpose.textContent = item.purpose;
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
        if (item.recipient) {
          const title = document.createElement('div');
          title.className = 'finding-title';
          title.textContent = item.recipient;
          li.appendChild(title);
        }
        if (item.purpose) {
          const desc = document.createElement('div');
          desc.className = 'finding-desc';
          desc.textContent = item.purpose;
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
   * @param {Object|string} retentionData
   * @param {string} language
   */
  function renderRetention(retentionData, language) {
    clearElement(bodyRetention);
    if (!retentionData) {
      bodyRetention.appendChild(createEmptyDisclosureNotice(language));
      return;
    }

    if (typeof retentionData === 'string') {
      const p = document.createElement('p');
      p.textContent = retentionData;
      bodyRetention.appendChild(p);
      return;
    }

    if (typeof retentionData === 'object') {
      const policyTextVal = retentionData.policy || retentionData.text || '';
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
   * Renders the 5. Privacy Concerns card with severity badges (low, medium, high) and evidence.
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
      title.textContent = item.concern || item.title || item.text || 'Identified Concern';

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
      li.textContent = rec;
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
      li.textContent = lim;
      ul.appendChild(li);
    });

    bodyLimitations.appendChild(ul);
  }

  /**
   * Safely populates all seven result cards using mock fixture data.
   * @param {string} selectedLang
   */
  function displayResults(selectedLang) {
    const fixture = MOCK_FIXTURES[selectedLang] || MOCK_FIXTURES.en;

    // Update language badge
    if (resultLanguageBadge) {
      resultLanguageBadge.textContent = selectedLang === 'hi' ? 'Language: हिन्दी (hi)' : 'Language: English (en)';
    }

    // Render all seven contract fields
    renderSummary(fixture.summary, selectedLang);
    renderDataCollected(fixture.dataCollected, selectedLang);
    renderSharing(fixture.sharing, selectedLang);
    renderRetention(fixture.retention, selectedLang);
    renderConcerns(fixture.concerns, selectedLang);
    renderRecommendations(fixture.recommendations, selectedLang);
    renderLimitations(fixture.limitations, selectedLang);

    // Make results section visible and set focus for accessibility
    if (resultsSection) {
      resultsSection.classList.remove('hidden');
      resultsSection.focus();
    }
  }

  /**
   * Handles the 'Analyze Policy' button click.
   * Performs client-side validation, transitions loading states, and renders mock results.
   */
  function handleAnalyzeClick() {
    hideValidationError();

    const inputText = policyText ? policyText.value : '';
    const trimmed = inputText.trim();

    // Empty or whitespace-only validation
    if (trimmed.length === 0) {
      showValidationError('Please enter or paste privacy policy text before requesting analysis.');
      if (resultsSection) {
        resultsSection.classList.add('hidden');
      }
      return;
    }

    // Code unit limit enforcement check
    if (inputText.length > MAX_STRING_CODE_UNITS) {
      showValidationError('Policy text exceeds the maximum limit of 50,000 characters. Please shorten your input.');
      return;
    }

    const selectedLang = languageSelect ? languageSelect.value : 'en';

    // Transition to loading state
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute('aria-busy', 'true');
    }
    if (resultsSection) {
      resultsSection.classList.add('hidden');
    }
    if (loadingState) {
      loadingState.classList.remove('hidden');
    }

    // Simulate async processing delay
    setTimeout(function () {
      if (loadingState) {
        loadingState.classList.add('hidden');
      }
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.removeAttribute('aria-busy');
      }

      displayResults(selectedLang);
    }, SIMULATED_LATENCY_MS);
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
