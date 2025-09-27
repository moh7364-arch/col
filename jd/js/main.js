// الكود الرئيسي للتطبيق
class PokerGame {
    constructor() {
        this.currentUser = null;
        this.gameState = 'lobby';
        this.init();
    }

    init() {
        this.loadCountries();
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    loadCountries() {
        const countries = [
            { code: 'SA', name: 'السعودية', dialCode: '+966' },
            { code: 'AE', name: 'الإمارات', dialCode: '+971' },
            { code: 'EG', name: 'مصر', dialCode: '+20' },
            { code: 'US', name: 'الولايات المتحدة', dialCode: '+1' },
            { code: 'GB', name: 'المملكة المتحدة', dialCode: '+44' }
        ];

        const select = document.getElementById('countryCode');
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.dialCode;
            option.textContent = `${country.name} (${country.dialCode})`;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        // نموذج التسجيل
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // التنقل بين الصفحات
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.showSection(e.currentTarget.dataset.page);
            });
        });

        // عناصر التحكم في اللعبة
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleGameControl(e.target.classList);
            });
        });
    }

    async handleRegistration() {
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            countryCode: document.getElementById('countryCode').value,
            idDocument: document.getElementById('idDocument').files[0]
        };

        try {
            // التحقق من البيانات
            if (!this.validateForm(formData)) {
                this.showError('يرجى ملء جميع الحقول بشكل صحيح');
                return;
            }

            // بدء التحقق الحيوي
            this.startBiometricVerification();
            
        } catch (error) {
            this.showError('حدث خطأ أثناء التسجيل');
        }
    }

    validateForm(data) {
        // التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) return false;

        // التحقق من رقم الهاتف
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(data.phone)) return false;

        return true;
    }

    async startBiometricVerification() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            
            const video = document.getElementById('camera-feed');
            video.srcObject = stream;

            // الانتقال لصفحة التحقق الحيوي
            this.showPage('biometric-page');

            // بدء تتبع الحركة
            this.startHeadTracking();

        } catch (error) {
            this.showError('لا يمكن الوصول إلى الكاميرا');
        }
    }

    startHeadTracking() {
        // محاكاة تتبع حركة الرأس (في الإصدار الحقيقي سيستخدم مكتبة مثل face-api.js)
        const guide = document.querySelector('.face-guide');
        const movements = ['up', 'down', 'left', 'right'];
        let currentMovement = 0;

        const movementInterval = setInterval(() => {
            if (currentMovement >= movements.length) {
                clearInterval(movementInterval);
                this.completeBiometricVerification();
                return;
            }

            guide.textContent = `يرجى تحريك رأسك إلى ${movements[currentMovement]}`;
            currentMovement++;
        }, 3000);
    }

    completeBiometricVerification() {
        this.showSuccess('تم التحقق بنجاح!');
        setTimeout(() => {
            this.showPage('main-page');
            this.initializeGame();
        }, 2000);
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    }

    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        document.getElementById(`${sectionId}-content`).classList.add('active');
        document.querySelector(`[data-page="${sectionId}"]`).classList.add('active');
    }

    handleGameControl(btnClass) {
        if (btnClass.contains('deal-btn')) {
            this.startNewRound();
        } else if (btnClass.contains('bet-btn')) {
            this.placeBet();
        } else if (btnClass.contains('fold-btn')) {
            this.fold();
        } else if (btnClass.contains('restart-btn')) {
            this.restartGame();
        }
    }

    startNewRound() {
        const game = new PokerRound();
        game.dealCards();
        this.animateCardDeal();
    }

    animateCardDeal() {
        const seats = document.querySelectorAll('.seat');
        seats.forEach((seat, index) => {
            setTimeout(() => {
                this.createCardElement(seat);
            }, index * 300);
        });
    }

    createCardElement(seat) {
        const card = document.createElement('div');
        card.className = 'playing-card';
        card.innerHTML = '🂠';
        seat.appendChild(card);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('pokerUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showPage('main-page');
            this.initializeGame();
        }
    }
}

// فئة إدارة جولة البوكر
class PokerRound {
    constructor() {
        this.players = [];
        this.communityCards = [];
        this.currentPlayer = 0;
        this.pot = 0;
        this.initDeck();
    }

    initDeck() {
        this.deck = [];
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        suits.forEach(suit => {
            values.forEach(value => {
                this.deck.push({ suit, value });
            });
        });

        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        for (let i = 0; i < 6; i++) {
            this.players[i] = {
                cards: [this.deck.pop(), this.deck.pop()],
                money: 1000,
                bet: 0,
                folded: false
            };
        }
    }

    placeBet(amount, playerIndex) {
        if (this.players[playerIndex].money >= amount) {
            this.players[playerIndex].money -= amount;
            this.players[playerIndex].bet += amount;
            this.pot += amount;
            return true;
        }
        return false;
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.pokerGame = new PokerGame();
});
