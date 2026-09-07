(function ($) {
    const sharedConverters = {
        escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },
        sanitizeUrl(url) {
            const trimmed = String(url || '').trim();

            if (trimmed === '') {
                return '';
            }

            if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) {
                return trimmed;
            }

            return '#';
        },
        renderImageAttrs(attributes) {
            const htmlAttrs = [];
            const classRules = ['img-fluid'];
            const styleRules = [];
            const source = String(attributes || '');

            const valuePattern = '(?:"(\\d+|auto)"|&quot;(\\d+|auto)&quot;|\'(\\d+|auto)\'|&#39;(\\d+|auto)&#39;|(\\d+|auto))';
            const alignPattern = '(?:"(left|right|center|none)"|&quot;(left|right|center|none)&quot;|\'(left|right|center|none)\'|&#39;(left|right|center|none)&#39;|(left|right|center|none))';

            const widthMatch = source.match(new RegExp('(?:^|\\s)width\\s*=\\s*' + valuePattern + '(?:\\s|$)', 'i'));
            const heightMatch = source.match(new RegExp('(?:^|\\s)height\\s*=\\s*' + valuePattern + '(?:\\s|$)', 'i'));
            const alignMatch = source.match(new RegExp('(?:^|\\s)align\\s*=\\s*' + alignPattern + '(?:\\s|$)', 'i'));

            if (widthMatch) {
                const width = widthMatch.slice(1).find(Boolean).toLowerCase();

                if (width === 'auto') {
                    styleRules.push('width:auto');
                } else {
                    htmlAttrs.push(`width="${sharedConverters.escapeHtml(width)}"`);
                    styleRules.push(`width:${sharedConverters.escapeHtml(width)}px`);
                }
            }

            if (heightMatch) {
                const height = heightMatch.slice(1).find(Boolean).toLowerCase();

                if (height === 'auto') {
                    styleRules.push('height:auto');
                } else {
                    htmlAttrs.push(`height="${sharedConverters.escapeHtml(height)}"`);
                    styleRules.push(`height:${sharedConverters.escapeHtml(height)}px`);
                }
            }

            if (alignMatch) {
                const align = alignMatch.slice(1).find(Boolean).toLowerCase();

                if (align === 'left') {
                    styleRules.push('float:left', 'margin-right:1rem', 'margin-bottom:.5rem');
                } else if (align === 'right') {
                    styleRules.push('float:right', 'margin-left:1rem', 'margin-bottom:.5rem');
                } else if (align === 'center') {
                    classRules.push('d-block', 'mx-auto');
                }
            }

            if (classRules.length > 0) {
                htmlAttrs.push(`class="${classRules.join(' ')}"`);
            }

            if (styleRules.length > 0) {
                htmlAttrs.push(`style="${styleRules.join(';')}"`);
            }

            return htmlAttrs.length === 0 ? '' : ' ' + htmlAttrs.join(' ');
        },
        renderMarkdownImageAttrs(node) {
            const attrs = [];

            const width = String(node.getAttribute('width') || '').trim();
            const height = String(node.getAttribute('height') || '').trim();

            const styleWidth = node.style && node.style.width ? node.style.width.trim().toLowerCase() : '';
            const styleHeight = node.style && node.style.height ? node.style.height.trim().toLowerCase() : '';
            const styleFloat = node.style && node.style.float ? node.style.float.trim().toLowerCase() : '';

            if (/^\d+$/.test(width)) {
                attrs.push(`width=${width}`);
            } else if (styleWidth === 'auto') {
                attrs.push('width=auto');
            } else if (/^\d+px$/.test(styleWidth)) {
                attrs.push(`width=${styleWidth.replace('px', '')}`);
            }

            if (/^\d+$/.test(height)) {
                attrs.push(`height=${height}`);
            } else if (styleHeight === 'auto') {
                attrs.push('height=auto');
            } else if (/^\d+px$/.test(styleHeight)) {
                attrs.push(`height=${styleHeight.replace('px', '')}`);
            }

            if (styleFloat === 'left' || styleFloat === 'right') {
                attrs.push(`align=${styleFloat}`);
            } else if (
                node.classList &&
                node.classList.contains('d-block') &&
                node.classList.contains('mx-auto')
            ) {
                attrs.push('align=center');
            }

            return attrs.length === 0 ? '' : `{${attrs.join(' ')}}`;
        },
        normalizeCodeLanguage(language) {
            const aliases = {
                js: 'javascript',
                ts: 'typescript',
                sh: 'bash',
                shell: 'bash',
                py: 'python',
                rb: 'ruby',
                html: 'markup',
                xml: 'markup'
            };
            const normalized = String(language || '').trim().toLowerCase();

            if (!/^[a-z0-9_+.#-]+$/.test(normalized)) {
                return '';
            }

            return aliases[normalized] || normalized;
        },
        getCodeCopyText() {
            const translations = window.bsMarkdownEditorTranslations && typeof window.bsMarkdownEditorTranslations === 'object'
                ? window.bsMarkdownEditorTranslations
                : {};
            const copyCode = translations.actions && typeof translations.actions.copyCode === 'string'
                ? translations.actions.copyCode
                : '';

            return copyCode || 'Copy code';
        },
        getCodeLanguageFromClass(className) {
            const match = String(className || '').match(/(?:^|\s)(?:language|lang)-([a-z0-9_+.#-]+)(?:\s|$)/i);
            return match ? sharedConverters.normalizeCodeLanguage(match[1]) : '';
        },
        getCodeKeywordMap() {
            return {
                bash: 'alias case cd do done elif else esac export fi for function if in local readonly return set shift then unset until while',
                css: 'align-items animation background border bottom color content display flex font gap grid height justify-content left margin max-width min-height opacity overflow padding position right top transform transition width z-index',
                javascript: 'async await break case catch class const continue default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while yield',
                json: 'false null true',
                markup: 'a article aside body button code div footer form h1 h2 h3 h4 h5 h6 head header html img input label li link main meta nav ol option p pre script section select span style table tbody td textarea th thead title tr ul',
                php: 'abstract and array as bool boolean break callable case catch class clone const continue declare default die do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum eval exit extends false final finally float fn for foreach function global if implements include include_once int integer instanceof insteadof interface isset iterable list match mixed namespace never new null object or parent print private protected public readonly real require require_once return self static string switch throw trait true try unset use var void while xor yield',
                python: 'and as assert async await break class continue def del elif else except false finally for from global if import in is lambda none nonlocal not or pass raise return true try while with yield',
                sql: 'alter and as by case create delete desc distinct drop else exists from group having in inner insert into is join left like limit not null on or order outer right select set table then union update values when where',
                typescript: 'abstract any as async await boolean break case catch class const constructor continue declare default delete do else enum export extends false finally for from function if implements import in infer instanceof interface keyof let module namespace never new null number object of private protected public readonly return static string super switch symbol this throw true try type typeof undefined unknown var void while yield'
            };
        },
        isKnownCodeLanguage(language) {
            const normalizedLanguage = sharedConverters.normalizeCodeLanguage(language);
            return normalizedLanguage !== '' && Object.prototype.hasOwnProperty.call(sharedConverters.getCodeKeywordMap(), normalizedLanguage);
        },
        highlightCode(code, language) {
            const normalizedLanguage = sharedConverters.normalizeCodeLanguage(language);

            const keywordMap = sharedConverters.getCodeKeywordMap();

            if (normalizedLanguage === '' || !keywordMap[normalizedLanguage]) {
                return sharedConverters.escapeHtml(code);
            }

            const sourceCode = String(code || '');
            const keywordSource = keywordMap[normalizedLanguage];
            const keywords = keywordSource.split(/\s+/).sort(function (a, b) {
                return b.length - a.length;
            }).join('|');
            const keywordPattern = new RegExp('^(?:' + keywords + ')$', 'i');
            const hashCommentLanguages = ['bash', 'php', 'python', 'ruby', 'perl'];
            const hashCommentPattern = hashCommentLanguages.indexOf(normalizedLanguage) !== -1 ? '|#[^\\n]*' : '';
            const phpTypeNamePattern = '\\??\\\\?[a-zA-Z_][\\w]*(?:\\\\[a-zA-Z_][\\w]*)*';
            const phpTypePattern = normalizedLanguage === 'php' ? '|' + phpTypeNamePattern + '(?=\\s*(?:[|&]|\\$))' : '';
            const phpReturnTypePattern = normalizedLanguage === 'php' ? '|:\\s*' + phpTypeNamePattern + '(?:\\s*[|&]\\s*' + phpTypeNamePattern + ')*' : '';
            const phpBuiltinTypePattern = /^(?:array|bool|boolean|callable|false|float|int|integer|iterable|mixed|never|null|object|parent|real|self|static|string|true|void)$/i;
            const phpCastPattern = normalizedLanguage === 'php' ? '|\\(\\s*(?:array|bool|boolean|double|float|int|integer|object|real|string|unset)\\s*\\)' : '';
            const phpHeredocPattern = normalizedLanguage === 'php' ? '<<<[ \\t]*(?:[a-zA-Z_][\\w]*|\\\'[a-zA-Z_][\\w]*\\\')\\r?\\n[\\s\\S]*?\\r?\\n\\s*[a-zA-Z_][\\w]*;?|' : '';
            const phpTagPattern = normalizedLanguage === 'php' ? '<\\?(?:php|=)?|\\?>|' : '';
            const tokenPattern = new RegExp(
                phpHeredocPattern +
                phpTagPattern +
                '\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*' + hashCommentPattern +
                '|"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|`(?:\\\\.|[^`\\\\])*`' +
                '|\\$[a-zA-Z_][\\w]*' +
                '|\\b[a-zA-Z_$][\\w$]*\\b(?=\\s*\\()' +
                phpReturnTypePattern +
                phpCastPattern +
                phpTypePattern +
                '|\\b(?:' + keywords + ')\\b' +
                '|(?<![\\w.])(?:\\d+\\.\\d*|\\.\\d+|\\d+)(?![\\w.])',
                'gi'
            );
            let highlighted = '';
            let lastIndex = 0;

            sourceCode.replace(tokenPattern, function (token, offset) {
                highlighted += sharedConverters.escapeHtml(sourceCode.slice(lastIndex, offset));
                lastIndex = offset + token.length;
                const followingSource = sourceCode.slice(lastIndex);

                if (normalizedLanguage === 'php' && /^(?:<\?(?:php|=)?|\?>)$/i.test(token)) {
                    highlighted += `<span class="text-danger fw-semibold">${sharedConverters.escapeHtml(token)}</span>`;
                } else if (/^(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*)$/.test(token)) {
                    highlighted += normalizedLanguage === 'php' && /^\/\*\*/.test(token)
                        ? sharedConverters.renderPhpDocComment(token)
                        : `<span class="text-white-50 fst-italic">${sharedConverters.escapeHtml(token)}</span>`;
                } else if (normalizedLanguage === 'php' && /^<<<[ \t]*(?:[a-zA-Z_][\w]*|'[a-zA-Z_][\w]*')\r?\n[\s\S]*?\r?\n\s*[a-zA-Z_][\w]*;?$/.test(token)) {
                    highlighted += sharedConverters.renderPhpStringToken(token);
                } else if (/^(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)$/.test(token)) {
                    highlighted += normalizedLanguage === 'php'
                        ? sharedConverters.renderPhpStringToken(token)
                        : `<span class="text-success">${sharedConverters.escapeHtml(token)}</span>`;
                } else if (/^\$[a-zA-Z_][\w]*$/.test(token)) {
                    highlighted += `<span class="text-primary">${sharedConverters.escapeHtml(token)}</span>`;
                } else if (/^(?:\d+\.\d*|\.\d+|\d+)$/.test(token)) {
                    highlighted += `<span class="text-warning">${sharedConverters.escapeHtml(token)}</span>`;
                } else if (normalizedLanguage === 'php' && /^:\s*\??\\?[a-zA-Z_][\w]*(?:\\[a-zA-Z_][\w]*)*(?:\s*[|&]\s*\??\\?[a-zA-Z_][\w]*(?:\\[a-zA-Z_][\w]*)*)*$/.test(token)) {
                    const returnTypeMatch = token.match(/^(:\s*)([\s\S]+)$/);
                    highlighted += sharedConverters.escapeHtml(returnTypeMatch[1]);
                    highlighted += sharedConverters.renderPhpTypeExpression(returnTypeMatch[2]);
                } else if (normalizedLanguage === 'php' && /^\(\s*(?:array|bool|boolean|double|float|int|integer|object|real|string|unset)\s*\)$/i.test(token)) {
                    const castMatch = token.match(/^(\(\s*)([a-z]+)(\s*\))$/i);
                    highlighted += sharedConverters.escapeHtml(castMatch[1]);
                    highlighted += `<span class="text-secondary fw-semibold">${sharedConverters.escapeHtml(castMatch[2])}</span>`;
                    highlighted += sharedConverters.escapeHtml(castMatch[3]);
                } else if (normalizedLanguage === 'php' && /^\s*(?:[|&]|\$)/.test(followingSource) && (!keywordPattern.test(token) || phpBuiltinTypePattern.test(token)) && /^\??\\?[a-zA-Z_][\w]*(?:\\[a-zA-Z_][\w]*)*$/.test(token)) {
                    highlighted += `<span class="text-secondary fw-semibold">${sharedConverters.escapeHtml(token)}</span>`;
                } else if (!keywordPattern.test(token) && /^[a-zA-Z_$][\w$]*$/.test(token)) {
                    highlighted += `<span class="text-danger fw-semibold">${sharedConverters.escapeHtml(token)}</span>`;
                } else {
                    highlighted += `<span class="text-info fw-semibold">${sharedConverters.escapeHtml(token)}</span>`;
                }

                return token;
            });

            highlighted += sharedConverters.escapeHtml(sourceCode.slice(lastIndex));
            return highlighted;
        },
        renderPhpTypeExpression(expression) {
            const source = String(expression || '');
            let highlighted = '';
            let lastIndex = 0;
            const typePattern = /\??\\?[a-zA-Z_][\w]*(?:\\[a-zA-Z_][\w]*)*/g;

            source.replace(typePattern, function (typeName, offset) {
                highlighted += sharedConverters.escapeHtml(source.slice(lastIndex, offset));
                highlighted += `<span class="text-secondary fw-semibold">${sharedConverters.escapeHtml(typeName)}</span>`;
                lastIndex = offset + typeName.length;
                return typeName;
            });

            highlighted += sharedConverters.escapeHtml(source.slice(lastIndex));
            return highlighted;
        },
        renderPhpDocComment(token) {
            const docTagPattern = /(@[a-zA-Z_][\w-]*)(\s+)([\\?a-zA-Z_][\w\\|&?]*|(?:\$[a-zA-Z_][\w]*))?(\s+)?(\$[a-zA-Z_][\w]*)?/g;
            let highlighted = '';
            let lastIndex = 0;
            const source = String(token || '');

            source.replace(docTagPattern, function (match, tag, spacingAfterTag, typeOrVariable, spacingAfterType, variable, offset) {
                highlighted += sharedConverters.escapeHtml(source.slice(lastIndex, offset));
                highlighted += `<span class="fw-semibold text-light">${sharedConverters.escapeHtml(tag)}</span>`;
                highlighted += sharedConverters.escapeHtml(spacingAfterTag || '');

                if (typeOrVariable) {
                    if (/^\$/.test(typeOrVariable)) {
                        highlighted += `<span class="text-primary">${sharedConverters.escapeHtml(typeOrVariable)}</span>`;
                    } else {
                        highlighted += `<span class="text-secondary fw-semibold">${sharedConverters.escapeHtml(typeOrVariable)}</span>`;
                    }
                }

                highlighted += sharedConverters.escapeHtml(spacingAfterType || '');

                if (variable) {
                    highlighted += `<span class="text-primary">${sharedConverters.escapeHtml(variable)}</span>`;
                }

                lastIndex = offset + match.length;
                return match;
            });

            highlighted += sharedConverters.escapeHtml(source.slice(lastIndex));
            return `<span class="text-white-50 fst-italic">${highlighted}</span>`;
        },
        renderCodeLanguageBadge(language) {
            const normalizedLanguage = sharedConverters.normalizeCodeLanguage(language);

            if (normalizedLanguage === '') {
                return '';
            }

            const copyCodeText = sharedConverters.escapeHtml(sharedConverters.getCodeCopyText());

            return `<span class="position-absolute top-0 end-0 m-2 d-flex align-items-center gap-1 bs-markdown-code-actions"><span class="badge text-bg-secondary opacity-75 bs-markdown-code-language-badge" style="transition: opacity .16s ease;">${sharedConverters.escapeHtml(normalizedLanguage)}</span><button type="button" class="btn btn-sm btn-secondary py-0 px-1 opacity-75 bs-markdown-code-copy" title="${copyCodeText}" aria-label="${copyCodeText}"><i class="bi bi-copy"></i></button></span>`;
        },
        renderCodeLineNumbers(code) {
            const lineCount = String(code || '').split('\n').length;
            const numbers = [];

            for (let index = 1; index <= lineCount; index += 1) {
                numbers.push(String(index));
            }

            return numbers.join('\n');
        },
        renderPhpStringToken(token) {
            const source = String(token || '');
            const isHeredoc = /^<<<[ \t]*[a-zA-Z_][\w]*\r?\n/.test(source);
            const isNowdoc = /^<<<[ \t]*'[a-zA-Z_][\w]*'\r?\n/.test(source);

            if (isHeredoc) {
                const heredocMatch = source.match(/^(<<<[ \t]*[a-zA-Z_][\w]*\r?\n)([\s\S]*?)(\r?\n\s*[a-zA-Z_][\w]*;?)$/);

                if (heredocMatch) {
                    return sharedConverters.escapeHtml(heredocMatch[1])
                        + `<span class="text-success">${sharedConverters.renderPhpInterpolatedStringBody(heredocMatch[2])}</span>`
                        + sharedConverters.escapeHtml(heredocMatch[3]);
                }
            }
            if (isNowdoc) {
                const nowdocMatch = source.match(/^(<<<[ \t]*'[a-zA-Z_][\w]*'\r?\n)([\s\S]*?)(\r?\n\s*[a-zA-Z_][\w]*;?)$/);

                if (nowdocMatch) {
                    return sharedConverters.escapeHtml(nowdocMatch[1])
                        + `<span class="text-success">${sharedConverters.escapeHtml(nowdocMatch[2])}</span>`
                        + sharedConverters.escapeHtml(nowdocMatch[3]);
                }
            }

            if (!isHeredoc && (!/^(?:"|`)/.test(source) || isNowdoc)) {
                return `<span class="text-success">${sharedConverters.escapeHtml(source)}</span>`;
            }

            return `<span class="text-success">${sharedConverters.renderPhpInterpolatedStringBody(source)}</span>`;
        },
        renderPhpInterpolatedStringBody(source) {
            const text = String(source || '');

            let highlighted = '';
            let lastIndex = 0;
            const variablePattern = /(?<!\\)\$[a-zA-Z_][\w]*/g;

            text.replace(variablePattern, function (variable, offset) {
                highlighted += sharedConverters.escapeHtml(text.slice(lastIndex, offset));
                highlighted += `<span class="text-primary">${sharedConverters.escapeHtml(variable)}</span>`;
                lastIndex = offset + variable.length;
                return variable;
            });

            highlighted += sharedConverters.escapeHtml(text.slice(lastIndex));
            return highlighted;
        },
        renderInline(text) {
            const codeStore = [];
            let content = sharedConverters.escapeHtml(text);

            content = content.replace(/`([^`]+)`/g, function (_, code) {
                const token = `@@CODE_${codeStore.length}@@`;
                codeStore.push(`<code>${code}</code>`);
                return token;
            });

            content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)(?:\s*\{([^}]*)\})?/g, function (_, alt, url, attrs) {
                const safeSrc = sharedConverters.escapeHtml(sharedConverters.sanitizeUrl(url));
                const safeAlt = sharedConverters.escapeHtml(alt || '');
                return `<img src="${safeSrc}" alt="${safeAlt}"${sharedConverters.renderImageAttrs(attrs)}>`;            });

            content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, url) {
                const safeHref = sharedConverters.escapeHtml(sharedConverters.sanitizeUrl(url));
                return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${label}</a>`;
            });

            content = content.replace(/&lt;(\/?[a-z][a-z0-9]*)([\s\S]*?)&gt;/gi, function(_, tag, attrs) {
                let safeAttrs = attrs.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
                const tagName = tag.toLowerCase();

                const addClass = function(existingAttrs, className) {
                    if (!/class=["']/.test(existingAttrs)) {
                        return ' class="' + className + '"' + existingAttrs;
                    } else {
                        const classRegex = new RegExp('\\b' + className + '\\b');
                        if (!classRegex.test(existingAttrs)) {
                            return existingAttrs.replace(/class=(["'])/, 'class=$1' + className + ' ');
                        }
                    }
                    return existingAttrs;
                };

                if (tagName === 'table') {
                    safeAttrs = addClass(safeAttrs, 'table');
                } else if (tagName === 'blockquote') {
                    safeAttrs = addClass(safeAttrs, 'blockquote');
                } else if (tagName === 'figure') {
                    safeAttrs = addClass(safeAttrs, 'figure');
                } else if (tagName === 'figcaption') {
                    safeAttrs = addClass(safeAttrs, 'figure-caption');
                } else if (tagName === 'dl') {
                    safeAttrs = addClass(safeAttrs, 'row');
                } else if (tagName === 'dt') {
                    safeAttrs = addClass(safeAttrs, 'col-sm-3');
                } else if (tagName === 'dd') {
                    safeAttrs = addClass(safeAttrs, 'col-sm-9');
                } else if (tagName === 'img') {
                    safeAttrs = addClass(safeAttrs, 'img-fluid');
                }

                if (/class=["']/.test(safeAttrs)) {
                    safeAttrs = safeAttrs.replace(/\s{2,}/g, ' ').replace(/class=(["'])\s+/, 'class=$1').replace(/\s+(["'])$/, '$1');
                }

                return '<' + tag + safeAttrs + '>';
            });

            content = content.replace(/~~([^~]+)~~/g, '<del>$1</del>');
            content = content.replace(/==([^=]+)==/g, '<u>$1</u>');
            content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            content = content.replace(/(^|[\s(])_([^_]+)_(?=$|[\s).,!?:;])/g, '$1<em>$2</em>');
            content = content.replace(/(^|[\s(])\*([^*]+)\*(?=$|[\s).,!?:;])/g, '$1<em>$2</em>');

            codeStore.forEach(function (codeHtml, index) {
                content = content.replace(`@@CODE_${index}@@`, codeHtml);
            });

            return content;
        },
        renderMarkdown(markdown) {
            const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
            const html = [];
            let i = 0;

            function renderParagraph(rawLines) {
                const joined = rawLines.join('\n');
                if (joined.trim() === '') {
                    return '';
                }
                const rendered = sharedConverters.renderInline(joined);
                const withHardBreaks = rendered
                    .replace(/\\\n/g, '<br>')
                    .replace(/[ \t]{2,}\n/g, '<br>');
                return `<p>${withHardBreaks.replace(/\n/g, ' ').trim()}</p>`;
            }

            while (i < lines.length) {
                const line = lines[i];
                const trimmed = line.trim();

                if (trimmed === '') {
                    i += 1;
                    continue;
                }

                const htmlBlockMatch = trimmed.match(/^<(table|details|dl)\b/i);
                if (htmlBlockMatch) {
                    const tagName = htmlBlockMatch[1].toLowerCase();
                    const closePattern = new RegExp('</' + tagName + '>', 'i');
                    const tableLines = [];
                    while (i < lines.length) {
                        const currentLine = lines[i];
                        tableLines.push(currentLine);
                        if (closePattern.test(currentLine)) {
                            i += 1;
                            break;
                        }
                        i += 1;
                    }
                    html.push(sharedConverters.renderInline(tableLines.join('\n')));
                    continue;
                }

                const fenceMatch = trimmed.match(/^```\s*([a-zA-Z0-9_+.#-]+)?(?:\s.*)?$/);
                if (fenceMatch) {
                    const fenceLines = [];
                    const language = sharedConverters.normalizeCodeLanguage(fenceMatch[1] || '');
                    const isKnownLanguage = sharedConverters.isKnownCodeLanguage(language);
                    const languageClass = language === '' ? '' : `language-${sharedConverters.escapeHtml(language)}`;
                    i += 1;
                    while (i < lines.length && !/^```/.test(lines[i].trim())) {
                        fenceLines.push(lines[i]);
                        i += 1;
                    }
                    if (i < lines.length) {
                        i += 1;
                    }
                    const code = fenceLines.join('\n');

                    if (isKnownLanguage) {
                        const preClass = ' class="position-relative pt-4 bg-dark text-light overflow-auto"';
                        const codeClass = ` class="${languageClass} d-block flex-grow-1"`;
                        const codeStyle = ' style="padding-top:3px;"';
                        if (code.trim() === '') {
                            html.push(`<pre${preClass}>${sharedConverters.renderCodeLanguageBadge(language)}<code${codeClass}${codeStyle}></code></pre>`);
                        } else {
                            const stripedStyle = ' style="line-height:1.5;background-image:repeating-linear-gradient(to bottom, transparent 0, transparent 1.5em, rgba(255,255,255,.035) 1.5em, rgba(255,255,255,.035) 3em);"';
                            const lineNumbers = sharedConverters.renderCodeLineNumbers(code);
                            html.push(`<pre${preClass}>${sharedConverters.renderCodeLanguageBadge(language)}<span class="d-flex align-items-start"${stripedStyle}><span aria-hidden="true" class="text-secondary user-select-none pe-3 me-3 border-end border-secondary" style="padding-top:3px;text-align:right;">${lineNumbers}</span><code${codeClass}${codeStyle}>${sharedConverters.highlightCode(code, language)}</code></span></pre>`);
                        }
                    } else {
                        const codeClass = languageClass === '' ? '' : ` class="${languageClass}"`;
                        const preClass = language === '' ? '' : ' class="position-relative pt-4"';
                        const codeStyle = language === '' ? '' : ' style="padding-top:3px;"';
                        html.push(`<pre${preClass}>${sharedConverters.renderCodeLanguageBadge(language)}<code${codeClass}${codeStyle}>${sharedConverters.escapeHtml(code)}</code></pre>`);
                    }
                    continue;
                }

                const headingMatch = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/);
                if (headingMatch) {
                    const level = headingMatch[1].length;
                    html.push(`<h${level}>${sharedConverters.renderInline(headingMatch[2])}</h${level}>`);
                    i += 1;
                    continue;
                }

                if (/^\s{0,3}([-*_])\s*(\1\s*){2,}$/.test(line)) {
                    html.push('<hr>');
                    i += 1;
                    continue;
                }

                if (/^\s*>\s?/.test(line)) {
                    const quoteLines = [];
                    while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
                        i += 1;
                    }
                    const calloutHtml = sharedConverters.renderCalloutBlock(quoteLines);
                    if (calloutHtml !== '') {
                        html.push(calloutHtml);
                        continue;
                    }
                    html.push(`<blockquote class="blockquote">${sharedConverters.renderMarkdown(quoteLines.join('\n'))}</blockquote>`);
                    continue;
                }

                if (sharedConverters.isTableHeaderLine(line) && i + 1 < lines.length && sharedConverters.isTableSeparatorLine(lines[i + 1])) {
                    const alignments = sharedConverters.parseTableAlignments(lines[i + 1]);
                    const headerCells = sharedConverters.parseTableRow(line);
                    const bodyRows = [];
                    i += 2;

                    while (i < lines.length && sharedConverters.isTableDataLine(lines[i])) {
                        bodyRows.push(sharedConverters.parseTableRow(lines[i]));
                        i += 1;
                    }

                    const thead = '<thead><tr>' + headerCells.map(function (cell, index) {
                        const align = alignments[index] ? ` style="text-align:${alignments[index]}"` : '';
                        return `<th${align}>${sharedConverters.renderInline(cell)}</th>`;
                    }).join('') + '</tr></thead>';

                    const tbody = bodyRows.length === 0
                        ? '<tbody></tbody>'
                        : '<tbody>' + bodyRows.map(function (row) {
                        return '<tr>' + row.map(function (cell, index) {
                            const align = alignments[index] ? ` style="text-align:${alignments[index]}"` : '';
                            return `<td${align}>${sharedConverters.renderInline(cell)}</td>`;
                        }).join('') + '</tr>';
                    }).join('') + '</tbody>';

                    html.push(`<table class="table">${thead}${tbody}</table>`);
                    continue;
                }

                if (sharedConverters.isListLine(line)) {
                    const listLines = [];
                    while (i < lines.length && sharedConverters.isListLine(lines[i])) {
                        listLines.push(lines[i]);
                        i += 1;
                    }
                    html.push(sharedConverters.renderListBlock(listLines));
                    continue;
                }

                const paragraphLines = [];
                while (i < lines.length) {
                    const current = lines[i];
                    if (
                        current.trim() === '' ||
                        /^<(table|details|dl)\b/i.test(current.trim()) ||
                        /^```\s*([a-zA-Z0-9_+.#-]+)?(?:\s.*)?$/.test(current.trim()) ||
                        /^\s{0,3}(#{1,6})\s+/.test(current) ||
                        /^\s*>\s?/.test(current) ||
                        sharedConverters.isListLine(current) ||
                        /^\s{0,3}([-*_])\s*(\1\s*){2,}$/.test(current) ||
                        (
                            sharedConverters.isTableHeaderLine(current) &&
                            i + 1 < lines.length &&
                            sharedConverters.isTableSeparatorLine(lines[i + 1])
                        )
                    ) {
                        break;
                    }
                    paragraphLines.push(current);
                    i += 1;
                }
                if (paragraphLines.length === 0) {
                    html.push(renderParagraph([line]));
                    i += 1;
                    continue;
                }
                html.push(renderParagraph(paragraphLines));
            }

            return html.join('\n');
        },
        renderCalloutBlock(lines) {
            if (!Array.isArray(lines) || lines.length === 0) {
                return '';
            }
            const firstLine = String(lines[0] || '');
            const match = firstLine.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
            if (!match) {
                return '';
            }
            const type = match[1].toUpperCase();
            const title = String(match[2] || '').trim() || type.charAt(0) + type.slice(1).toLowerCase();
            const bodyLines = lines.slice(1);
            const alertClassMap = {
                NOTE: 'alert-info',
                TIP: 'alert-success',
                IMPORTANT: 'alert-primary',
                WARNING: 'alert-warning',
                CAUTION: 'alert-danger'
            };
            const iconClassMap = {
                NOTE: 'bi-info-circle',
                TIP: 'bi-lightbulb',
                IMPORTANT: 'bi-exclamation-circle',
                WARNING: 'bi-exclamation-triangle',
                CAUTION: 'bi-exclamation-octagon'
            };
            const body = bodyLines.length > 0
                ? sharedConverters.renderMarkdown(bodyLines.join('\n'))
                : '';
            return `<div class="alert ${alertClassMap[type] || 'alert-secondary'}" role="note"><div class="fw-semibold mb-1"><i class="bi ${iconClassMap[type] || 'bi-info-circle'} me-1"></i>${sharedConverters.renderInline(title)}</div>${body}</div>`;
        },
        escapeMarkdownText(text) {
            return String(text || '')
                .replace(/\r\n?/g, '\n')
                .replace(/[ \t]+\n/g, '\n')
                .replace(/\\/g, '\\\\')
                .replace(/([*_`\[\]])/g, '\\$1');
        },
        normalizeMarkdown(markdown) {
            return String(markdown || '')
                .replace(/\r\n?/g, '\n')
                .replace(/[ \t]+\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        },
        renderInlineNodes(nodes) {
            return Array.from(nodes || []).map(function (node) {
                return sharedConverters.renderInlineNode(node);
            }).join('').replace(/[ \t]+\n/g, '\n');
        },
        renderInlineNode(node) {
            if (!node) {
                return '';
            }

            if (node.nodeType === 3) {
                return sharedConverters.escapeMarkdownText(node.nodeValue).replace(/\s+/g, ' ');
            }

            if (node.nodeType !== 1) {
                return '';
            }

            const tagName = node.tagName.toLowerCase();

            if (tagName === 'br') {
                return '\n';
            }
            if (tagName === 'code') {
                return '`' + node.textContent.replace(/\n+/g, ' ').trim() + '`';
            }
            if (tagName === 'strong' || tagName === 'b') {
                return `**${sharedConverters.renderInlineNodes(node.childNodes).trim()}**`;
            }
            if (tagName === 'em' || tagName === 'i') {
                return `_${sharedConverters.renderInlineNodes(node.childNodes).trim()}_`;
            }
            if (tagName === 'del' || tagName === 's') {
                return `~~${sharedConverters.renderInlineNodes(node.childNodes).trim()}~~`;
            }
            if (tagName === 'u') {
                return `==${sharedConverters.renderInlineNodes(node.childNodes).trim()}==`;
            }
            if (tagName === 'sub' || tagName === 'sup') {
                return `<${tagName}>${sharedConverters.renderInlineNodes(node.childNodes).trim()}</${tagName}>`;
            }
            if (tagName === 'a') {
                const label = sharedConverters.renderInlineNodes(node.childNodes).trim() || (node.textContent || '').trim();
                return `[${label}](${node.getAttribute('href') || ''})`;
            }
            if (tagName === 'img') {
                const attrs = sharedConverters.renderMarkdownImageAttrs(node);
                return `![${sharedConverters.escapeMarkdownText(node.getAttribute('alt') || '')}](${node.getAttribute('src') || ''})${attrs}`;
            }
            if (tagName === 'input') {
                return '';
            }

            return sharedConverters.renderInlineNodes(node.childNodes);
        },
        renderBlockNodes(nodes, depth) {
            return Array.from(nodes || []).map(function (node) {
                return sharedConverters.renderBlockNode(node, depth || 0);
            }).join('');
        },
        renderBlockNode(node, depth) {
            if (!node) {
                return '';
            }

            if (node.nodeType === 3) {
                const text = node.nodeValue.replace(/\s+/g, ' ').trim();
                return text === '' ? '' : `${sharedConverters.escapeMarkdownText(text)}\n\n`;
            }

            if (node.nodeType !== 1) {
                return '';
            }

            const tagName = node.tagName.toLowerCase();

            if (/^h[1-6]$/.test(tagName)) {
                return `${'#'.repeat(parseInt(tagName.slice(1), 10))} ${sharedConverters.renderInlineNodes(node.childNodes).trim()}\n\n`;
            }
            if (tagName === 'p') {
                return `${sharedConverters.renderInlineNodes(node.childNodes).trim()}\n\n`;
            }
            if (tagName === 'blockquote') {
                const inner = sharedConverters.normalizeMarkdown(sharedConverters.renderBlockNodes(node.childNodes, depth));
                if (inner === '') {
                    return '';
                }
                return inner.split('\n').map(function (line) {
                    return line === '' ? '>' : '> ' + line;
                }).join('\n') + '\n\n';
            }
            if (tagName === 'pre') {
                const codeNode = node.querySelector('code');
                const code = codeNode ? codeNode.textContent : node.textContent;
                const language = codeNode ? sharedConverters.getCodeLanguageFromClass(codeNode.getAttribute('class')) : '';
                return `\`\`\`${language}\n${String(code || '').replace(/\r\n?/g, '\n').replace(/\n$/, '')}\n\`\`\`\n\n`;
            }
            if (tagName === 'hr') {
                return '---\n\n';
            }
            if (tagName === 'ul' || tagName === 'ol') {
                return `${sharedConverters.renderListElement(node, depth)}\n`;
            }
            if (tagName === 'table') {
                const tableMarkdown = sharedConverters.renderTableElement(node);
                return tableMarkdown === '' ? '' : `${tableMarkdown}\n\n`;
            }
            if (tagName === 'div' || tagName === 'section' || tagName === 'article') {
                return sharedConverters.renderBlockNodes(node.childNodes, depth);
            }

            return `${sharedConverters.renderInlineNodes(node.childNodes).trim()}\n\n`;
        },
        getDirectCheckbox(item) {
            const directChildren = Array.from(item.children || []);

            for (let index = 0; index < directChildren.length; index += 1) {
                const child = directChildren[index];
                const tagName = child.tagName.toLowerCase();

                if (tagName === 'input' && child.type === 'checkbox') {
                    return child;
                }

                if (tagName === 'label') {
                    const labelChildren = Array.from(child.children || []);
                    for (let labelIndex = 0; labelIndex < labelChildren.length; labelIndex += 1) {
                        const labelChild = labelChildren[labelIndex];
                        if (labelChild.tagName && labelChild.tagName.toLowerCase() === 'input' && labelChild.type === 'checkbox') {
                            return labelChild;
                        }
                    }
                }
            }

            return null;
        },
        renderListElement(listNode, depth) {
            const isOrdered = listNode.tagName.toLowerCase() === 'ol';
            const indent = '  '.repeat(depth || 0);
            const items = Array.from(listNode.children).filter(function (child) {
                return child.tagName && child.tagName.toLowerCase() === 'li';
            });

            return items.map(function (item, index) {
                const childNodes = Array.from(item.childNodes);
                const nestedLists = childNodes.filter(function (child) {
                    return child.nodeType === 1 && /^(ul|ol)$/i.test(child.tagName);
                });
                const contentNodes = childNodes.filter(function (child) {
                    return !(child.nodeType === 1 && /^(ul|ol)$/i.test(child.tagName));
                });
                const checkbox = sharedConverters.getDirectCheckbox(item);
                const marker = checkbox ? `- [${checkbox.checked ? 'x' : ' '}]` : (isOrdered ? `${index + 1}.` : '-');
                const content = sharedConverters.renderInlineNodes(contentNodes).replace(/\n+/g, ' ').trim();
                let line = `${indent}${marker}`;

                if (content !== '') {
                    line += ` ${content}`;
                }

                if (nestedLists.length === 0) {
                    return line;
                }

                const nested = nestedLists.map(function (nestedList) {
                    return sharedConverters.renderListElement(nestedList, (depth || 0) + 1);
                }).join('\n');

                return `${line}\n${nested}`;
            }).join('\n');
        },
        renderTableElement(tableNode) {
            const rows = [];
            const alignments = [];

            if (tableNode.tHead && tableNode.tHead.rows.length > 0) {
                rows.push(Array.from(tableNode.tHead.rows[0].cells));
            }

            Array.from(tableNode.tBodies || []).forEach(function (tbody) {
                Array.from(tbody.rows).forEach(function (row) {
                    rows.push(Array.from(row.cells));
                });
            });

            if (rows.length === 0) {
                Array.from(tableNode.rows || []).forEach(function (row) {
                    rows.push(Array.from(row.cells));
                });
            }

            if (rows.length === 0) {
                return '';
            }

            const markdownRows = rows.map(function (row) {
                return row.map(function (cell, index) {
                    const styleAlign = (cell.style && cell.style.textAlign ? cell.style.textAlign : '').trim().toLowerCase();
                    if (!alignments[index] && styleAlign !== '') {
                        alignments[index] = styleAlign;
                    }
                    return sharedConverters.renderInlineNodes(cell.childNodes).replace(/\n+/g, ' ').trim();
                });
            });
            const columnCount = markdownRows.reduce(function (max, row) {
                return Math.max(max, row.length);
            }, 0);

            markdownRows.forEach(function (row) {
                while (row.length < columnCount) {
                    row.push('');
                }
            });

            while (alignments.length < columnCount) {
                alignments.push('');
            }

            const header = markdownRows.shift() || [];
            const separator = alignments.map(function (alignment) {
                if (alignment === 'center') {
                    return ':---:';
                }
                if (alignment === 'right') {
                    return '---:';
                }
                if (alignment === 'left') {
                    return ':---';
                }
                return '---';
            });
            const lines = [`| ${header.join(' | ')} |`, `| ${separator.join(' | ')} |`];

            markdownRows.forEach(function (row) {
                lines.push(`| ${row.join(' | ')} |`);
            });

            return lines.join('\n');
        },
        htmlToMarkdown(html) {
            const source = String(html == null ? '' : html);

            if (source.trim() === '') {
                return '';
            }

            const parser = new window.DOMParser();
            const doc = parser.parseFromString(`<div>${source}</div>`, 'text/html');
            const root = doc.body.firstElementChild;

            return sharedConverters.normalizeMarkdown(sharedConverters.renderBlockNodes(root.childNodes, 0));
        },
        parseTableRow(line) {
            const cells = [];
            let current = '';
            let inCode = false;
            const source = String(line || '').trim();

            for (let index = 0; index < source.length; index += 1) {
                const char = source.charAt(index);
                const previous = index > 0 ? source.charAt(index - 1) : '';

                if (char === '`' && previous !== '\\') {
                    inCode = !inCode;
                    current += char;
                    continue;
                }

                if (char === '|' && previous !== '\\' && !inCode) {
                    cells.push(current);
                    current = '';
                    continue;
                }

                current += char;
            }

            cells.push(current);

            if (cells.length > 0 && cells[0].trim() === '') {
                cells.shift();
            }
            if (cells.length > 0 && cells[cells.length - 1].trim() === '') {
                cells.pop();
            }

            return cells.map(function (cell) {
                return cell.replace(/\\\|/g, '|').trim();
            });
        },
        isTableHeaderLine(line) {
            const cells = sharedConverters.parseTableRow(line);
            return cells.length > 0 && cells.some(function (cell) {
                return cell !== '';
            });
        },
        isTableSeparatorLine(line) {
            return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(String(line || ''));
        },
        isTableDataLine(line) {
            if (String(line || '').trim() === '') {
                return false;
            }

            return String(line).indexOf('|') !== -1;
        },
        parseTableAlignments(line) {
            return sharedConverters.parseTableRow(line).map(function (cell) {
                const trimmed = cell.trim();

                if (/^:-+:$/.test(trimmed)) {
                    return 'center';
                }
                if (/^:-+$/.test(trimmed)) {
                    return 'left';
                }
                if (/^-+:$/.test(trimmed)) {
                    return 'right';
                }

                return '';
            });
        },
        getListItemData(line) {
            const match = String(line).match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
            if (!match) {
                return null;
            }

            const indent = match[1].replace(/\t/g, '    ').length;
            const marker = match[2];

            return {
                indent: indent,
                type: /^\d+\.$/.test(marker) ? 'ol' : 'ul',
                content: match[3]
            };
        },
        isListLine(line) {
            return sharedConverters.getListItemData(line) !== null;
        },
        renderListBlock(lines) {
            const items = lines
                .map(function (line) {
                    return sharedConverters.getListItemData(line);
                })
                .filter(function (item) {
                    return item !== null;
                });

            if (items.length === 0) {
                return '';
            }

            const root = {children: []};
            const stack = [{indent: -1, node: root}];

            items.forEach(function (item) {
                while (stack.length > 1 && item.indent <= stack[stack.length - 1].indent) {
                    stack.pop();
                }

                const node = {
                    type: item.type,
                    content: item.content,
                    children: []
                };
                stack[stack.length - 1].node.children.push(node);
                stack.push({indent: item.indent, node: node});
            });

            return sharedConverters.renderListNodes(root.children);
        },
        renderListItem(item) {
            const taskMatch = String(item).match(/^\[( |x|X)\]\s+(.+)$/);

            if (!taskMatch) {
                return sharedConverters.renderInline(item);
            }

            const checked = taskMatch[1].toLowerCase() === 'x' ? ' checked' : '';
            return `<label class="form-check-label d-flex align-items-center gap-2"><input class="form-check-input mt-0" type="checkbox" disabled${checked}>${sharedConverters.renderInline(taskMatch[2])}</label>`;
        },
        isTaskListItem(item) {
            return /^\[( |x|X)\]\s+.+$/.test(String(item));
        },
        renderListNodes(nodes) {
            let index = 0;
            let html = '';

            while (index < nodes.length) {
                const groupType = nodes[index].type;
                const groupNodes = [];

                while (index < nodes.length && nodes[index].type === groupType) {
                    groupNodes.push(nodes[index]);
                    index += 1;
                }

                const isTaskList = groupType === 'ul' && groupNodes.length > 0 && groupNodes.every(function (node) {
                    return sharedConverters.isTaskListItem(node.content);
                });
                const listClass = isTaskList ? ' class="list-unstyled ps-0"' : '';
                html += `<${groupType}${listClass}>` + groupNodes.map(function (node) {
                    const nested = node.children.length > 0 ? sharedConverters.renderListNodes(node.children) : '';
                    return `<li>${sharedConverters.renderListItem(node.content)}${nested}</li>`;
                }).join('') + `</${groupType}>`;
            }

            return html;
        }
    };

    $.bsMarkdownEditor = $.extend({}, $.bsMarkdownEditor, {
        toHtml(markdown) {
            return sharedConverters.renderMarkdown(markdown);
        },
        toMarkdown(html) {
            return sharedConverters.htmlToMarkdown(html);
        }
    });

    $.fn.bsMarkdownEditor = function (options) {
        const methodArgs = Array.prototype.slice.call(arguments, 1);
        if (typeof options === 'string') {
            const methodName = options;
            const $first = this.first();
            const firstApi = $first.data('bsMarkdownEditorApi');

            if (methodName === 'val') {
                if (methodArgs.length === 0) {
                    return firstApi ? firstApi.val() : undefined;
                }
                return this.each(function () {
                    const api = $(this).data('bsMarkdownEditorApi');
                    if (api) {
                        api.val(methodArgs[0]);
                    }
                });
            }

            if (methodName === 'mode') {
                if (methodArgs.length === 0) {
                    return firstApi ? firstApi.mode() : undefined;
                }
                return this.each(function () {
                    const api = $(this).data('bsMarkdownEditorApi');
                    if (api) {
                        api.mode(methodArgs[0]);
                    }
                });
            }

            return this;
        }

        const DEFAULT_WRAPPER_CLASS = 'bs-markdown-editor';

        const settings = $.extend(true, {
            minHeight: 220,
            preview: true,
            mode: 'editor',
            resize: false,
            showStats: false,
            size: null,
            btnClass: 'border-0',
            wrapperClass: '',
            actions: 'all',
            customActions: {},
            lang: null,
            translations: {},
            shortcuts: {
                'bold': 'ctrl+b',
                'italic': 'ctrl+i',
                'ul': 'ctrl+l',
                'ol': 'ctrl+shift+o',
                'quote': 'ctrl+q',
                'code': 'ctrl+k',
                'link': 'ctrl+shift+l',
                'image': 'ctrl+shift+i',
                'codeBlock': 'ctrl+shift+k',
                'undo': 'ctrl+z',
                'redo': 'ctrl+y',
                'preview': 'ctrl+p',
                'hr': 'ctrl+h',
                'taskList': 'ctrl+shift+t',
                'toggleTask': 'ctrl+shift+m',
                'strikethrough': 'ctrl+shift+s',
                'underline': 'ctrl+alt+u',
                'subscript': 'ctrl+shift+b',
                'superscript': 'ctrl+shift+p',
                'heading1': 'ctrl+shift+1',
                'heading2': 'ctrl+shift+2',
                'heading3': 'ctrl+shift+3',
                'heading4': 'ctrl+shift+4',
                'heading5': 'ctrl+shift+5',
                'heading6': 'ctrl+shift+6',
                'callout': 'ctrl+shift+c',
                'details': 'ctrl+shift+d',
                'definitionList': 'ctrl+shift+u',
                'alignLeft': 'ctrl+alt+l',
                'alignCenter': 'ctrl+alt+c',
                'alignRight': 'ctrl+alt+r',
                'alignJustify': 'ctrl+alt+j'
            }
        }, options);

        const defaultTranslations = {
            actions: {
                bold: 'Bold',
                italic: 'Italic',
                textStyles: 'Text style',
                clearFormatting: 'Clear formatting',
                normalText: 'Normal text',
                heading1: 'Heading 1',
                heading2: 'Heading 2',
                heading3: 'Heading 3',
                heading4: 'Heading 4',
                heading5: 'Heading 5',
                heading6: 'Heading 6',
                customTable: 'Custom…',
                strikethrough: 'Strikethrough',
                underline: 'Underline',
                subscript: 'Subscript',
                superscript: 'Superscript',
                heading: 'Heading',
                insert: 'Insert',
                lists: 'Lists',
                ul: 'List',
                ol: 'Numbered list',
                indent: 'Indent',
                outdent: 'Outdent',
                quote: 'Quote',
                link: 'Link',
                code: 'Code',
                codeBlock: 'Code block',
                copyCode: 'Copy code',
                callout: 'Callout',
                details: 'Details',
                definitionList: 'Definition list',
                table: 'Table',
                image: 'Image',
                hr: 'Horizontal rule',
                taskList: 'Task list',
                toggleTask: 'Toggle task',
                undo: 'Undo',
                redo: 'Redo',
                alignment: 'Alignment',
                alignLeft: 'Align left',
                alignCenter: 'Align center',
                alignRight: 'Align right',
                alignJustify: 'Justify',
                preview: 'Preview'
            },
            prompts: {
                linkUrl: 'Enter URL',
                codeLang: 'Language (optional)',
                imageAlt: 'Enter alt text',
                imageUrl: 'Enter image URL'
            },
            placeholders: {
                bold: 'bold',
                italic: 'italic',
                strikethrough: 'strikethrough',
                underline: 'underlined',
                subscript: 'subscript',
                superscript: 'superscript',
                linkText: 'Link text',
                code: 'code',
                defaultText: 'Text',
                defaultItem: 'Item',
                defaultTask: 'Task',
                defaultCallout: 'Note',
                defaultCalloutText: 'Callout text',
                defaultSummary: 'Summary',
                defaultDetails: 'Details content',
                defaultTerm: 'Term',
                defaultDefinition: 'Definition',
                imageAlt: 'Image',
                tableColumn: 'Column',
                tableValue: 'Value'
            },
            callouts: {
                note: {
                    label: 'Note',
                    title: 'Note'
                },
                tip: {
                    label: 'Tip',
                    title: 'Tip'
                },
                important: {
                    label: 'Important',
                    title: 'Important'
                },
                warning: {
                    label: 'Warning',
                    title: 'Warning'
                },
                caution: {
                    label: 'Caution',
                    title: 'Caution'
                }
            },
            preview: {
                loading: 'Rendering preview...',
                error: 'Preview could not be rendered.'
            },
            stats: {
                mode: 'Mode',
                chars: 'chars',
                words: 'words',
                shortcuts: 'Keyboard shortcuts'
            },
            modal: {
                tableTitle: 'Create table',
                imageTitle: 'Insert image',
                linkTitle: 'Insert link',
                calloutTitle: 'Insert callout',
                calloutType: 'Type',
                calloutHeading: 'Title',
                calloutText: 'Text',
                shortcutsTitle: 'Keyboard shortcuts',
                rows: 'Rows',
                columns: 'Columns',
                alt: 'Alt text',
                url: 'URL',
                linkText: 'Link text',
                width: 'Width',
                height: 'Height',
                align: 'Alignment',
                alignNone: 'None',
                alignLeft: 'Left',
                alignCenter: 'Center',
                alignRight: 'Right',
                imageDimensionsHelp: 'Numeric values are pixels; auto is allowed.',
                cancel: 'Cancel',
                insert: 'Insert'
            },
            stats: {
                mode: 'Mode',
                chars: 'chars',
                words: 'words'
            }
        };

        const preloadedTranslations = window.bsMarkdownEditorTranslations && typeof window.bsMarkdownEditorTranslations === 'object'
            ? window.bsMarkdownEditorTranslations
            : {};
        const i18n = $.extend(true, {}, defaultTranslations, preloadedTranslations, settings.translations || {});

        function t(key, fallback) {
            const value = key.split('.').reduce(function (current, part) {
                if (!current || typeof current !== 'object') {
                    return undefined;
                }
                return current[part];
            }, i18n);
            if (typeof value === 'string' && value !== '') {
                return value;
            }
            return fallback;
        }

        const actions = {
            bold: {
                title: t('actions.bold', 'Fett'),
                icon: 'bi-type-bold',
                run(textarea) {
                    helpers.wrapSelection(textarea, '**', '**', t('placeholders.bold', 'fett'));
                }
            },
            italic: {
                title: t('actions.italic', 'Kursiv'),
                icon: 'bi-type-italic',
                run(textarea) {
                    helpers.wrapSelection(textarea, '_', '_', t('placeholders.italic', 'kursiv'));
                }
            },
            textStyles: {
                title: t('actions.textStyles', 'Textstil'),
                icon: 'bi-type',
                items: [
                    {label: t('actions.strikethrough', 'Durchgestrichen'), icon: 'bi-type-strikethrough', before: '~~', after: '~~', shortcut: 'strikethrough', placeholder: t('placeholders.strikethrough', 'durchgestrichen')},
                    {label: t('actions.underline', 'Unterstrichen'), icon: 'bi-type-underline', before: '==', after: '==', shortcut: 'underline', placeholder: t('placeholders.underline', 'unterstrichen')},
                    {label: t('actions.subscript', 'Tiefgestellt'), icon: 'bi-subscript', before: '<sub>', after: '</sub>', shortcut: 'subscript', placeholder: t('placeholders.subscript', 'tiefgestellt')},
                    {label: t('actions.superscript', 'Hochgestellt'), icon: 'bi-superscript', before: '<sup>', after: '</sup>', shortcut: 'superscript', placeholder: t('placeholders.superscript', 'hochgestellt')}
                ],
                run(textarea, item) {
                    helpers.wrapSelection(textarea, item.before, item.after, item.placeholder);
                }
            },
            clearFormatting: {
                title: t('actions.clearFormatting', 'Formatierung löschen'),
                icon: 'bi-eraser',
                run(textarea) {
                    helpers.clearSelectedFormatting(textarea);
                }
            },
            heading: {
                title: t('actions.heading', 'Überschrift'),
                icon: 'bi-fonts',
                items: [
                    {label: t('actions.normalText', 'Normaler Text'), prefix: '', textStyle: 'font-size:1rem;'},
                    {label: t('actions.heading1', 'Überschrift 1'), prefix: '# ', shortcut: 'heading1', textStyle: 'font-size:1.15rem; font-weight:600;'},
                    {label: t('actions.heading2', 'Überschrift 2'), prefix: '## ', shortcut: 'heading2', textStyle: 'font-size:1.1rem; font-weight:600;'},
                    {label: t('actions.heading3', 'Überschrift 3'), prefix: '### ', shortcut: 'heading3', textStyle: 'font-size:1.05rem; font-weight:600;'},
                    {label: t('actions.heading4', 'Überschrift 4'), prefix: '#### ', shortcut: 'heading4', textStyle: 'font-size:1rem; font-weight:600;'},
                    {label: t('actions.heading5', 'Überschrift 5'), prefix: '##### ', shortcut: 'heading5', textStyle: 'font-size:0.95rem; font-weight:600;'},
                    {label: t('actions.heading6', 'Überschrift 6'), prefix: '###### ', shortcut: 'heading6', textStyle: 'font-size:0.9rem; font-weight:600;'}
                ],
                run(textarea, item) {
                    helpers.transformSelectedLines(textarea, function (line) {
                        if (line.trim() === '') {
                            return line;
                        }
                        const normalized = helpers.stripHeadingPrefix(line).trimStart();
                        if (!item.prefix) {
                            return normalized;
                        }
                        return item.prefix + normalized;
                    });
                }
            },
            ul: {
                title: t('actions.ul', 'Liste'),
                icon: 'bi-list-ul',
                run(textarea) {
                    helpers.prefixLines(textarea, '- ');
                }
            },
            ol: {
                title: t('actions.ol', 'Nummerierte Liste'),
                icon: 'bi-list-ol',
                run(textarea) {
                    helpers.prefixNumberedLines(textarea);
                }
            },
            indent: {
                title: t('actions.indent', 'Einrücken'),
                icon: 'bi-text-indent-left',
                run(textarea) {
                    helpers.indentLines(textarea);
                }
            },
            outdent: {
                title: t('actions.outdent', 'Ausrücken'),
                icon: 'bi-text-indent-right',
                run(textarea) {
                    helpers.outdentLines(textarea);
                }
            },
            quote: {
                title: t('actions.quote', 'Zitat'),
                icon: 'bi-blockquote-left',
                run(textarea) {
                    helpers.prefixLines(textarea, '> ');
                }
            },
            link: {
                title: t('actions.link', 'Link'),
                icon: 'bi-link-45deg',
                run(textarea) {
                    helpers.openLinkModal(textarea);
                }
            },
            code: {
                title: t('actions.code', 'Code'),
                icon: 'bi-code-slash',
                run(textarea) {
                    helpers.wrapSelection(textarea, "`", "`", t('placeholders.code', 'code'));
                }
            },
            codeBlock: {
                title: t('actions.codeBlock', 'Codeblock'),
                icon: 'bi-braces-asterisk',
                run(textarea) {
                    helpers.openCodeBlockModal(textarea);
                }
            },
            callout: {
                title: t('actions.callout', 'Hinweisbox'),
                icon: 'bi-info-square',
                run(textarea) {
                    helpers.openCalloutModal(textarea);
                }
            },
            details: {
                title: t('actions.details', 'Details'),
                icon: 'bi-arrows-collapse',
                run(textarea) {
                    const selected = helpers.getSelection(textarea);
                    const content = selected === '' ? t('placeholders.defaultDetails', 'Detailinhalt') : selected;
                    helpers.insertBlock(textarea, helpers.buildMarkdownDetails(content));
                }
            },
            definitionList: {
                title: t('actions.definitionList', 'Definitionsliste'),
                icon: 'bi-card-list',
                run(textarea) {
                    const selected = helpers.getSelection(textarea);
                    const content = selected === '' ? t('placeholders.defaultDefinition', 'Definition') : selected;
                    helpers.insertBlock(textarea, helpers.buildMarkdownDefinitionList(content));
                }
            },
            table: {
                title: t('actions.table', 'Tabelle'),
                icon: 'bi-table',
                items: [
                    {label: '2 x 2', rows: 2, columns: 2},
                    {label: '3 x 2', rows: 3, columns: 2},
                    {label: '3 x 3', rows: 3, columns: 3},
                    {label: '4 x 3', rows: 4, columns: 3},
                    {label: '4 x 4', rows: 4, columns: 4},
                    {type: 'divider'},
                    {label: t('actions.customTable', 'Benutzerdefiniert…'), customForm: true, icon: 'bi-sliders'}
                ],
                run(textarea, item) {
                    const rows = item && item.rows ? item.rows : 2;
                    const columns = item && item.columns ? item.columns : 2;
                    helpers.insertTemplate(textarea, helpers.buildMarkdownTable(rows, columns));
                }
            },
            image: {
                title: t('actions.image', 'Bild'),
                icon: 'bi-image',
                run(textarea) {
                    helpers.openImageModal(textarea);
                }
            },
            hr: {
                title: t('actions.hr', 'Trennlinie'),
                icon: 'bi-hr',
                run(textarea) {
                    helpers.insertBlock(textarea, '---');
                }
            },
            taskList: {
                title: t('actions.taskList', 'Task-Liste'),
                icon: 'bi-card-checklist',
                run(textarea) {
                    const selected = helpers.getSelection(textarea);
                    const content = selected === '' ? t('placeholders.defaultTask', 'Aufgabe') : selected;
                    const replacement = content.split('\n').map(function (line) {
                        if (line.trim() === '') {
                            return line;
                        }
                        return `- [ ] ${line}`;
                    }).join('\n');
                    helpers.insertBlock(textarea, replacement);
                }
            },
            toggleTask: {
                title: t('actions.toggleTask', 'Task umschalten'),
                icon: 'bi-check2-square',
                run(textarea) {
                    helpers.toggleTaskLines(textarea);
                }
            },
            undo: {
                title: t('actions.undo', 'Rückgängig'),
                icon: 'bi-arrow-counterclockwise',
                run(textarea) {
                    helpers.undo(textarea);
                }
            },
            redo: {
                title: t('actions.redo', 'Wiederholen'),
                icon: 'bi-arrow-clockwise',
                run(textarea) {
                    helpers.redo(textarea);
                }
            },
            alignment: {
                title: t('actions.alignment', 'Ausrichtung'),
                icon: 'bi-justify-left',
                items: [
                    {label: t('actions.alignLeft', 'Linksbündig'), icon: 'bi-justify-left', shortcut: 'alignLeft', before: '\n<div class="text-start">\n', after: '\n</div>\n'},
                    {label: t('actions.alignCenter', 'Zentriert'), icon: 'bi-text-center', shortcut: 'alignCenter', before: '\n<div class="text-center">\n', after: '\n</div>\n'},
                    {label: t('actions.alignRight', 'Rechtsbündig'), icon: 'bi-justify-right', shortcut: 'alignRight', before: '\n<div class="text-end">\n', after: '\n</div>\n'},
                    {label: t('actions.alignJustify', 'Blocksatz'), icon: 'bi-justify', shortcut: 'alignJustify', before: '\n<div style="text-align: justify;">\n', after: '\n</div>\n'},
                    {type: 'divider'}
                ],
                run(textarea, item) {
                    helpers.wrapSelection(textarea, item.before, item.after, t('placeholders.defaultAlignment', 'Text...'));
                }
            },
            preview: {
                title: t('actions.preview', 'Vorschau'),
                icon: 'bi-eye',
                run(textarea) {
                    helpers.toggleMode(textarea, 'toolbar');
                }
            }
        };

        const helpers = {
            escapeHtml(value) {
                return sharedConverters.escapeHtml(value);
            },
            ensurePluginStyles() {
                if ($('#bsMarkdownEditorRuntimeStyles').length > 0) {
                    helpers.installCodeCopyHandler();
                    return;
                }
                $('head').append([
                    "",
                    "<style id=\"bsMarkdownEditorRuntimeStyles\">",
                    ".bs-markdown-code-actions:hover .bs-markdown-code-language-badge,",
                    ".bs-markdown-code-copy:hover{opacity:1!important;}",
                    ".bs-markdown-shortcut-hint{font-size:.68rem;line-height:1;letter-spacing:-.01em;opacity:.62;}",
                    ".text-justify{text-align:justify!important;}",
                    "</style>",
                    ""
                ].join('\n'));
                helpers.installCodeCopyHandler();
            },
            installCodeCopyHandler() {
                if (!$(document).data('bsMarkdownEditorCodeCopyInstalled')) {
                    $(document).data('bsMarkdownEditorCodeCopyInstalled', true);
                    $(document).on('click.bsMarkdownEditorCodeCopy', '.bs-markdown-code-copy', function (event) {
                        event.preventDefault();
                        const button = this;
                        const codeNode = $(button).closest('pre').find('code').first().get(0);
                        const code = codeNode ? codeNode.textContent : '';

                        helpers.copyTextToClipboard(code, function () {
                            helpers.showCodeCopyFeedback(button);
                        });
                    });
                }
            },
            copyTextToClipboard(text, done) {
                const value = String(text || '');
                const clipboard = window.navigator && window.navigator.clipboard ? window.navigator.clipboard : null;

                if (clipboard && typeof clipboard.writeText === 'function') {
                    clipboard.writeText(value).then(function () {
                        if (typeof done === 'function') {
                            done();
                        }
                    }).catch(function () {
                        helpers.copyTextWithFallback(value, done);
                    });
                    return;
                }

                helpers.copyTextWithFallback(value, done);
            },
            copyTextWithFallback(text, done) {
                const $buffer = $('<textarea readonly></textarea>');
                $buffer.val(String(text || ''));
                $buffer.css({
                    position: 'fixed',
                    top: '-9999px',
                    left: '-9999px',
                    opacity: 0
                });
                $('body').append($buffer);
                $buffer.get(0).select();

                try {
                    document.execCommand('copy');
                    if (typeof done === 'function') {
                        done();
                    }
                } finally {
                    $buffer.remove();
                }
            },
            showCodeCopyFeedback(button) {
                const $button = $(button);
                const originalHtml = $button.html();
                const originalTitle = $button.attr('title') || '';

                $button.html('<i class="bi bi-check2"></i>');
                $button.attr('title', 'Copied');

                window.setTimeout(function () {
                    $button.html(originalHtml);
                    $button.attr('title', originalTitle);
                }, 1200);
            },
            sanitizeUrl(url) {
                return sharedConverters.sanitizeUrl(url);
            },
            renderInline(text) {
                return sharedConverters.renderInline(text);
            },
            renderMarkdown(markdown) {
                return sharedConverters.renderMarkdown(markdown);
            },
            getGroupSizeClass() {
                const size = String(settings.size || '').trim().toLowerCase();
                if (size === 'sm' || size === 'lg') {
                    return `btn-group-${size}`;
                }
                return '';
            },
            getShortcutDisplay(actionKey) {
                const shortcut = settings.shortcuts[actionKey];
                if (!shortcut) return '';

                const isMac = (typeof window !== 'undefined' && window.navigator && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform));
                const parts = shortcut.split('+');
                const displayParts = parts.map(function(part) {
                    part = part.trim().toLowerCase();
                    if (part === 'ctrl') return isMac ? '⌘' : 'Ctrl';
                    if (part === 'shift') return isMac ? '⇧' : 'Shift';
                    if (part === 'alt') return isMac ? '⌥' : 'Alt';
                    if (part === 'meta') return isMac ? '⌘' : 'Meta';
                    return part.toUpperCase();
                });

                return displayParts.join('+');
            },
            getButtonClass() {
                const btnClass = String(settings.btnClass || '').trim();
                const baseClass = btnClass === '' ? 'btn-outline-secondary' : btnClass;
                const size = String(settings.size || '').trim().toLowerCase();
                if (size === 'sm' || size === 'lg') {
                    return `${baseClass} btn-${size}`;
                }
                return baseClass;
            },
            getWrapperClass() {
                return String(settings.wrapperClass || '').trim();
            },

            getWrapperSelector() {
                return '.' + DEFAULT_WRAPPER_CLASS;
            },
            getResizeMode() {
                if (settings.resize === true) {
                    return 'vertical';
                }
                const resizeMode = String(settings.resize || '').trim().toLowerCase();
                if (resizeMode === 'vertical' || resizeMode === 'both') {
                    return resizeMode;
                }
                return 'none';
            },
            getResolvedActionKeys() {
                const allKeys = Object.keys(actions);
                if (settings.actions === 'all' || settings.actions == null || !Array.isArray(settings.actions)) {
                    return allKeys;
                }
                return settings.actions.filter(function (key, index) {
                    return allKeys.indexOf(key) !== -1 && settings.actions.indexOf(key) === index;
                });
            },
            getResolvedCustomActionEntries() {
                const customActions = settings.customActions;

                if (!customActions) {
                    return [];
                }

                if (Array.isArray(customActions)) {
                    return customActions
                        .map(function (action, index) {
                            return {key: action && action.key ? String(action.key) : `custom${index}`, action: action};
                        })
                        .filter(function (entry) {
                            return entry.action && typeof entry.action === 'object';
                        });
                }

                if (typeof customActions === 'object') {
                    return Object.keys(customActions).map(function (key) {
                        return {key: key, action: customActions[key]};
                    }).filter(function (entry) {
                        return entry.action && typeof entry.action === 'object';
                    });
                }

                return [];
            },
            getEditableElement(textarea) {
                return $(textarea).data('bsMarkdownEditorEditable') || null;
            },
            focusEditor(textarea) {
                const editable = helpers.getEditableElement(textarea);
                if (editable) {
                    editable.focus();
                    return;
                }
                textarea.focus();
            },
            getNodeIndex(node) {
                if (!node || !node.parentNode) {
                    return 0;
                }
                return Array.prototype.indexOf.call(node.parentNode.childNodes, node);
            },
            isEditablePlaceholderBreakBlock(node) {
                if (!node || node.nodeType !== Node.ELEMENT_NODE) {
                    return false;
                }
                const tag = String(node.tagName || '').toLowerCase();
                if (tag !== 'div' && tag !== 'p') {
                    return false;
                }
                return node.childNodes.length === 1 &&
                    node.childNodes[0].nodeType === Node.ELEMENT_NODE &&
                    String(node.childNodes[0].tagName || '').toLowerCase() === 'br';
            },
            getEditableNodeMarkdownLength(node, root) {
                if (!node) {
                    return 0;
                }
                if (node.nodeType === Node.TEXT_NODE) {
                    return String(node.nodeValue || '').length;
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tag = String(node.tagName || '').toLowerCase();
                    if (tag === 'br') {
                        return 1;
                    }
                    let length = 0;
                    if (tag === 'sup' || tag === 'sub') {
                        length += (`<${tag}>`).length;
                    }
                    Array.prototype.forEach.call(node.childNodes, function (child) {
                        length += helpers.getEditableNodeMarkdownLength(child, root);
                    });
                    if ((tag === 'div' || tag === 'p') && node !== root) {
                        if (!helpers.isEditablePlaceholderBreakBlock(node)) {
                            length += 1;
                        }
                    }
                    if (tag === 'sup' || tag === 'sub') {
                        length += (`</${tag}>`).length;
                    }
                    return length;
                }
                if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                    let len = 0;
                    Array.prototype.forEach.call(node.childNodes, function (child) {
                        len += helpers.getEditableNodeMarkdownLength(child, root);
                    });
                    return len;
                }
                return 0;
            },
            serializeEditableNode(node, root) {
                if (!node) {
                    return '';
                }
                if (node.nodeType === Node.TEXT_NODE) {
                    return String(node.nodeValue || '');
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tag = String(node.tagName || '').toLowerCase();
                    if (tag === 'br') {
                        return '\n';
                    }
                    let content = '';
                    Array.prototype.forEach.call(node.childNodes, function (child) {
                        content += helpers.serializeEditableNode(child, root);
                    });
                    if (tag === 'sup' || tag === 'sub') {
                        return `<${tag}>${content}</${tag}>`;
                    }
                    if ((tag === 'div' || tag === 'p') && node !== root) {
                        if (helpers.isEditablePlaceholderBreakBlock(node)) {
                            return '\n';
                        }
                        return content + '\n';
                    }
                    return content;
                }
                if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                    let fragment = '';
                    Array.prototype.forEach.call(node.childNodes, function (child) {
                        fragment += helpers.serializeEditableNode(child, root);
                    });
                    return fragment;
                }
                return '';
            },
            getEditableValue(editable) {
                if (!editable) {
                    return '';
                }
                let value = helpers.serializeEditableNode(editable, editable).replace(/\r\n?/g, '\n');
                if (value.endsWith('\n')) {
                    value = value.slice(0, -1);
                }
                return value;
            },
            getEditableSelectionOffsets(editable, fallbackOffsets = null) {
                const fallback = fallbackOffsets && typeof fallbackOffsets.start === 'number' && typeof fallbackOffsets.end === 'number'
                    ? {start: fallbackOffsets.start, end: fallbackOffsets.end}
                    : {start: 0, end: 0};
                if (!editable) {
                    return fallback;
                }
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    return fallback;
                }
                const range = selection.getRangeAt(0);
                if (!editable.contains(range.startContainer) || !editable.contains(range.endContainer)) {
                    return fallback;
                }
                const startRange = range.cloneRange();
                startRange.selectNodeContents(editable);
                startRange.setEnd(range.startContainer, range.startOffset);
                const endRange = range.cloneRange();
                endRange.selectNodeContents(editable);
                endRange.setEnd(range.endContainer, range.endOffset);
                return {
                    start: helpers.serializeEditableNode(startRange.cloneContents(), editable).length,
                    end: helpers.serializeEditableNode(endRange.cloneContents(), editable).length
                };
            },
            getRememberedEditableSelection(textarea) {
                const remembered = $(textarea).data('bsMarkdownEditorEditableSelection');
                if (!remembered || typeof remembered.start !== 'number' || typeof remembered.end !== 'number') {
                    return null;
                }
                return {start: remembered.start, end: remembered.end};
            },
            rememberEditableSelection(textarea) {
                const editable = helpers.getEditableElement(textarea);
                if (!editable) {
                    return;
                }
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    return;
                }
                const range = selection.getRangeAt(0);
                if (!editable.contains(range.startContainer) || !editable.contains(range.endContainer)) {
                    return;
                }
                const offsets = helpers.getEditableSelectionOffsets(editable);
                const valueLength = helpers.getEditableValue(editable).length;
                const clampedStart = Math.max(0, Math.min(valueLength, offsets.start));
                const clampedEnd = Math.max(clampedStart, Math.min(valueLength, offsets.end));
                $(textarea).data('bsMarkdownEditorEditableSelection', {start: clampedStart, end: clampedEnd});
                if (typeof textarea.setSelectionRange === 'function') {
                    textarea.setSelectionRange(clampedStart, clampedEnd);
                }
            },
            getEditableDomPointByMarkdownOffset(editable, offset) {
                const target = Math.max(0, offset);
                if (target === 0) {
                    return {container: editable, offset: 0};
                }
                let consumed = 0;
                let result = null;

                function walk(node) {
                    if (result) {
                        return;
                    }
                    if (node.nodeType === Node.TEXT_NODE) {
                        const textLength = String(node.nodeValue || '').length;
                        if (consumed + textLength >= target) {
                            result = {container: node, offset: target - consumed};
                            return;
                        }
                        consumed += textLength;
                        return;
                    }
                    if (node.nodeType !== Node.ELEMENT_NODE) {
                        return;
                    }
                    const tag = String(node.tagName || '').toLowerCase();
                    if (tag === 'br') {
                        if (consumed + 1 >= target) {
                            result = {container: node.parentNode, offset: helpers.getNodeIndex(node) + 1};
                            return;
                        }
                        consumed += 1;
                        return;
                    }
                    if (tag === 'sup' || tag === 'sub') {
                        const openLength = (`<${tag}>`).length;
                        if (consumed + openLength >= target) {
                            result = {container: node, offset: 0};
                            return;
                        }
                        consumed += openLength;
                    }
                    Array.prototype.forEach.call(node.childNodes, walk);
                    if ((tag === 'div' || tag === 'p') && node !== editable && !result) {
                        if (consumed + 1 >= target) {
                            result = {container: node.parentNode, offset: helpers.getNodeIndex(node) + 1};
                            return;
                        }
                        consumed += 1;
                    }
                    if (tag === 'sup' || tag === 'sub') {
                        const closeLength = (`</${tag}>`).length;
                        if (consumed + closeLength >= target) {
                            result = {container: node, offset: node.childNodes.length};
                            return;
                        }
                        consumed += closeLength;
                    }
                }

                walk(editable);
                return result || {container: editable, offset: editable.childNodes.length};
            },
            setEditableSelectionOffsets(editable, start, end) {
                if (!editable) {
                    return;
                }
                const textLength = helpers.getEditableNodeMarkdownLength(editable, editable);
                const safeStart = Math.max(0, Math.min(textLength, start));
                const safeEnd = Math.max(safeStart, Math.min(textLength, end));
                const startPoint = helpers.getEditableDomPointByMarkdownOffset(editable, safeStart);
                const endPoint = helpers.getEditableDomPointByMarkdownOffset(editable, safeEnd);
                const range = document.createRange();
                range.setStart(startPoint.container, startPoint.offset);
                range.setEnd(endPoint.container, endPoint.offset);
                const selection = window.getSelection();
                if (!selection) {
                    return;
                }
                selection.removeAllRanges();
                selection.addRange(range);
            },
            renderEditableHtml(markdown) {
                return helpers.escapeHtml(markdown == null ? '' : String(markdown))
                    .replace(/&lt;sub&gt;([\s\S]*?)&lt;\/sub&gt;/gi, '<sub>$1</sub>')
                    .replace(/&lt;sup&gt;([\s\S]*?)&lt;\/sup&gt;/gi, '<sup>$1</sup>')
                    .replace(/\n/g, '<br>');
            },
            insertTextIntoEditable(editable, text) {
                if (!editable) {
                    return;
                }
                editable.focus();

                if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                    document.execCommand('insertText', false, text);
                    return;
                }

                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    return;
                }

                const range = selection.getRangeAt(0);
                if (!editable.contains(range.startContainer) || !editable.contains(range.endContainer)) {
                    return;
                }

                const textNode = document.createTextNode(text);
                range.deleteContents();
                range.insertNode(textNode);
                range.setStart(textNode, text.length);
                range.setEnd(textNode, text.length);
                selection.removeAllRanges();
                selection.addRange(range);
            },
            getEditableTabInsertion(editable, tabSize = 4) {
                const offsets = helpers.getEditableSelectionOffsets(editable);
                const value = helpers.getEditableValue(editable);
                const safeStart = Math.max(0, Math.min(value.length, offsets.start));
                const lineStart = value.lastIndexOf('\n', Math.max(0, safeStart - 1)) + 1;
                const column = safeStart - lineStart;
                const remaining = tabSize - (column % tabSize);
                const spaceCount = remaining === 0 ? tabSize : remaining;

                return ' '.repeat(spaceCount);
            },
            syncTextareaFromEditable(textarea, source = 'editable') {
                const editable = helpers.getEditableElement(textarea);
                if (!editable) {
                    return;
                }
                const offsets = helpers.getEditableSelectionOffsets(editable, helpers.getRememberedEditableSelection(textarea));
                const value = helpers.getEditableValue(editable);
                const clampedStart = Math.max(0, Math.min(value.length, offsets.start));
                const clampedEnd = Math.max(clampedStart, Math.min(value.length, offsets.end));
                $(textarea).data('bsMarkdownEditorEditableSelection', {start: clampedStart, end: clampedEnd});
                helpers.withInternalChange(textarea, source, function () {
                    textarea.value = value;
                    textarea.setSelectionRange(clampedStart, clampedEnd);
                    $(textarea).trigger('input');
                });
            },
            syncEditableFromTextarea(textarea, preserveSelection = true) {
                const editable = helpers.getEditableElement(textarea);
                if (!editable) {
                    return;
                }
                const offsets = {start: textarea.selectionStart || 0, end: textarea.selectionEnd || 0};
                editable.innerHTML = helpers.renderEditableHtml(textarea.value);
                if (preserveSelection) {
                    helpers.setEditableSelectionOffsets(editable, offsets.start, offsets.end);
                }
                $(textarea).data('bsMarkdownEditorEditableSelection', offsets);
            },
            refreshPreview(textarea) {
                const $textarea = $(textarea);
                const $wrapper = $textarea.closest(helpers.getWrapperSelector());
                const $preview = $wrapper.find('.js-bs-parsedown-preview');
                if ($preview.length === 0 || !$preview.is(':visible')) {
                    return;
                }
                try {
                    $preview.html(`<div class="markdown">${helpers.renderMarkdown($textarea.val())}</div>`);
                } catch (error) {
                    $preview.html(`<div class="text-danger">${helpers.escapeHtml(t('preview.error', 'Vorschau konnte nicht gerendert werden.'))}</div>`);
                }
            },
            refreshRenderedState(textarea, preserveSelection = true) {
                helpers.syncEditableFromTextarea(textarea, preserveSelection);
                helpers.refreshPreview(textarea);
                helpers.updateStats(textarea);
            },
            commitExternalChange(textarea, source = 'external') {
                const valueLength = String(textarea.value || '').length;
                const selectionStart = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : valueLength;
                const selectionEnd = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : valueLength;
                const clampedStart = Math.max(0, Math.min(valueLength, selectionStart));
                const clampedEnd = Math.max(clampedStart, Math.min(valueLength, selectionEnd));
                $(textarea).data('bsMarkdownEditorEditableSelection', {start: clampedStart, end: clampedEnd});
                helpers.withInternalChange(textarea, source, function () {
                    textarea.setSelectionRange(clampedStart, clampedEnd);
                    $(textarea).trigger('input');
                });
            },
            installValuePropertyBridge(textarea) {
                const $textarea = $(textarea);
                if ($textarea.data('bsMarkdownEditorValueBridgeInstalled')) {
                    return;
                }
                const prototype = Object.getPrototypeOf(textarea);
                const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value') || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement && window.HTMLTextAreaElement.prototype, 'value');
                if (!descriptor || typeof descriptor.get !== 'function' || typeof descriptor.set !== 'function') {
                    return;
                }
                const nativeGet = descriptor.get.bind(textarea);
                const nativeSet = descriptor.set.bind(textarea);
                Object.defineProperty(textarea, 'value', {
                    configurable: true,
                    enumerable: descriptor.enumerable,
                    get() {
                        return nativeGet();
                    },
                    set(nextValue) {
                        const previousValue = nativeGet();
                        nativeSet(nextValue);
                        if (nativeGet() === previousValue || $textarea.data('bsMarkdownEditorInternalChange')) {
                            return;
                        }
                        helpers.commitExternalChange(textarea, 'external');
                    }
                });
                $textarea.data('bsMarkdownEditorValueBridgeInstalled', true);
            },
            installSetRangeTextBridge(textarea) {
                const $textarea = $(textarea);
                if ($textarea.data('bsMarkdownEditorSetRangeTextBridgeInstalled') || typeof textarea.setRangeText !== 'function') {
                    return;
                }
                const nativeSetRangeText = textarea.setRangeText.bind(textarea);
                textarea.setRangeText = function () {
                    const previousValue = textarea.value;
                    const result = nativeSetRangeText.apply(textarea, arguments);
                    if (textarea.value !== previousValue && !$textarea.data('bsMarkdownEditorInternalChange')) {
                        helpers.commitExternalChange(textarea, 'external');
                    }
                    return result;
                };
                $textarea.data('bsMarkdownEditorSetRangeTextBridgeInstalled', true);
            },
            installFormResetBridge(textarea) {
                const $textarea = $(textarea);
                const form = textarea.form;
                if (!form || $textarea.data('bsMarkdownEditorFormResetBridgeInstalled')) {
                    return;
                }
                $(form).on('reset.bsMarkdownEditor', function () {
                    const syncAfterReset = function () {
                        helpers.commitExternalChange(textarea, 'reset');
                    };
                    if (typeof window.requestAnimationFrame === 'function') {
                        window.requestAnimationFrame(syncAfterReset);
                        return;
                    }
                    window.setTimeout(syncAfterReset, 0);
                });
                $textarea.data('bsMarkdownEditorFormResetBridgeInstalled', true);
            },
            getTextareaPreviewSpacing(textarea) {
                const surface = helpers.getEditableElement(textarea) || textarea;
                const styles = window.getComputedStyle(surface);
                return {
                    paddingTop: styles.paddingTop,
                    paddingRight: styles.paddingRight,
                    paddingBottom: styles.paddingBottom,
                    paddingLeft: styles.paddingLeft
                };
            },
            withInternalChange(textarea, source, callback) {
                const $textarea = $(textarea);
                $textarea.data('bsMarkdownEditorInternalChange', true);
                $textarea.data('bsMarkdownEditorChangeSource', source || 'api');
                try {
                    callback();
                } finally {
                    $textarea.data('bsMarkdownEditorInternalChange', false);
                    $textarea.removeData('bsMarkdownEditorChangeSource');
                }
            },
            emitPluginEvent(textarea, eventName, payload) {
                const $textarea = $(textarea);
                const eventPayload = payload || {};
                $textarea.trigger(eventName, [eventPayload]);
                if (eventName !== 'any.bs.markdown-editor') {
                    $textarea.trigger('any.bs.markdown-editor', [{eventName: eventName, payload: eventPayload}]);
                }
            },
            isUserInitiatedChangeSource(source) {
                return source === 'editable' || source === 'toolbar' || source === 'history' || source === 'user';
            },
            updateStats(textarea) {
                const $stats = $(textarea).data('bsMarkdownEditorStatsEl');
                if (!$stats || $stats.length === 0) {
                    return;
                }
                const value = helpers.getValue(textarea) || '';
                const words = helpers.countWords(value);
                const mode = helpers.getMode(textarea);
                const statsHtml = `${t('stats.mode', 'Mode')}: ${mode} | ${value.length} ${t('stats.chars', 'chars')} / ${words} ${t('stats.words', 'words')}`;
                
                $stats.html(statsHtml);

                // Add shortcut info button
                let $infoBtn = $stats.parent().find('.js-bs-markdown-editor-info-btn');
                if ($infoBtn.length === 0) {
                    $infoBtn = $([
                        "<button type=\"button\" class=\"js-bs-markdown-editor-info-btn btn btn-link p-0 ms-2 text-decoration-none\" title=\"" + helpers.escapeHtml(t('stats.shortcuts', 'Keyboard shortcuts')) + "\">",
                        "<i class=\"bi bi-info-circle\"></i>",
                        "</button>"
                    ].join('\n'));
                    $stats.after($infoBtn);
                    $infoBtn.on('click', function() {
                        helpers.openShortcutsModal(textarea);
                    });
                }
            },
            getMode(textarea) {
                const $preview = $(textarea).closest(helpers.getWrapperSelector()).find('.js-bs-parsedown-preview');
                return $preview.is(':visible') ? 'preview' : 'editor';
            },
            setMode(textarea, mode, source = 'api') {
                const targetMode = String(mode || '').trim().toLowerCase();
                if (targetMode !== 'editor' && targetMode !== 'preview') {
                    return helpers.getMode(textarea);
                }
                const $textarea = $(textarea);
                const $wrapper = $textarea.closest(helpers.getWrapperSelector());
                const $preview = $wrapper.find('.js-bs-parsedown-preview');
                const $button = $wrapper.find('.js-bs-parsedown-preview-toggle');
                const $editor = $wrapper.find('.js-bs-parsedown-editor');
                const $actionButtons = $wrapper.find('.js-bs-parsedown-action');
                const currentMode = helpers.getMode(textarea);
                if (currentMode === targetMode) {
                    return currentMode;
                }
                if (targetMode === 'editor') {
                    $preview.addClass('d-none').hide().html('').css({height: '', overflowY: ''});
                    $editor.removeClass('d-none').show();
                    $actionButtons.prop('disabled', false).removeClass('disabled');
                    $button.removeClass('active btn-primary').addClass(helpers.getButtonClass());
                } else {
                    const previewSpacing = helpers.getTextareaPreviewSpacing(textarea);
                    const editable = helpers.getEditableElement(textarea);
                    const editorHeight = Math.max(settings.minHeight, Math.ceil($editor.outerHeight() || 0), Math.ceil((editable ? $(editable).outerHeight() : $textarea.outerHeight()) || 0));
                    $button.removeClass(helpers.getButtonClass()).addClass('active btn-primary');
                    $actionButtons.prop('disabled', true).addClass('disabled');
                    $editor.addClass('d-none').hide();
                    $preview.removeClass('d-none').show().css({
                        boxSizing: 'border-box',
                        height: editorHeight + 'px',
                        overflowY: 'auto',
                        paddingTop: previewSpacing.paddingTop,
                        paddingRight: previewSpacing.paddingRight,
                        paddingBottom: previewSpacing.paddingBottom,
                        paddingLeft: previewSpacing.paddingLeft
                    }).html(`<div class="text-body-secondary">${helpers.escapeHtml(t('preview.loading', 'Rendere Vorschau...'))}</div>`);
                    helpers.refreshPreview(textarea);
                }
                helpers.updateStats(textarea);
                helpers.emitPluginEvent(textarea, 'modeChange.bs.markdown-editor', {
                    mode: targetMode,
                    previousMode: currentMode,
                    source: source
                });
                return targetMode;
            },
            toggleMode(textarea, source = 'toolbar') {
                const nextMode = helpers.getMode(textarea) === 'preview' ? 'editor' : 'preview';
                return helpers.setMode(textarea, nextMode, source);
            },
            getValue(textarea) {
                return textarea.value;
            },
            setValue(textarea, value, source = 'api') {
                const nextValue = value == null ? '' : String(value);
                const selectionEnd = nextValue.length;
                helpers.withInternalChange(textarea, source, function () {
                    textarea.value = nextValue;
                    textarea.setSelectionRange(selectionEnd, selectionEnd);
                    $(textarea).trigger('input');
                    helpers.refreshRenderedState(textarea, true);
                    helpers.focusEditor(textarea);
                });
            },
            getSelection(textarea) {
                return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
            },
            renderListItem(item) {
                return sharedConverters.renderListItem(item);
            },
            isListLine(line) {
                return sharedConverters.isListLine(line);
            },
            getListItemData(line) {
                return sharedConverters.getListItemData(line);
            },
            renderListBlock(lines) {
                return sharedConverters.renderListBlock(lines);
            },
            renderListNodes(nodes) {
                return sharedConverters.renderListNodes(nodes);
            },
            isTaskListItem(item) {
                return sharedConverters.isTaskListItem(item);
            },
            ensureHistory(textarea) {
                let history = $(textarea).data('bsMarkdownEditorHistory');
                if (history) {
                    return history;
                }
                history = {stack: [], index: -1, lock: false};
                $(textarea).data('bsMarkdownEditorHistory', history);
                return history;
            },
            createHistoryState(textarea) {
                return {
                    value: textarea.value,
                    selectionStart: textarea.selectionStart,
                    selectionEnd: textarea.selectionEnd
                };
            },
            pushHistoryState(textarea, state) {
                const history = helpers.ensureHistory(textarea);
                if (history.lock) {
                    return;
                }
                const current = history.stack[history.index];
                if (current && current.value === state.value && current.selectionStart === state.selectionStart && current.selectionEnd === state.selectionEnd) {
                    return;
                }
                if (history.index < history.stack.length - 1) {
                    history.stack = history.stack.slice(0, history.index + 1);
                }
                history.stack.push(state);
                if (history.stack.length > 200) {
                    history.stack.shift();
                }
                history.index = history.stack.length - 1;
            },
            applyHistoryState(textarea, state) {
                const history = helpers.ensureHistory(textarea);
                history.lock = true;
                helpers.withInternalChange(textarea, 'history', function () {
                    textarea.value = state.value;
                    textarea.setSelectionRange(state.selectionStart, state.selectionEnd);
                    $(textarea).trigger('input');
                    helpers.refreshRenderedState(textarea, true);
                    helpers.focusEditor(textarea);
                });
                history.lock = false;
            },
            undo(textarea) {
                const history = helpers.ensureHistory(textarea);
                if (history.index <= 0) {
                    return;
                }
                history.index -= 1;
                helpers.applyHistoryState(textarea, history.stack[history.index]);
            },
            redo(textarea) {
                const history = helpers.ensureHistory(textarea);
                if (history.index >= history.stack.length - 1) {
                    return;
                }
                history.index += 1;
                helpers.applyHistoryState(textarea, history.stack[history.index]);
            },
            insertBlock(textarea, block, appendToSelection = false) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;
                const selected = value.substring(start, end);
                const before = value.substring(0, start);
                const after = value.substring(end);
                const needsLeadingNewline = before !== '' && !before.endsWith('\n');
                const needsTrailingNewline = after !== '' && !after.startsWith('\n');
                const prefix = needsLeadingNewline ? '\n' : '';
                const suffix = '\n\n';
                const content = appendToSelection && selected !== '' ? selected + '\n' + block : block;
                helpers.replaceSelection(textarea, prefix + content + suffix);
            },
            insertTemplate(textarea, template) {
                const selected = helpers.getSelection(textarea);
                if (selected !== '') {
                    helpers.replaceSelection(textarea, selected + '\n' + template);
                    return;
                }
                helpers.replaceSelection(textarea, template);
            },
            buildMarkdownTable(rows, columns) {
                const safeRows = Math.min(30, Math.max(1, parseInt(rows, 10) || 1));
                const safeColumns = Math.min(12, Math.max(1, parseInt(columns, 10) || 1));
                const header = [];
                const separator = [];
                const body = [];
                const tableColumnLabel = t('placeholders.tableColumn', 'Spalte');
                const tableValueLabel = t('placeholders.tableValue', 'Wert');
                for (let col = 1; col <= safeColumns; col += 1) {
                    header.push(`${tableColumnLabel} ${col}`);
                    separator.push('---');
                }
                for (let row = 1; row <= safeRows; row += 1) {
                    const cells = [];
                    for (let col = 1; col <= safeColumns; col += 1) {
                        cells.push(`${tableValueLabel} ${row}.${col}`);
                    }
                    body.push(cells);
                }
                const lines = [`| ${header.join(' | ')} |`, `| ${separator.join(' | ')} |`];
                body.forEach(function (cells) {
                    lines.push(`| ${cells.join(' | ')} |`);
                });
                return lines.join('\n');
            },
            getCalloutTypes() {
                return [
                    {value: 'NOTE', label: t('callouts.note.label', 'Note'), title: t('callouts.note.title', t('placeholders.defaultCallout', 'Hinweis'))},
                    {value: 'TIP', label: t('callouts.tip.label', 'Tip'), title: t('callouts.tip.title', 'Tip')},
                    {value: 'IMPORTANT', label: t('callouts.important.label', 'Important'), title: t('callouts.important.title', 'Important')},
                    {value: 'WARNING', label: t('callouts.warning.label', 'Warning'), title: t('callouts.warning.title', 'Warning')},
                    {value: 'CAUTION', label: t('callouts.caution.label', 'Caution'), title: t('callouts.caution.title', 'Caution')}
                ];
            },
            normalizeCalloutType(type) {
                const normalized = String(type || '').trim().toUpperCase();
                return ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'].indexOf(normalized) === -1 ? 'NOTE' : normalized;
            },
            buildMarkdownCallout(content, type = 'NOTE', title = '') {
                const calloutType = helpers.normalizeCalloutType(type);
                const fallbackTitle = helpers.getCalloutTypes().reduce(function (found, item) {
                    return found || (item.value === calloutType ? item.title : '');
                }, '') || t('placeholders.defaultCallout', 'Hinweis');
                const calloutTitle = String(title || '').trim() || fallbackTitle;
                const body = String(content || '').split('\n').map(function (line) {
                    return `> ${line}`;
                }).join('\n');
                return `> [!${calloutType}] ${calloutTitle}\n${body}`;
            },
            buildMarkdownDetails(content) {
                const summary = t('placeholders.defaultSummary', 'Zusammenfassung');
                return `<details>\n<summary>${helpers.escapeHtml(summary)}</summary>\n\n${String(content || '')}\n\n</details>`;
            },
            buildMarkdownDefinitionList(content) {
                const term = t('placeholders.defaultTerm', 'Begriff');
                return `<dl>\n<dt>${helpers.escapeHtml(term)}</dt>\n<dd>${String(content || '')}</dd>\n</dl>`;
            },
            normalizeImageDimensionValue(value) {
                const normalized = String(value || '').trim().toLowerCase();
                return /^\d+$/.test(normalized) || normalized === 'auto' ? normalized : '';
            },
            buildMarkdownImage(alt, url, width, height, align) {
                const attrs = [];
                const safeWidth = helpers.normalizeImageDimensionValue(width);
                const safeHeight = helpers.normalizeImageDimensionValue(height);
                const safeAlign = String(align || '').trim().toLowerCase();

                if (safeWidth !== '') {
                    attrs.push(`width=${safeWidth}`);
                }

                if (safeHeight !== '') {
                    attrs.push(`height=${safeHeight}`);
                }

                if (['left', 'right', 'center', 'none'].indexOf(safeAlign) !== -1 && safeAlign !== 'none') {
                    attrs.push(`align=${safeAlign}`);
                }

                return `![${sharedConverters.escapeMarkdownText(alt || '')}](${String(url || '').trim()})${attrs.length > 0 ? ` {${attrs.join(' ')}}` : ''}`;
            },
            insertImageWithPromptFallback(textarea) {
                const selected = helpers.getSelection(textarea);
                const alt = window.prompt(t('prompts.imageAlt', 'Alt-Text eingeben'), selected || t('placeholders.imageAlt', 'Bild'));
                if (alt === null) {
                    return;
                }
                const url = window.prompt(t('prompts.imageUrl', 'Bild-URL eingeben'), 'https://');
                if (!url) {
                    return;
                }
                helpers.insertBlock(textarea, helpers.buildMarkdownImage(alt, url, '', ''));
            },
            insertLinkWithPromptFallback(textarea) {
                const selected = helpers.getSelection(textarea) || t('placeholders.linkText', 'Linktext');
                const url = window.prompt(t('prompts.linkUrl', 'URL eingeben'), 'https://');
                if (!url) {
                    return;
                }
                helpers.replaceSelection(textarea, `[${selected}](${url})`, selected.length + 3, selected.length + url.length + 3);
            },
            buildMarkdownCodeBlock(language, code) {
                return `\`\`\`${String(language || '').trim()}\n${String(code || '')}\n\`\`\``;
            },
            insertCodeBlockWithPromptFallback(textarea) {
                const selected = helpers.getSelection(textarea);
                const languageInput = window.prompt(t('prompts.codeLang', 'Sprache (optional)'), '');
                if (languageInput === null) {
                    return;
                }
                const language = languageInput.trim();
                const code = selected === '' ? t('placeholders.code', 'code') : selected;
                helpers.insertBlock(textarea, helpers.buildMarkdownCodeBlock(language, code));
            },
            insertCalloutWithPromptFallback(textarea) {
                const selected = helpers.getSelection(textarea);
                const content = selected === '' ? t('placeholders.defaultCalloutText', 'Hinweistext') : selected;
                helpers.insertBlock(textarea, helpers.buildMarkdownCallout(content));
            },
            openCalloutModal(textarea) {
                if (!window.bootstrap || !window.bootstrap.Modal) {
                    helpers.insertCalloutWithPromptFallback(textarea);
                    return;
                }

                const selected = helpers.getSelection(textarea);
                const modalId = 'bsMarkdownEditorCalloutModal' + Math.random().toString(36).slice(2, 10);
                const optionsHtml = helpers.getCalloutTypes().map(function (item) {
                    return `<option value="${item.value}">${helpers.escapeHtml(item.label)}</option>`;
                }).join('');
                const defaultCalloutTitle = helpers.getCalloutTypes()[0].title;
                const $modal = $([
                    "",
                    "<div class=\"modal fade\" id=\"" + modalId + "\" tabindex=\"-1\" aria-labelledby=\"" + modalId + "Title\" aria-hidden=\"true\">",
                    "<div class=\"modal-dialog modal-dialog-centered\">",
                    "<div class=\"modal-content\">",
                    "<div class=\"modal-header\">",
                    "<h5 class=\"modal-title\" id=\"" + modalId + "Title\">" + helpers.escapeHtml(t('modal.calloutTitle', 'Hinweisbox einfügen')) + "</h5>",
                    "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\" aria-label=\"" + helpers.escapeHtml(t('modal.cancel', 'Abbrechen')) + "\"></button>",
                    "</div>",
                    "<div class=\"modal-body\">",
                    "<div class=\"mb-3\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Type\">" + helpers.escapeHtml(t('modal.calloutType', 'Typ')) + "</label>",
                    "<select id=\"" + modalId + "Type\" class=\"form-select js-bs-markdown-callout-type\">" + optionsHtml + "</select>",
                    "</div>",
                    "<div class=\"mb-3\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Heading\">" + helpers.escapeHtml(t('modal.calloutHeading', 'Titel')) + "</label>",
                    "<input id=\"" + modalId + "Heading\" class=\"form-control js-bs-markdown-callout-heading\" type=\"text\" value=\"" + helpers.escapeHtml(defaultCalloutTitle) + "\">",
                    "</div>",
                    "<div class=\"mb-0\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Text\">" + helpers.escapeHtml(t('modal.calloutText', 'Text')) + "</label>",
                    "<textarea id=\"" + modalId + "Text\" class=\"form-control js-bs-markdown-callout-text\" rows=\"4\">" + helpers.escapeHtml(selected || t('placeholders.defaultCalloutText', 'Hinweistext')) + "</textarea>",
                    "</div>",
                    "</div>",
                    "<div class=\"modal-footer\">",
                    "<button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">" + helpers.escapeHtml(t('modal.cancel', 'Abbrechen')) + "</button>",
                    "<button type=\"button\" class=\"btn btn-primary js-bs-markdown-callout-insert\">" + helpers.escapeHtml(t('modal.insert', 'Einfügen')) + "</button>",
                    "</div>",
                    "</div>",
                    "</div>",
                    "</div>",
                    ""
                ].join('\n'));
                const modalElement = $modal[0];
                const modalInstance = new window.bootstrap.Modal(modalElement);

                $modal.on('hidden.bs.modal', function () {
                    modalInstance.dispose();
                    $modal.remove();
                });
                $modal.on('shown.bs.modal', function () {
                    $modal.find('.js-bs-markdown-callout-type').trigger('focus');
                });
                $modal.find('.js-bs-markdown-callout-type').on('change', function () {
                    const type = $(this).val();
                    const calloutType = helpers.getCalloutTypes().find(function (item) {
                        return item.value === type;
                    });
                    $modal.find('.js-bs-markdown-callout-heading').val(calloutType ? calloutType.title : defaultCalloutTitle);
                });

                $modal.find('.js-bs-markdown-callout-insert').on('click', function () {
                    const type = $modal.find('.js-bs-markdown-callout-type').val();
                    const title = $modal.find('.js-bs-markdown-callout-heading').val();
                    const text = $modal.find('.js-bs-markdown-callout-text').val() || t('placeholders.defaultCalloutText', 'Hinweistext');
                    helpers.insertBlock(textarea, helpers.buildMarkdownCallout(text, type, title));
                    modalInstance.hide();
                });

                $modal.on('keydown', function (event) {
                    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                        event.preventDefault();
                        $modal.find('.js-bs-markdown-callout-insert').trigger('click');
                    }
                });

                $('body').append($modal);
                modalInstance.show();
            },
            openCodeBlockModal(textarea) {
                if (!window.bootstrap || !window.bootstrap.Modal) {
                    helpers.insertCodeBlockWithPromptFallback(textarea);
                    return;
                }

                const selected = helpers.getSelection(textarea);
                const modalId = 'bsMarkdownEditorCodeBlockModal' + Math.random().toString(36).slice(2, 10);
                const $modal = $([
                    "",
                    "<div class=\"modal fade\" id=\"" + modalId + "\" tabindex=\"-1\" aria-labelledby=\"" + modalId + "Title\" aria-hidden=\"true\">",
                    "<div class=\"modal-dialog modal-dialog-centered modal-sm\">",
                    "<div class=\"modal-content\">",
                    "<div class=\"modal-header\">",
                    "<h5 class=\"modal-title\" id=\"" + modalId + "Title\">" + helpers.escapeHtml(t('actions.codeBlock', 'Codeblock')) + "</h5>",
                    "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\" aria-label=\"" + helpers.escapeHtml(t('modal.cancel', 'Abbrechen')) + "\"></button>",
                    "</div>",
                    "<div class=\"modal-body\">",
                    "<div class=\"mb-0\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Language\">" + helpers.escapeHtml(t('prompts.codeLang', 'Sprache (optional)')) + "</label>",
                    "<input id=\"" + modalId + "Language\" class=\"form-control js-bs-markdown-code-language\" type=\"text\" placeholder=\"php\">",
                    "</div>",
                    "</div>",
                    "<div class=\"modal-footer\">",
                    "<button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">" + helpers.escapeHtml(t('modal.cancel', 'Abbrechen')) + "</button>",
                    "<button type=\"button\" class=\"btn btn-primary js-bs-markdown-code-insert\">" + helpers.escapeHtml(t('modal.insert', 'Einfügen')) + "</button>",
                    "</div>",
                    "</div>",
                    "</div>",
                    "</div>",
                    ""
                ].join('\n'));
                const modalElement = $modal[0];
                const modalInstance = new window.bootstrap.Modal(modalElement);

                $modal.on('hidden.bs.modal', function () {
                    modalInstance.dispose();
                    $modal.remove();
                });
                $modal.on('shown.bs.modal', function () {
                    $modal.find('.js-bs-markdown-code-language').trigger('focus').trigger('select');
                });

                $modal.find('.js-bs-markdown-code-insert').on('click', function () {
                    const language = $modal.find('.js-bs-markdown-code-language').val();
                    const code = selected === '' ? t('placeholders.code', 'code') : selected;
                    helpers.insertBlock(textarea, helpers.buildMarkdownCodeBlock(language, code));
                    modalInstance.hide();
                });

                $modal.on('keydown', function (event) {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        $modal.find('.js-bs-markdown-code-insert').trigger('click');
                    }
                });

                $('body').append($modal);
                modalInstance.show();
            },
            openLinkModal(textarea) {
                if (!window.bootstrap || !window.bootstrap.Modal) {
                    helpers.insertLinkWithPromptFallback(textarea);
                    return;
                }

                const selected = helpers.getSelection(textarea);
                const modalId = 'bsMarkdownEditorLinkModal' + Math.random().toString(36).slice(2, 10);
                const $modal = $([
                    "",
                    "<div class=\"modal fade\" id=\"" + modalId + "\" tabindex=\"-1\" aria-labelledby=\"" + modalId + "Title\" aria-hidden=\"true\">",
                    "<div class=\"modal-dialog modal-dialog-centered\">",
                    "<div class=\"modal-content\">",
                    "<div class=\"modal-header\">",
                    "<h5 class=\"modal-title\" id=\"" + modalId + "Title\">" + helpers.escapeHtml(t('modal.linkTitle', 'Link einfügen')) + "</h5>",
                    "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\" aria-label=\"" + helpers.escapeHtml(t('modal.cancel', 'Abbrechen')) + "\"></button>",
                    "</div>",
                    "<div class=\"modal-body\">",
                    "<div class=\"mb-3\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Url\">" + helpers.escapeHtml(t('modal.url', 'URL')) + "</label>",
                    "<input id=\"" + modalId + "Url\" class=\"form-control js-bs-markdown-link-url\" type=\"url\" value=\"https://\" required>",
                    "</div>",
                    "<div class=\"mb-3\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Text\">" + helpers.escapeHtml(t('modal.linkText', 'Linktext')) + "</label>",
                    "<input id=\"" + modalId + "Text\" class=\"form-control js-bs-markdown-link-text\" type=\"text\" value=\"" + helpers.escapeHtml(selected || t('placeholders.linkText', 'Linktext')) + "\">",
                    "</div>",
                    "</div>",
                    "<div class=\"modal-footer\">",
                    "<button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">" + helpers.escapeHtml(t('modal.cancel', 'Abbrechen')) + "</button>",
                    "<button type=\"button\" class=\"btn btn-primary js-bs-markdown-link-insert\">" + helpers.escapeHtml(t('modal.insert', 'Einfügen')) + "</button>",
                    "</div>",
                    "</div>",
                    "</div>",
                    "</div>",
                    ""
                ].join('\n'));
                const modalElement = $modal[0];
                const modalInstance = new window.bootstrap.Modal(modalElement);

                $modal.on('hidden.bs.modal', function () {
                    modalInstance.dispose();
                    $modal.remove();
                });
                $modal.on('shown.bs.modal', function () {
                    $modal.find('.js-bs-markdown-link-url').trigger('focus').trigger('select');
                });

                $modal.find('.js-bs-markdown-link-insert').on('click', function () {
                    const url = $modal.find('.js-bs-markdown-link-url').val();
                    if (!String(url || '').trim()) {
                        $modal.find('.js-bs-markdown-link-url').trigger('focus');
                        return;
                    }
                    const text = $modal.find('.js-bs-markdown-link-text').val() || url;
                    const markdown = `[${text}](${url})`;
                    helpers.replaceSelection(textarea, markdown, text.length + 3, text.length + url.length + 3);
                    modalInstance.hide();
                });

                $modal.on('keydown', function (event) {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        $modal.find('.js-bs-markdown-link-insert').trigger('click');
                    }
                });

                $('body').append($modal);
                modalInstance.show();
            },
            openImageModal(textarea) {
                if (!window.bootstrap || !window.bootstrap.Modal) {
                    helpers.insertImageWithPromptFallback(textarea);
                    return;
                }

                const selected = helpers.getSelection(textarea);
                const modalId = 'bsMarkdownEditorImageModal' + Math.random().toString(36).slice(2, 10);
                const $modal = $([
                    "",
                    "<div class=\"modal fade\" id=\"" + modalId + "\" tabindex=\"-1\" aria-labelledby=\"" + modalId + "Title\" aria-hidden=\"true\">",
                    "<div class=\"modal-dialog modal-dialog-centered\">",
                    "<div class=\"modal-content\">",
                    "<div class=\"modal-header\">",
                    "<h5 class=\"modal-title\" id=\"" + modalId + "Title\">" + helpers.escapeHtml(t('modal.imageTitle', 'Bild einfügen')) + "</h5>",
                    "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\" aria-label=\"" + helpers.escapeHtml(t('modal.cancel', 'Abbrechen')) + "\"></button>",
                    "</div>",
                    "<div class=\"modal-body\">",
                    "<div class=\"mb-3\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Url\">" + helpers.escapeHtml(t('modal.url', 'Bild-URL')) + "</label>",
                    "<input id=\"" + modalId + "Url\" class=\"form-control js-bs-markdown-image-url\" type=\"url\" value=\"https://\" required>",
                    "</div>",
                    "<div class=\"mb-3\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Alt\">" + helpers.escapeHtml(t('modal.alt', 'Alt-Text')) + "</label>",
                    "<input id=\"" + modalId + "Alt\" class=\"form-control js-bs-markdown-image-alt\" type=\"text\" value=\"" + helpers.escapeHtml(selected || t('placeholders.imageAlt', 'Bild')) + "\">",
                    "</div>",
                    "<div class=\"row g-3\">",
                    "<div class=\"col-sm-4\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Width\">" + helpers.escapeHtml(t('modal.width', 'Breite')) + "</label>",
                    "<input id=\"" + modalId + "Width\" class=\"form-control js-bs-markdown-image-width\" type=\"text\" inputmode=\"numeric\" placeholder=\"320\">",
                    "</div>",
                    "<div class=\"col-sm-4\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Height\">" + helpers.escapeHtml(t('modal.height', 'Höhe')) + "</label>",
                    "<input id=\"" + modalId + "Height\" class=\"form-control js-bs-markdown-image-height\" type=\"text\" inputmode=\"numeric\" placeholder=\"180\">",
                    "</div>",
                    "<div class=\"col-sm-4\">",
                    "<label class=\"form-label\" for=\"" + modalId + "Align\">" + helpers.escapeHtml(t('modal.align', 'Ausrichtung')) + "</label>",
                    "<select id=\"" + modalId + "Align\" class=\"form-select js-bs-markdown-image-align\">",
                    "<option value=\"\">" + helpers.escapeHtml(t('modal.alignNone', 'Keine')) + "</option>",
                    "<option value=\"left\">" + helpers.escapeHtml(t('modal.alignLeft', 'Links')) + "</option>",
                    "<option value=\"center\">" + helpers.escapeHtml(t('modal.alignCenter', 'Zentriert')) + "</option>",
                    "<option value=\"right\">" + helpers.escapeHtml(t('modal.alignRight', 'Rechts')) + "</option>",
                    "</select>",
                    "</div>",
                    "</div>",
                    "<div class=\"form-text mt-2\">" + helpers.escapeHtml(t('modal.imageDimensionsHelp', 'Zahlenwerte sind Pixel; auto ist erlaubt.')) + "</div>",
                    "</div>",
                    "<div class=\"modal-footer\">",
                    "<button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">" + helpers.escapeHtml(t('modal.cancel', 'Abbrechen')) + "</button>",
                    "<button type=\"button\" class=\"btn btn-primary js-bs-markdown-image-insert\">" + helpers.escapeHtml(t('modal.insert', 'Einfügen')) + "</button>",
                    "</div>",
                    "</div>",
                    "</div>",
                    "</div>",
                    ""
                ].join('\n'));
                const modalElement = $modal[0];
                const modalInstance = new window.bootstrap.Modal(modalElement);

                $modal.on('hidden.bs.modal', function () {
                    modalInstance.dispose();
                    $modal.remove();
                });
                $modal.on('shown.bs.modal', function () {
                    $modal.find('.js-bs-markdown-image-url').trigger('focus').trigger('select');
                });

                $modal.find('.js-bs-markdown-image-insert').on('click', function () {
                    const url = $modal.find('.js-bs-markdown-image-url').val();
                    if (!String(url || '').trim()) {
                        $modal.find('.js-bs-markdown-image-url').trigger('focus');
                        return;
                    }
                    const markdown = helpers.buildMarkdownImage(
                        $modal.find('.js-bs-markdown-image-alt').val(),
                        url,
                        $modal.find('.js-bs-markdown-image-width').val(),
                        $modal.find('.js-bs-markdown-image-height').val(),
                        $modal.find('.js-bs-markdown-image-align').val()
                    );
                    helpers.insertBlock(textarea, markdown);
                    modalInstance.hide();
                });

                $modal.on('keydown', function (event) {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        $modal.find('.js-bs-markdown-image-insert').trigger('click');
                    }
                });

                $('body').append($modal);
                modalInstance.show();
            },
            openShortcutsModal(textarea) {
                if (!window.bootstrap || !window.bootstrap.Modal) {
                    return;
                }

                const modalId = 'bsMarkdownEditorShortcutsModal' + Math.random().toString(36).slice(2, 10);
                let rowsHtml = '';

                // Collect all shortcuts
                const shortcuts = settings.shortcuts;
                const shortcutEntries = [];

                for (const actionKey in shortcuts) {
                    const shortcut = shortcuts[actionKey];
                    if (!shortcut) continue;

                    let title = '';
                    let action = actions[actionKey] || settings.customActions[actionKey];

                    if (action) {
                        title = action.title || actionKey;
                    } else {
                        // Search in sub-items
                        for (const aKey in actions) {
                            if (actions[aKey].items) {
                                const foundItem = actions[aKey].items.find(i => i.shortcut === actionKey);
                                if (foundItem) {
                                    title = foundItem.label || actionKey;
                                    break;
                                }
                            }
                        }
                    }

                    if (title) {
                        shortcutEntries.push({
                            title: title,
                            display: helpers.getShortcutDisplay(actionKey)
                        });
                    }
                }

                // Sort by title
                shortcutEntries.sort((a, b) => a.title.localeCompare(b.title));

                shortcutEntries.forEach(entry => {
                    rowsHtml += [
                        "",
                        "<tr>",
                        "<td>" + helpers.escapeHtml(entry.title) + "</td>",
                        "<td class=\"text-end\"><kbd>" + helpers.escapeHtml(entry.display) + "</kbd></td>",
                        "</tr>"
                    ].join('\n');
                });

                const $modal = $([
                    "",
                    "<div class=\"modal fade\" id=\"" + modalId + "\" tabindex=\"-1\" aria-labelledby=\"" + modalId + "Title\" aria-hidden=\"true\">",
                    "<div class=\"modal-dialog modal-dialog-centered modal-dialog-scrollable\">",
                    "<div class=\"modal-content\">",
                    "<div class=\"modal-header\">",
                    "<h5 class=\"modal-title\" id=\"" + modalId + "Title\">" + helpers.escapeHtml(t('modal.shortcutsTitle', 'Tastenkombinationen')) + "</h5>",
                    "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\" aria-label=\"" + helpers.escapeHtml(t('modal.cancel', 'Abbrechen')) + "\"></button>",
                    "</div>",
                    "<div class=\"modal-body p-0\">",
                    "<table class=\"table table-striped table-hover mb-0\">",
                    "<tbody>",
                    "" + rowsHtml,
                    "</tbody>",
                    "</table>",
                    "</div>",
                    "<div class=\"modal-footer\">",
                    "<button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">" + helpers.escapeHtml(t('modal.close', 'Schließen')) + "</button>",
                    "</div>",
                    "</div>",
                    "</div>",
                    "</div>",
                    ""
                ].join('\n'));
                const modalElement = $modal[0];
                const modalInstance = new window.bootstrap.Modal(modalElement);

                $modal.on('hidden.bs.modal', function () {
                    modalInstance.dispose();
                    $modal.remove();
                });

                $('body').append($modal);
                modalInstance.show();
            },
            replaceSelection(textarea, replacement, selectionStartOffset = 0, selectionEndOffset = replacement.length, source = 'toolbar') {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;
                helpers.withInternalChange(textarea, source, function () {
                    textarea.value = value.substring(0, start) + replacement + value.substring(end);
                    textarea.setSelectionRange(start + selectionStartOffset, start + selectionEndOffset);
                    $(textarea).data('bsMarkdownEditorEditableSelection', {
                        start: start + selectionStartOffset,
                        end: start + selectionEndOffset
                    });
                    $(textarea).trigger('input');
                    helpers.refreshRenderedState(textarea, true);
                    helpers.focusEditor(textarea);
                });
            },
            wrapSelection(textarea, before, after, placeholder) {
                const selected = helpers.getSelection(textarea);
                const content = selected === '' ? placeholder : selected;
                const replacement = `${before}${content}${after}`;
                helpers.replaceSelection(textarea, replacement, before.length, before.length + content.length);
            },
            stripListPrefix(line) {
                const match = String(line).match(/^(\s*)(?:[-*+]\s+|\d+\.\s+)(.*)$/);
                if (!match) {
                    return line;
                }
                return `${match[1]}${match[2]}`;
            },
            stripHeadingPrefix(line) {
                const match = String(line).match(/^(\s{0,3})#{1,6}\s+(.*)$/);
                if (!match) {
                    return line;
                }
                return `${match[1]}${match[2]}`;
            },
            transformSelectedLines(textarea, transform) {
                const value = textarea.value;
                const selectionStart = textarea.selectionStart;
                const selectionEnd = textarea.selectionEnd;
                const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
                const lineEndIndex = value.indexOf('\n', selectionEnd);
                const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
                const selectedLines = value.substring(lineStart, lineEnd).split('\n');
                const transformed = selectedLines.map(transform).join('\n');
                const startOffset = selectionStart - lineStart;
                const endOffset = startOffset + transformed.length;
                textarea.setSelectionRange(lineStart, lineEnd);
                helpers.replaceSelection(textarea, transformed, startOffset, endOffset);
            },
            indentLines(textarea) {
                helpers.transformSelectedLines(textarea, function (line) {
                    if (line.trim() === '') {
                        return line;
                    }
                    return '  ' + line;
                });
            },
            outdentLines(textarea) {
                helpers.transformSelectedLines(textarea, function (line) {
                    if (line.startsWith('\t')) {
                        return line.slice(1);
                    }
                    if (line.startsWith('  ')) {
                        return line.slice(2);
                    }
                    if (line.startsWith(' ')) {
                        return line.slice(1);
                    }
                    return line;
                });
            },
            prefixLines(textarea, prefix) {
                const selected = helpers.getSelection(textarea);
                const content = selected === '' ? t('placeholders.defaultText', 'Text') : selected;
                const replacement = content.split('\n').map(function (line) {
                    if (line.trim() === '') {
                        return line;
                    }
                    return prefix + helpers.stripListPrefix(line).trimStart();
                }).join('\n');
                helpers.replaceSelection(textarea, replacement);
            },
            prefixNumberedLines(textarea) {
                const selected = helpers.getSelection(textarea);
                const content = selected === '' ? t('placeholders.defaultItem', 'Eintrag') : selected;
                let counter = 1;
                const replacement = content.split('\n').map(function (line) {
                    if (line.trim() === '') {
                        return line;
                    }
                    const normalized = helpers.stripListPrefix(line).trimStart();
                    const value = `${counter}. ${normalized}`;
                    counter += 1;
                    return value;
                }).join('\n');
                helpers.replaceSelection(textarea, replacement);
            },
            clearSelectedFormatting(textarea) {
                const selected = helpers.getSelection(textarea);
                if (selected === '') {
                    return;
                }
                const cleaned = helpers.removeInlineFormatting(selected);
                helpers.replaceSelection(textarea, cleaned, 0, cleaned.length);
            },
            toggleTaskLines(textarea) {
                helpers.transformSelectedLines(textarea, function (line) {
                    const taskMatch = String(line).match(/^(\s*)(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s+(.*)$/);
                    if (taskMatch) {
                        const marker = taskMatch[2].toLowerCase() === 'x' ? ' ' : 'x';
                        return `${taskMatch[1]}- [${marker}] ${taskMatch[3]}`;
                    }
                    if (line.trim() === '') {
                        return line;
                    }
                    const indentMatch = String(line).match(/^(\s*)(.*)$/);
                    const indent = indentMatch ? indentMatch[1] : '';
                    const content = helpers.stripListPrefix(indentMatch ? indentMatch[2] : line).trimStart();
                    return `${indent}- [ ] ${content}`;
                });
            },
            removeInlineFormatting(text) {
                return String(text || '')
                    .replace(/<\s*\/?\s*(sup|sub)\s*>/gi, '')
                    .replace(/~~(.+?)~~/g, '$1')
                    .replace(/==(.+?)==/g, '$1')
                    .replace(/\*\*(.+?)\*\*/g, '$1')
                    .replace(/(^|[\s(])_([^_]+)_(?=$|[\s).,!?:;])/g, '$1$2')
                    .replace(/(^|[\s(])\*([^*]+)\*(?=$|[\s).,!?:;])/g, '$1$2')
                    .replace(/`([^`]+)`/g, '$1');
            },
            stripMarkdownForWordCount(text) {
                const normalized = String(text || '').replace(/\r\n?/g, '\n');
                const withoutCodeFences = normalized.replace(/```[\s\S]*?```/g, ' ');
                return helpers.removeInlineFormatting(withoutCodeFences)
                    .replace(/^\s{0,3}(#{1,6})\s+/gm, '')
                    .replace(/^\s{0,3}(?:[-*_])\s*(?:\1\s*){2,}$/gm, ' ')
                    .replace(/^\s*>\s?/gm, '')
                    .replace(/^\s{0,3}(?:[-*+]\s+|\d+[.)]\s+)/gm, '')
                    .replace(/^\s{0,3}```/gm, ' ')
                    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, ' ')
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
                    .replace(/[~#*_`>|\[\](){}]+/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            },
            countWords(text) {
                const html = sharedConverters.renderMarkdown(String(text || ''));
                const $container = $('<div></div>').html(html);
                $container.find('br').replaceWith(' ');
                const plain = $container.text().replace(/\s+/g, ' ').trim();
                if (plain === '') {
                    return 0;
                }
                return plain.split(/\s+/).length;
            }
        };

        return this.each(function () {
            const textarea = this;
            const $textarea = $(textarea);
            if ($textarea.data('bsMarkdownEditorInitialized')) {
                return;
            }
            $textarea.data('bsMarkdownEditorInitialized', true);
            helpers.ensurePluginStyles();

            const wrapperClass = helpers.getWrapperClass();
            const wrapperClasses = [DEFAULT_WRAPPER_CLASS]
                .concat(wrapperClass.split(/\s+/).filter(Boolean))
                .join(' ');
            $textarea.wrap($(`<div class="${wrapperClasses}"></div>`));
            const $wrapperRef = $textarea.closest(helpers.getWrapperSelector());
            const $editor = $('<div class="js-bs-parsedown-editor"></div>');
            $textarea.wrap($editor);
            const $editorRef = $textarea.closest('.js-bs-parsedown-editor');
            const $editable = $(`<div class="js-bs-parsedown-editable form-control" contenteditable="true" spellcheck="true" aria-label="${helpers.escapeHtml(t('actions.textStyles', 'Textstil'))}"></div>`);
            const resizeMode = helpers.getResizeMode();
            $editable.css({
                minHeight: settings.minHeight + 'px',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                overflow: resizeMode === 'none' ? 'hidden' : 'auto',
                resize: resizeMode
            });
            $editorRef.prepend($editable);
            $textarea.addClass('visually-hidden js-bs-parsedown-source').attr('aria-hidden', 'true').css({
                position: 'absolute',
                left: '-9999px',
                top: '0',
                width: '1px',
                height: '1px',
                opacity: 0
            });
            $textarea.data('bsMarkdownEditorEditable', $editable.get(0));
            helpers.installValuePropertyBridge(textarea);
            helpers.installSetRangeTextBridge(textarea);
            helpers.installFormResetBridge(textarea);

            if (settings.showStats) {
                const $statsWrap = $('<div class="d-flex justify-content-end mt-2"></div>');
                const $stats = $('<span class="js-bs-parsedown-stats badge rounded-pill bg-body-tertiary text-body border border-secondary-subtle fw-normal"></span>');
                $statsWrap.append($stats);
                $editorRef.append($statsWrap);
                $textarea.data('bsMarkdownEditorStatsEl', $stats);
            }

            helpers.refreshRenderedState(textarea, false);

            $editable.on('input.bsMarkdownEditorEditable', function () {
                helpers.syncTextareaFromEditable(textarea, 'editable');
                helpers.rememberEditableSelection(textarea);
                if (/<\/?(sup|sub)>/i.test(textarea.value)) {
                    helpers.syncEditableFromTextarea(textarea, true);
                }
            });

            $editable.on('keyup.bsMarkdownEditorEditable mouseup.bsMarkdownEditorEditable touchend.bsMarkdownEditorEditable focus.bsMarkdownEditorEditable', function () {
                helpers.rememberEditableSelection(textarea);
            });

            $editable.on('keydown.bsMarkdownEditorEditable', function (e) {
                if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    helpers.insertTextIntoEditable($editable.get(0), helpers.getEditableTabInsertion($editable.get(0), 4));
                    helpers.syncTextareaFromEditable(textarea, 'editable');
                    helpers.rememberEditableSelection(textarea);
                    return;
                }

                const isCtrl = e.ctrlKey || e.metaKey;
                const isAlt = e.altKey;
                const isShift = e.shiftKey;
                if (!isCtrl && !isAlt) return;

                let key = e.key.toLowerCase();
                
                // Use e.code for digits to get the digit even if Shift is pressed
                if (e.code && e.code.startsWith('Digit')) {
                    key = e.code.replace('Digit', '');
                }

                // Normalizing key for Alt+U which might produce characters like 'µ' on some layouts
                if (isAlt && !isCtrl && e.code === 'KeyU') {
                    key = 'u';
                }

                // Normalizing keys for common combinations to ensure they are caught correctly regardless of layout shifts
                if (isCtrl && !isAlt) {
                    if (e.code && e.code.startsWith('Key')) {
                        key = e.code.replace('Key', '').toLowerCase();
                    }
                }

                const pressedShortcut = (isCtrl ? 'ctrl+' : '') + (isAlt ? 'alt+' : '') + (isShift ? 'shift+' : '') + key;

                for (let actionKey in settings.shortcuts) {
                    if (settings.shortcuts[actionKey] === pressedShortcut) {
                        let action = actions[actionKey] || settings.customActions[actionKey];
                        let item = null;

                        if (!action) {
                            // Search in sub-items (like headings)
                            for (let aKey in actions) {
                                if (actions[aKey].items) {
                                    const foundItem = actions[aKey].items.find(i => i.shortcut === actionKey);
                                    if (foundItem) {
                                        action = actions[aKey];
                                        item = foundItem;
                                        break;
                                    }
                                }
                            }
                        }

                        if (action && typeof action.run === 'function') {
                            e.preventDefault();
                            e.stopPropagation();
                            action.run(textarea, item);
                            return;
                        }
                    }
                }
            });

            $editable.on('paste.bsMarkdownEditorEditable', function (e) {
                e.preventDefault();
                const clipboardData = e.originalEvent && e.originalEvent.clipboardData ? e.originalEvent.clipboardData : window.clipboardData;
                const text = clipboardData ? (clipboardData.getData('text/plain') || '') : '';
                if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
                    document.execCommand('insertText', false, text);
                } else {
                    const selection = window.getSelection();
                    if (!selection || selection.rangeCount === 0) {
                        return;
                    }
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(text));
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                helpers.syncTextareaFromEditable(textarea, 'editable');
                helpers.rememberEditableSelection(textarea);
                if (/<\/?(sup|sub)>/i.test(textarea.value)) {
                    helpers.syncEditableFromTextarea(textarea, true);
                }
            });

            helpers.pushHistoryState(textarea, helpers.createHistoryState(textarea));
            $textarea.on('input.bsMarkdownEditorHistory', function () {
                helpers.pushHistoryState(textarea, helpers.createHistoryState(textarea));
                const source = $textarea.data('bsMarkdownEditorChangeSource') || 'unknown';
                if (source !== 'editable') {
                    helpers.refreshRenderedState(textarea, source === 'external' || source === 'reset');
                } else {
                    helpers.refreshPreview(textarea);
                    helpers.updateStats(textarea);
                }
                helpers.emitPluginEvent(textarea, 'change.bs.markdown-editor', {source: source, value: textarea.value});
                if (helpers.isUserInitiatedChangeSource(source)) {
                    helpers.emitPluginEvent(textarea, 'userChange.bs.markdown-editor', {source: source, value: textarea.value});
                }
            });

            const groupSizeClass = helpers.getGroupSizeClass();
            const buttonClassBase = `btn ${helpers.getButtonClass()}`;
            const $toolbar = $('<div class="btn-toolbar mb-2 d-flex flex-wrap justify-content-between align-items-start gap-2 w-100" role="toolbar"></div>');
            const $toolbarLeft = $('<div class="d-flex flex-wrap align-items-center gap-1 flex-grow-1"></div>');
            const $toolbarRight = $('<div class="d-flex flex-wrap align-items-center gap-1"></div>');
            const $toolbarRightCustom = $('<div class="d-flex flex-wrap align-items-center gap-1"></div>');
            const resolvedActionKeys = helpers.getResolvedActionKeys();
            const groupedInlineStyleKeys = ['bold', 'italic', 'textStyles', 'alignment', 'code', 'codeBlock', 'clearFormatting'];
            const groupedInsertKeys = ['link', 'image', 'callout', 'details', 'definitionList'];
            const groupedListKeys = ['ul', 'ol', 'taskList', 'toggleTask'];
            let inlineStylesDropdownRendered = false;
            let insertDropdownRendered = false;
            let listDropdownRendered = false;

            $toolbar.on('mousedown.bsMarkdownEditorSelection touchstart.bsMarkdownEditorSelection', function () {
                helpers.rememberEditableSelection(textarea);
            });

            resolvedActionKeys.forEach(function (key) {
                const action = actions[key];
                if (key === 'preview' && !settings.preview) {
                    return;
                }

                if (groupedInlineStyleKeys.indexOf(key) !== -1) {
                    if (inlineStylesDropdownRendered) {
                        return;
                    }
                    inlineStylesDropdownRendered = true;
                    const inlineStyleItems = [];
                    if (resolvedActionKeys.indexOf('bold') !== -1 && actions.bold) {
                        inlineStyleItems.push({label: actions.bold.title, icon: actions.bold.icon, shortcut: helpers.getShortcutDisplay('bold'), run() { actions.bold.run(textarea); }});
                    }
                    if (resolvedActionKeys.indexOf('italic') !== -1 && actions.italic) {
                        inlineStyleItems.push({label: actions.italic.title, icon: actions.italic.icon, shortcut: helpers.getShortcutDisplay('italic'), run() { actions.italic.run(textarea); }});
                    }
                    if (resolvedActionKeys.indexOf('textStyles') !== -1 && actions.textStyles && Array.isArray(actions.textStyles.items)) {
                        actions.textStyles.items.forEach(function (item) {
                            inlineStyleItems.push({
                                label: item.label,
                                icon: item.icon || actions.textStyles.icon,
                                shortcut: item.shortcut ? helpers.getShortcutDisplay(item.shortcut) : '',
                                run() { actions.textStyles.run(textarea, item); }
                            });
                        });
                    }
                    if (resolvedActionKeys.indexOf('alignment') !== -1 && actions.alignment && Array.isArray(actions.alignment.items)) {
                        if (inlineStyleItems.length > 0) {
                            inlineStyleItems.push({type: 'divider'});
                        }
                        actions.alignment.items.forEach(function (item) {
                            if (item.type === 'divider') {
                                inlineStyleItems.push({type: 'divider'});
                                return;
                            }
                            inlineStyleItems.push({
                                label: item.label,
                                icon: item.icon || actions.alignment.icon,
                                shortcut: item.shortcut ? helpers.getShortcutDisplay(item.shortcut) : '',
                                run() { actions.alignment.run(textarea, item); }
                            });
                        });
                    }
                    if (resolvedActionKeys.indexOf('code') !== -1 && actions.code) {
                        inlineStyleItems.push({label: actions.code.title, icon: actions.code.icon, shortcut: helpers.getShortcutDisplay('code'), run() { actions.code.run(textarea); }});
                    }
                    if (resolvedActionKeys.indexOf('codeBlock') !== -1 && actions.codeBlock) {
                        inlineStyleItems.push({label: actions.codeBlock.title, icon: actions.codeBlock.icon, shortcut: helpers.getShortcutDisplay('codeBlock'), run() { actions.codeBlock.run(textarea); }});
                    }
                    if (resolvedActionKeys.indexOf('clearFormatting') !== -1 && actions.clearFormatting) {
                        if (inlineStyleItems.length > 0) {
                            inlineStyleItems.push({type: 'divider'});
                        }
                        inlineStyleItems.push({label: actions.clearFormatting.title, icon: actions.clearFormatting.icon, shortcut: helpers.getShortcutDisplay('clearFormatting'), run() { actions.clearFormatting.run(textarea); }});
                    }

                    if (inlineStyleItems.length > 1) {
                        const dropdownId = 'bsMarkdownEditorInlineStyles' + Math.random().toString(36).slice(2, 10);
                        const $dropdown = $([
                            "",
                            "<div class=\"btn-group " + groupSizeClass + "\" role=\"group\">",
                            "<button type=\"button\"",
                            "class=\"" + buttonClassBase + "p-1 dropdown-toggle js-bs-parsedown-action\"",
                            "data-bs-toggle=\"dropdown\"",
                            "aria-expanded=\"false\"",
                            "id=\"" + dropdownId + "\"",
                            "title=\"" + t('actions.textStyles', 'Textstil') + "\">",
                            "<i class=\"bi bi-type-bold\"></i>",
                            "</button>",
                            "<ul class=\"dropdown-menu\" aria-labelledby=\"" + dropdownId + "\"></ul>",
                            "</div>",
                            ""
                        ].join('\n'));
                        const $menu = $dropdown.find('.dropdown-menu');
                        inlineStyleItems.forEach(function (item) {
                            if (item.type === 'divider') {
                                $menu.append('<li><hr class="dropdown-divider"></li>');
                                return;
                            }
                            const shortcutHtml = item.shortcut ? `<span class="float-end ms-4 text-body-secondary bs-markdown-shortcut-hint">${item.shortcut}</span>` : '';
                            const $link = $(`<a href="#" class="dropdown-item d-flex justify-content-between align-items-center"><span class="d-flex align-items-center"><i class="bi ${item.icon} me-2"></i>${item.label}</span>${shortcutHtml}</a>`);
                            $link.on('click', function (e) {
                                e.preventDefault();
                                helpers.syncTextareaFromEditable(textarea, 'editableSelection');
                                item.run();
                                $dropdown.find('[data-bs-toggle="dropdown"]').dropdown('hide');
                            });
                            $menu.append($('<li></li>').append($link));
                        });
                        $toolbarLeft.append($dropdown);
                        return;
                    }
                }

                if (groupedListKeys.indexOf(key) !== -1) {
                    if (listDropdownRendered) {
                        return;
                    }
                    listDropdownRendered = true;
                    const availableListKeys = groupedListKeys.filter(function (listKey) {
                        return resolvedActionKeys.indexOf(listKey) !== -1 && actions[listKey];
                    });
                    if (availableListKeys.length > 1) {
                        const dropdownId = 'bsMarkdownEditorLists' + Math.random().toString(36).slice(2, 10);
                        const $dropdown = $([
                            "",
                            "<div class=\"btn-group " + groupSizeClass + "\" role=\"group\">",
                            "<button type=\"button\"",
                            "class=\"" + buttonClassBase + "p-1 dropdown-toggle js-bs-parsedown-action\"",
                            "data-bs-toggle=\"dropdown\"",
                            "aria-expanded=\"false\"",
                            "id=\"" + dropdownId + "\"",
                            "title=\"" + t('actions.lists', 'Listen') + "\">",
                            "<i class=\"bi bi-list-task\"></i>",
                            "</button>",
                            "<ul class=\"dropdown-menu\" aria-labelledby=\"" + dropdownId + "\"></ul>",
                            "</div>",
                            ""
                        ].join('\n'));
                        const $menu = $dropdown.find('.dropdown-menu');
                        availableListKeys.forEach(function (listKey) {
                            const listAction = actions[listKey];
                            const shortcut = helpers.getShortcutDisplay(listKey);
                            const shortcutHtml = shortcut ? `<span class="float-end ms-4 text-body-secondary bs-markdown-shortcut-hint">${shortcut}</span>` : '';
                            const $link = $(`<a href="#" class="dropdown-item d-flex justify-content-between align-items-center"><span class="d-flex align-items-center"><i class="bi ${listAction.icon} me-2"></i>${listAction.title}</span>${shortcutHtml}</a>`);
                            $link.on('click', function (e) {
                                e.preventDefault();
                                helpers.syncTextareaFromEditable(textarea, 'editableSelection');
                                listAction.run(textarea);
                                $dropdown.find('[data-bs-toggle="dropdown"]').dropdown('hide');
                            });
                            $menu.append($('<li></li>').append($link));
                        });
                        $toolbarLeft.append($dropdown);
                        return;
                    }
                }

                if (groupedInsertKeys.indexOf(key) !== -1) {
                    if (insertDropdownRendered) {
                        return;
                    }
                    insertDropdownRendered = true;
                    const insertItems = groupedInsertKeys.filter(function (insertKey) {
                        return resolvedActionKeys.indexOf(insertKey) !== -1 && actions[insertKey];
                    }).map(function (insertKey) {
                        return actions[insertKey];
                    });
                    if (insertItems.length > 1) {
                        const dropdownId = 'bsMarkdownEditorInsert' + Math.random().toString(36).slice(2, 10);
                        const $dropdown = $([
                            "",
                            "<div class=\"btn-group " + groupSizeClass + "\" role=\"group\">",
                            "<button type=\"button\"",
                            "class=\"" + buttonClassBase + "p-1 dropdown-toggle js-bs-parsedown-action\"",
                            "data-bs-toggle=\"dropdown\"",
                            "aria-expanded=\"false\"",
                            "id=\"" + dropdownId + "\"",
                            "title=\"" + t('actions.insert', 'Einfügen') + "\">",
                            "<i class=\"bi bi-plus-lg\"></i>",
                            "</button>",
                            "<ul class=\"dropdown-menu\" aria-labelledby=\"" + dropdownId + "\"></ul>",
                            "</div>",
                            ""
                        ].join('\n'));
                        const $menu = $dropdown.find('.dropdown-menu');
                        insertItems.forEach(function (insertAction) {
                            const insertKey = Object.keys(actions).find(k => actions[k] === insertAction);
                            const shortcut = helpers.getShortcutDisplay(insertKey);
                            const shortcutHtml = shortcut ? `<span class="float-end ms-4 text-body-secondary bs-markdown-shortcut-hint">${shortcut}</span>` : '';
                            const $link = $(`<a href="#" class="dropdown-item d-flex justify-content-between align-items-center"><span class="d-flex align-items-center"><i class="bi ${insertAction.icon} me-2"></i>${insertAction.title}</span>${shortcutHtml}</a>`);
                            $link.on('click', function (e) {
                                e.preventDefault();
                                helpers.syncTextareaFromEditable(textarea, 'editableSelection');
                                insertAction.run(textarea);
                                $dropdown.find('[data-bs-toggle="dropdown"]').dropdown('hide');
                            });
                            $menu.append($('<li></li>').append($link));
                        });
                        $toolbarLeft.append($dropdown);
                        return;
                    }
                }

                if (Array.isArray(action.items) && action.items.length > 0) {
                    const controlClass = key === 'preview' ? '' : ' js-bs-parsedown-action';
                    const dropdownId = 'bsMarkdownEditorHeading' + Math.random().toString(36).slice(2, 10);
                    const $dropdown = $([
                        "",
                        "<div class=\"btn-group " + groupSizeClass + "\" role=\"group\">",
                        "<button type=\"button\"",
                        "class=\"" + buttonClassBase + "p-1 dropdown-toggle" + controlClass + "\"",
                        "data-bs-toggle=\"dropdown\"",
                        "aria-expanded=\"false\"",
                        "id=\"" + dropdownId + "\"",
                        "title=\"" + action.title + "\">",
                        "<i class=\"bi " + action.icon + "\"></i>",
                        "</button>",
                        "<ul class=\"dropdown-menu\" aria-labelledby=\"" + dropdownId + "\"></ul>",
                        "</div>",
                        ""
                    ].join('\n'));
                    const $menu = $dropdown.find('.dropdown-menu');
                    action.items.forEach(function (item) {
                        if (item.type === 'divider') {
                            $menu.append('<li><hr class="dropdown-divider"></li>');
                            return;
                        }
                        if (item.customForm) {
                            const formId = 'bsMarkdownEditorTableCustom' + Math.random().toString(36).slice(2, 10);
                            const $custom = $([
                                "",
                                "<li class=\"px-3 py-2\">",
                                "<div class=\"small text-body-secondary mb-2\">" + helpers.escapeHtml(item.label) + "</div>",
                                "<div class=\"d-flex align-items-end gap-2\">",
                                "<div>",
                                "<label class=\"form-label form-label-sm mb-1\" for=\"" + formId + "Rows\">" + helpers.escapeHtml(t('modal.rows', 'Zeilen')) + "</label>",
                                "<input id=\"" + formId + "Rows\" class=\"form-control form-control-sm\" type=\"number\" min=\"1\" max=\"30\" value=\"2\" style=\"width:5rem;\">",
                                "</div>",
                                "<div>",
                                "<label class=\"form-label form-label-sm mb-1\" for=\"" + formId + "Columns\">" + helpers.escapeHtml(t('modal.columns', 'Spalten')) + "</label>",
                                "<input id=\"" + formId + "Columns\" class=\"form-control form-control-sm\" type=\"number\" min=\"1\" max=\"12\" value=\"2\" style=\"width:5rem;\">",
                                "</div>",
                                "<button type=\"button\" class=\"btn btn-sm btn-primary js-bs-parsedown-table-custom-insert\">" + helpers.escapeHtml(t('modal.insert', 'Einfügen')) + "</button>",
                                "</div>",
                                "</li>",
                                ""
                            ].join('\n'));
                            $custom.on('click', function (e) {
                                e.stopPropagation();
                            });
                            $custom.find('.js-bs-parsedown-table-custom-insert').on('click', function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                helpers.syncTextareaFromEditable(textarea, 'editableSelection');
                                action.run(textarea, {
                                    rows: $custom.find(`#${formId}Rows`).val(),
                                    columns: $custom.find(`#${formId}Columns`).val()
                                });
                                $dropdown.find('[data-bs-toggle="dropdown"]').dropdown('hide');
                            });
                            $menu.append($custom);
                            return;
                        }
                        const itemIcon = item.icon || null;
                        const iconHtml = itemIcon ? `<i class="bi ${itemIcon} me-2"></i>` : '';
                        const labelStyle = item.textStyle ? ` style="${item.textStyle}"` : '';
                        const itemShortcut = item.shortcut ? helpers.getShortcutDisplay(item.shortcut) : '';
                        const shortcutHtml = itemShortcut ? `<span class="float-end ms-4 text-body-secondary bs-markdown-shortcut-hint">${itemShortcut}</span>` : '';
                        const $link = $(`<a href="#" class="dropdown-item d-flex justify-content-between align-items-center"><span class="d-flex align-items-center">${iconHtml}<span${labelStyle}>${item.label}</span></span>${shortcutHtml}</a>`);
                        $link.on('click', function (e) {
                            e.preventDefault();
                            helpers.syncTextareaFromEditable(textarea, 'editableSelection');
                            action.run(textarea, item);
                            $dropdown.find('[data-bs-toggle="dropdown"]').dropdown('hide');
                        });
                        $menu.append($('<li></li>').append($link));
                    });
                    if (key === 'preview') {
                        $toolbarRight.append($dropdown);
                    } else {
                        $toolbarLeft.append($dropdown);
                    }
                    return;
                }

                const buttonClass = key === 'preview' ? `${buttonClassBase} p-1 js-bs-parsedown-preview-toggle` : `${buttonClassBase} p-1 js-bs-parsedown-action`;
                const shortcut = helpers.getShortcutDisplay(key);
                const title = shortcut ? `${action.title} (${shortcut})` : action.title;
                const $button = $(`<button type="button" class="${buttonClass}" title="${title}"><i class="bi ${action.icon}"></i></button>`);
                const $buttonGroup = $(`<div class="btn-group ${groupSizeClass}" role="group"></div>`);
                $buttonGroup.append($button);
                $button.on('click', function (e) {
                    e.preventDefault();
                    helpers.syncTextareaFromEditable(textarea, 'editableSelection');
                    action.run(textarea);
                });
                if (key === 'preview') {
                    $toolbarRight.append($buttonGroup);
                } else {
                    $toolbarLeft.append($buttonGroup);
                }
            });

            helpers.getResolvedCustomActionEntries().forEach(function (entry) {
                const customAction = entry.action;
                const customKey = entry.key;

                if (customAction.enabled === false) {
                    return;
                }

                const context = {
                    key: customKey,
                    textarea: textarea,
                    editable: $editable.get(0),
                    $editable: $editable,
                    wrapper: $wrapperRef.get(0),
                    $wrapper: $wrapperRef,
                    toolbar: $toolbar.get(0),
                    $toolbar: $toolbar,
                    toolbarLeft: $toolbarLeft.get(0),
                    $toolbarLeft: $toolbarLeft,
                    toolbarRight: $toolbarRight.get(0),
                    $toolbarRight: $toolbarRight,
                    helpers: helpers,
                    settings: settings,
                    buttonClassBase: buttonClassBase,
                    groupSizeClass: groupSizeClass,
                    $: $
                };

                let $element = $();

                if (typeof customAction.render === 'function') {
                    const rendered = customAction.render(context);
                    if (rendered) {
                        $element = rendered.jquery ? rendered : $(rendered);
                    }
                } else if (typeof customAction.run === 'function') {
                    const title = customAction.title || customKey;
                    const shortcut = helpers.getShortcutDisplay(customKey);
                    const titleWithShortcut = shortcut ? `${title} (${shortcut})` : title;
                    const icon = customAction.icon ? `<i class="bi ${helpers.escapeHtml(customAction.icon)}"></i>` : helpers.escapeHtml(title);
                    const buttonClass = customAction.buttonClass || `${buttonClassBase} p-1 js-bs-parsedown-action`;
                    const $button = $(`<button type="button" class="${buttonClass}" title="${helpers.escapeHtml(titleWithShortcut)}">${icon}</button>`);
                    const $buttonGroup = $(`<div class="btn-group ${groupSizeClass}" role="group"></div>`);

                    $button.on('click', function (event) {
                        event.preventDefault();
                        helpers.syncTextareaFromEditable(textarea, 'editableSelection');
                        customAction.run(context);
                    });

                    $buttonGroup.append($button);
                    $element = $buttonGroup;
                }

                if (!$element || $element.length === 0) {
                    return;
                }

                if (customAction.position === 'right') {
                    $toolbarRightCustom.append($element);
                    return;
                }

                $toolbarLeft.append($element);
            });

            $toolbar.append($toolbarLeft);
            if ($toolbarRightCustom.children().length > 0) {
                $toolbarRight.prepend($toolbarRightCustom.children());
            }
            if ($toolbarRight.children().length > 0) {
                $toolbar.append($toolbarRight);
            }
            const $preview = $('<div class="js-bs-parsedown-preview border rounded-3 d-none"></div>');
            $toolbar.find('.btn').addClass('p-1');
            $wrapperRef.prepend($toolbar);
            $wrapperRef.append($preview);

            const api = {
                mode(value) {
                    if (typeof value === 'undefined') {
                        return helpers.getMode(textarea);
                    }
                    return helpers.setMode(textarea, value, 'api');
                },
                val(value) {
                    if (typeof value === 'undefined') {
                        return helpers.getValue(textarea);
                    }
                    helpers.setValue(textarea, value, 'api');
                    return helpers.getValue(textarea);
                }
            };
            $textarea.data('bsMarkdownEditorApi', api);

            helpers.setMode(textarea, settings.mode, 'init');
            helpers.updateStats(textarea);
            helpers.emitPluginEvent(textarea, 'ready.bs.markdown-editor', {
                mode: helpers.getMode(textarea),
                value: helpers.getValue(textarea),
                api: api
            });
        });
    };
}(jQuery));
