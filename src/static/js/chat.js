document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image');
    const exportBtn = document.getElementById('export-chat');
    const themeBtn = document.getElementById('toggle-theme');
    const voiceInputBtn = document.getElementById('voice-input');
    const voiceFeedback = document.getElementById('voice-feedback');
    const sendButton = document.getElementById('send-button');

    let currentTheme = localStorage.getItem('theme') || 'light';
    let selectedImage = null;
    let isPreviewMode = false;
    let isRecording = false;
    let recognition = null;

    // マークダウンパーサーの設定
    const md = window.markdownit({
        html: true,
        linkify: true,
        typographer: true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(lang, str).value;
                } catch (__) {}
            }
            return ''; // デフォルトのエスケープを使用
        }
    });

    // プレビューモードの切り替え
    function togglePreview() {
        isPreviewMode = !isPreviewMode;
        const previewText = messageInput.value;
        if (isPreviewMode) {
            const previewHtml = md.render(previewText);
            messageInput.style.display = 'none';
            const previewElement = document.createElement('div');
            previewElement.classList.add('markdown-preview');
            previewElement.innerHTML = previewHtml;
            messageInput.parentNode.insertBefore(previewElement, messageInput);
        } else {
            const previewElement = document.querySelector('.markdown-preview');
            if (previewElement) {
                previewElement.remove();
            }
            messageInput.style.display = 'block';
        }
    }

    // プレビューボタンの追加
    const previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.classList.add('preview-button');
    previewBtn.innerHTML = '👁 プレビュー';
    previewBtn.addEventListener('click', togglePreview);
    document.querySelector('.input-row').insertBefore(previewBtn, document.querySelector('.image-upload-label'));

    // 保存された会話履歴を読み込む
    function loadChatHistory() {
        const history = localStorage.getItem('chatHistory');
        if (history) {
            const messages = JSON.parse(history);
            messages.forEach(msg => {
                addMessage(msg.text, msg.isUser, false);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // 会話履歴を保存する
    function saveChatHistory() {
        const messages = Array.from(chatMessages.children).map(msg => ({
            text: msg.textContent,
            isUser: msg.classList.contains('user-message')
        }));
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }

    // メッセージを表示する関数
    function addMessage(message, isUser = false, save = true) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isUser ? 'user-message' : 'ai-message');
        
        // マークダウンをHTMLに変換
        const htmlContent = md.render(message);
        messageElement.innerHTML = htmlContent;

        // シンタックスハイライトの適用
        messageElement.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });

        // ローディングインジケータを追加
        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('loading-indicator');
        loadingIndicator.textContent = '入力中...';
        messageElement.appendChild(loadingIndicator);

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (save) {
            saveChatHistory();
        }

        return messageElement;
    }

    // 画像アップロード処理
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                removeImageBtn.style.display = 'block';
                selectedImage = {
                    file: file,
                    dataUrl: e.target.result
                };
            };
            reader.readAsDataURL(file);
        }
    });

    // 画像削除処理
    removeImageBtn.addEventListener('click', () => {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        removeImageBtn.style.display = 'none';
        imageUpload.value = '';
        selectedImage = null;
    });

    // メッセージ入力欄の高さを自動調整
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    });

    // Enterキーでメッセージを送信（Shift + Enterで改行）
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 送信ボタンクリックでメッセージを送信
    sendButton.addEventListener('click', sendMessage);

    // 会話のエクスポート機能
    exportBtn.addEventListener('click', () => {
        const messages = Array.from(chatMessages.children).map(msg => {
            const isUser = msg.classList.contains('user-message');
            return `${isUser ? 'User' : 'AI'}: ${msg.textContent}`;
        }).join('\n');

        const blob = new Blob([messages], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_export_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // テーマ切り替え機能
    const themes = {
        light: {
            background: '#f5f5f5',
            containerBg: 'white',
            headerBg: '#007bff',
            userMessageBg: '#007bff',
            aiMessageBg: '#e9ecef',
            textColor: '#333'
        },
        dark: {
            background: '#1a1a1a',
            containerBg: '#2d2d2d',
            headerBg: '#0056b3',
            userMessageBg: '#0056b3',
            aiMessageBg: '#404040',
            textColor: '#ffffff'
        }
    };

    function applyTheme(theme) {
        const colors = themes[theme];
        document.body.style.backgroundColor = colors.background;
        document.body.style.color = colors.textColor;
        document.querySelector('.chat-container').style.backgroundColor = colors.containerBg;
        document.querySelector('.chat-header').style.backgroundColor = colors.headerBg;
        document.querySelectorAll('.user-message').forEach(el => {
            el.style.backgroundColor = colors.userMessageBg;
        });
        document.querySelectorAll('.ai-message').forEach(el => {
            el.style.backgroundColor = colors.aiMessageBg;
            el.style.color = colors.textColor;
        });
        localStorage.setItem('theme', theme);
    }

    themeBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
    });

    // 音声認識の初期化
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error('音声認識がサポートされていません');
            voiceInputBtn.style.display = 'none';
            return false;
        }

        recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            isRecording = true;
            voiceInputBtn.classList.add('recording');
            voiceFeedback.classList.add('visible');
            messageInput.placeholder = '音声を認識中...';
        };

        recognition.onend = () => {
            isRecording = false;
            voiceInputBtn.classList.remove('recording');
            voiceFeedback.classList.remove('visible');
            messageInput.placeholder = 'メッセージを入力... (マークダウン対応)';
        };

        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            messageInput.value = result;
        };

        recognition.onerror = (event) => {
            console.error('音声認識エラー:', event.error);
            isRecording = false;
            voiceInputBtn.classList.remove('recording');
            voiceFeedback.classList.remove('visible');
            messageInput.placeholder = 'メッセージを入力... (マークダウン対応)';
        };

        return true;
    }

    // 音声入力ボタンのイベントリスナー
    voiceInputBtn.addEventListener('click', () => {
        if (!recognition && !initSpeechRecognition()) {
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            messageInput.value = '';
            recognition.start();
        }
    });

    // メッセージを送信する関数
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message && !selectedImage) return;

        // プレビューモードを解除
        if (isPreviewMode) {
            togglePreview();
        }

        // 送信ボタンを無効化
        const sendButton = chatForm.querySelector('.send-button');
        sendButton.disabled = true;

        // ユーザーメッセージを表示
        addMessage(message, true);
        messageInput.value = '';

        // AIの応答メッセージ要素を作成（ローディング状態）
        const aiMessage = addMessage('', false);
        aiMessage.classList.add('loading');

        try {
            let response;
            if (selectedImage) {
                // 画像付きメッセージの送信
                const formData = new FormData();
                formData.append('text', message);
                formData.append('image', selectedImage.file);

                response = await fetch('/chat/multimodal', {
                    method: 'POST',
                    body: formData
                });

                // 画像をクリア
                removeImageBtn.click();
            } else {
                // テキストのみの送信
                response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                });
            }

            const data = await response.json();
            
            // ローディング状態を解除
            aiMessage.classList.remove('loading');
            
            if (data.status === 'success') {
                // AIの応答を表示（マークダウンとして解釈）
                aiMessage.innerHTML = md.render(data.response);
                // シンタックスハイライトの適用
                aiMessage.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightBlock(block);
                });
            } else {
                // エラーメッセージを表示
                aiMessage.textContent = 'エラーが発生しました: ' + data.error;
            }
        } catch (error) {
            console.error('Error:', error);
            // ローディング状態を解除してエラーメッセージを表示
            aiMessage.classList.remove('loading');
            aiMessage.textContent = '通信エラーが発生しました。';
        } finally {
            // 送信ボタンを再度有効化
            sendButton.disabled = false;
            saveChatHistory();
        }
    }

    // 初期化
    loadChatHistory();
    applyTheme(currentTheme);
}); 