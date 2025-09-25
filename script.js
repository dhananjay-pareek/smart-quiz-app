const App = {
    // STATE
    state: {
        currentView: 'main-menu',
        chapters: [],
        quizQueue: [],
        currentQuestionIndex: 0,
        selectedChapterIndex: -1,
        score: 0,
        totalInitialQuestions: 0,
        incorrectlyAnswered: [],
    },

    // UI ELEMENTS
    elements: {
        mainMenu: document.getElementById('main-menu'),
        chapterSelectionView: document.getElementById('chapter-selection-view'),
        quizView: document.getElementById('quiz-view'),
        quizCompleteView: document.getElementById('quiz-complete-view'),
        addQuestionsView: document.getElementById('add-questions-view'),

        // Buttons
        startQuizBtn: document.getElementById('start-quiz-btn'),
        addQuestionsBtn: document.getElementById('add-questions-btn'),
        playAgainBtn: document.getElementById('play-again-btn'),
        backToMenuBtn: document.getElementById('back-to-menu-btn'),
        homeBtn: document.getElementById('home-btn'),
        skipQuestionBtn: document.getElementById('skip-question-btn'),
        backToMenuFromAddBtn: document.getElementById('back-to-menu-from-add-btn'),
        backToMenuFromChaptersBtn: document.getElementById('back-to-menu-from-chapters-btn'),

        // Chapter UI
        chapterListContainer: document.getElementById('chapter-list-container'),

        // Quiz UI
        questionCount: document.getElementById('question-count'),
        scoreCount: document.getElementById('score-count'),
        progressBar: document.getElementById('progress-bar'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        feedbackText: document.getElementById('feedback-text'),

        // Complete View UI
        finalScore: document.getElementById('final-score'),
        quizSummary: document.getElementById('quiz-summary'),

        // Add Questions UI
        bulkQuestionsInput: document.getElementById('bulk-questions-input'),
        saveBulkBtn: document.getElementById('save-bulk-btn'),
        bulkAddFeedback: document.getElementById('bulk-add-feedback'),

        // Modal UI
        confirmModal: document.getElementById('confirm-modal'),
        modalBody: document.getElementById('modal-body'),
        modalConfirmBtn: document.getElementById('modal-confirm-btn'),
        modalCancelBtn: document.getElementById('modal-cancel-btn'),
    },

    // INITIALIZATION
    init() {
        this.loadChapters();
        this.bindEvents();
        this.switchView('main-menu');
    },

    // EVENT BINDING
    bindEvents() {
        this.elements.startQuizBtn.addEventListener('click', () => this.switchView('chapter-selection-view'));
        this.elements.addQuestionsBtn.addEventListener('click', () => this.switchView('add-questions-view'));
        this.elements.playAgainBtn.addEventListener('click', () => this.startChapterQuiz(this.state.selectedChapterIndex));
        this.elements.backToMenuBtn.addEventListener('click', () => this.switchView('main-menu'));
        this.elements.backToMenuFromChaptersBtn.addEventListener('click', () => this.switchView('main-menu'));
        this.elements.homeBtn.addEventListener('click', () => this.showConfirmModal("End quiz and return home? Progress will be lost.", () => this.switchView('main-menu')));
        this.elements.skipQuestionBtn.addEventListener('click', () => this.skipQuestion());
        this.elements.backToMenuFromAddBtn.addEventListener('click', () => this.switchView('main-menu'));
        this.elements.modalCancelBtn.addEventListener('click', () => this.hideConfirmModal());
        this.elements.saveBulkBtn.addEventListener('click', () => this.saveBulkQuestions());
    },

    // VIEW MANAGEMENT & RENDERING
    switchView(viewName) {
        this.state.currentView = viewName;
        this.render();
    },

    render() {
        const allViews = ['mainMenu', 'chapterSelectionView', 'quizView', 'quizCompleteView', 'addQuestionsView'];
        allViews.forEach(viewKey => this.elements[viewKey].classList.add('hidden'));

        const viewMap = {
            'main-menu': 'mainMenu',
            'chapter-selection-view': 'chapterSelectionView',
            'quiz-view': 'quizView',
            'quiz-complete-view': 'quizCompleteView',
            'add-questions-view': 'addQuestionsView',
        };
        this.elements[viewMap[this.state.currentView]].classList.remove('hidden');

        if (this.state.currentView === 'add-questions-view') {
            this.renderAddQuestionForm();
        }
        if (this.state.currentView === 'chapter-selection-view') {
            this.renderChapterSelection();
        }
        if (this.state.currentView === 'main-menu') {
            this.renderMainMenuProgress();
        }
    },

    // QUIZ LOGIC
    startChapterQuiz(chapterIndex) {
        const chapter = this.state.chapters[chapterIndex];
        if (!chapter || chapter.questions.length === 0) {
            this.showConfirmModal("This chapter has no questions.", () => this.switchView('chapter-selection-view'));
            return;
        }

        this.state.score = 0;
        this.state.currentQuestionIndex = 0;
        this.state.selectedChapterIndex = chapterIndex;
        this.state.incorrectlyAnswered = [];
        // Create a deep copy and shuffle
        this.state.quizQueue = JSON.parse(JSON.stringify(chapter.questions)).sort(() => Math.random() - 0.5);
        this.state.totalInitialQuestions = this.state.quizQueue.length;

        this.switchView('quiz-view');
        this.displayCurrentQuestion();
    },

    displayCurrentQuestion() {
        this.elements.feedbackText.textContent = '';
        if (this.state.currentQuestionIndex >= this.state.quizQueue.length) {
            this.completeQuiz();
            return;
        }

        const question = this.state.quizQueue[this.state.currentQuestionIndex];

        this.elements.questionText.textContent = question.text;
        this.elements.scoreCount.textContent = this.state.score;
        this.elements.questionCount.textContent = `${this.state.currentQuestionIndex + 1} / ${this.state.quizQueue.length}`;

        const progress = this.state.totalInitialQuestions > 0 ? ((this.state.currentQuestionIndex) / this.state.totalInitialQuestions) * 100 : 0;
        this.elements.progressBar.style.width = `${progress}%`;

        this.elements.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'btn option-btn';
            button.addEventListener('click', () => this.handleAnswer(index, button));
            this.elements.optionsContainer.appendChild(button);
        });
    },

    handleAnswer(selectedIndex, selectedButton) {
        const question = this.state.quizQueue[this.state.currentQuestionIndex];
        const isCorrect = selectedIndex === question.answer;

        this.elements.optionsContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
        this.elements.skipQuestionBtn.disabled = true;

        if (isCorrect) {
            this.state.score++;
            selectedButton.classList.add('correct');
            this.elements.feedbackText.textContent = 'Correct!';
            this.elements.feedbackText.className = 'mt-4 text-center font-semibold text-lg text-green-600';
        } else {
            this.state.incorrectlyAnswered.push(question);
            selectedButton.classList.add('incorrect');
            this.elements.optionsContainer.children[question.answer].classList.add('correct');
            this.elements.feedbackText.textContent = 'Incorrect.';
            this.elements.feedbackText.className = 'mt-4 text-center font-semibold text-lg text-red-600';
        }

        setTimeout(() => {
            this.state.currentQuestionIndex++;
            this.elements.skipQuestionBtn.disabled = false;
            this.displayCurrentQuestion();
        }, 1500);
    },

    skipQuestion() {
        // Ensure there is a question to skip.
        if (this.state.quizQueue.length > this.state.currentQuestionIndex) {
            // Get the current question object.
            const skippedQuestion = this.state.quizQueue[this.state.currentQuestionIndex];

            // Add it to the list of questions to be reviewed later.
            this.state.incorrectlyAnswered.push(skippedQuestion);

            // Move to the next question in the queue.
            this.state.currentQuestionIndex++;

            // Display the next question or complete the quiz.
            this.displayCurrentQuestion();
        }
    },

    completeQuiz() {
        // Mark the current chapter as completed
        if (this.state.selectedChapterIndex >= 0 && this.state.chapters[this.state.selectedChapterIndex]) {
            const currentChapter = this.state.chapters[this.state.selectedChapterIndex];
            this.markChapterAsCompleted(currentChapter.name);
        }

        this.elements.finalScore.textContent = `${this.state.score} / ${this.state.totalInitialQuestions}`;
        this.renderQuizSummary();
        this.switchView('quiz-complete-view');
    },

    renderQuizSummary() {
        this.elements.quizSummary.innerHTML = '';
        if (this.state.incorrectlyAnswered.length === 0) {
            this.elements.quizSummary.innerHTML = '<p class="text-center text-green-600 font-medium">Perfect score! No incorrect answers to review.</p>';
            return;
        }

        let summaryHtml = '<h3 class="text-xxl font-bold text-gray-800 mb-4 text-center">Review Incorrect Answers</h3><div>';
        this.state.incorrectlyAnswered.forEach(q => {
            const correctAnswerText = q.options[q.answer];
            summaryHtml += `
                        <div class="p-3">
                            <p class="font-semibold">${q.text}</p>
                            <p class="text-sm mt-1">Correct answer: ${correctAnswerText}</p>
                        </div>
                    `;
        });
        summaryHtml += '</div>';
        this.elements.quizSummary.innerHTML = summaryHtml;
    },

    // CONTENT MANAGEMENT & LOCAL STORAGE
    async loadChapters() {
        try {
            // 1. Load base chapters from local JSON files
            const indexResponse = await fetch('./chapters.json');
            if (!indexResponse.ok) throw new Error(`HTTP error! status: ${indexResponse.status}`);
            const chapterFiles = await indexResponse.json();

            const chapterPromises = chapterFiles.map(file =>
                fetch(`./chapters/${file}`).then(res => res.ok ? res.json() : null)
            );
            const chapterArrays = (await Promise.all(chapterPromises)).filter(Boolean); // Filter out nulls from failed fetches
            // Flatten the arrays since each JSON file contains an array with one chapter object
            this.state.chapters = chapterArrays.flat();

            // 2. Load custom-added questions from localStorage and merge them
            const customData = localStorage.getItem('customQuizQuestions');
            if (customData) {
                const customChapters = JSON.parse(customData);
                customChapters.forEach(customChapter => {
                    const existingChapter = this.state.chapters.find(c => c.name.trim().toLowerCase() === customChapter.name.trim().toLowerCase());
                    if (existingChapter) {
                        // Merge questions into the existing chapter from files
                        existingChapter.questions.push(...customChapter.questions);
                    } else {
                        // Add as a completely new chapter
                        this.state.chapters.push(customChapter);
                    }
                });
            }
        } catch (error) {
            console.error("Could not load chapter data:", error);
            this.elements.mainMenu.innerHTML = `<div class="text-red-600 text-center"><h2 class="text-2xl font-bold mb-2">Error</h2><p>Could not load quiz content. Please ensure 'chapters.json' and chapter files exist and are correct.</p></div>`;
        }
    },

    saveCustomQuestion(chapterName, newQuestion) {
        // Get current custom questions from localStorage
        const customData = localStorage.getItem('customQuizQuestions');
        let customChapters = customData ? JSON.parse(customData) : [];

        // Find or create the chapter within the custom data structure
        let chapterToUpdate = customChapters.find(c => c.name.trim().toLowerCase() === chapterName.trim().toLowerCase());
        if (chapterToUpdate) {
            chapterToUpdate.questions.push(newQuestion);
        } else {
            customChapters.push({ name: chapterName, questions: [newQuestion] });
        }

        // Save the updated custom data back to localStorage
        localStorage.setItem('customQuizQuestions', JSON.stringify(customChapters));

        // Update the live state for the current session
        let liveChapter = this.state.chapters.find(c => c.name.trim().toLowerCase() === chapterName.trim().toLowerCase());
        if (liveChapter) {
            liveChapter.questions.push(newQuestion);
        } else {
            this.state.chapters.push({ name: chapterName, questions: [newQuestion] });
        }
    },

    // PROGRESS TRACKING
    getChapterProgress() {
        const progressData = localStorage.getItem('chapterProgress');
        return progressData ? JSON.parse(progressData) : {};
    },

    markChapterAsCompleted(chapterName) {
        const progress = this.getChapterProgress();
        progress[chapterName.trim().toLowerCase()] = {
            completed: true,
            completedAt: new Date().toISOString()
        };
        localStorage.setItem('chapterProgress', JSON.stringify(progress));
    },

    isChapterCompleted(chapterName) {
        const progress = this.getChapterProgress();
        return progress[chapterName.trim().toLowerCase()]?.completed || false;
    },

    getCompletedChaptersCount() {
        const progress = this.getChapterProgress();
        return Object.values(progress).filter(p => p.completed).length;
    },

    saveBulkQuestions() {
        const jsonInput = this.elements.bulkQuestionsInput.value.trim();
        if (!jsonInput) {
            this.elements.bulkAddFeedback.textContent = "Textarea is empty.";
            this.elements.bulkAddFeedback.className = 'text-center text-sm font-medium text-red-600';
            return;
        }

        try {
            const bulkData = JSON.parse(jsonInput);
            if (!Array.isArray(bulkData) || !bulkData.every(c => c.name && Array.isArray(c.questions))) {
                throw new Error("Invalid format. Must be an array of chapters.");
            }

            bulkData.forEach(chapter => {
                chapter.questions.forEach(question => {
                    this.saveCustomQuestion(chapter.name, question);
                });
            });

            this.elements.bulkAddFeedback.textContent = "Bulk questions added successfully!";
            this.elements.bulkAddFeedback.className = 'text-center text-sm font-medium text-green-600';
            this.elements.bulkQuestionsInput.value = '';

        } catch (error) {
            this.elements.bulkAddFeedback.textContent = `Error: ${error.message}`;
            this.elements.bulkAddFeedback.className = 'text-center text-sm font-medium text-red-600';
        }
    },

    // DYNAMIC UI RENDERING
    renderChapterSelection() {
        this.elements.chapterListContainer.innerHTML = '';
        if (this.state.chapters.length === 0) {
            this.elements.chapterListContainer.innerHTML = `<p class="text-gray-500 text-center bg-gray-50 p-4 rounded-md">No chapters found. Try adding some custom questions!</p>`;
            return;
        }
        this.state.chapters.forEach((chapter, index) => {
            const button = document.createElement('button');
            const questionsCount = chapter.questions ? chapter.questions.length : 0;
            const isCompleted = this.isChapterCompleted(chapter.name);

            // Add checkmark for completed chapters
            const statusIcon = isCompleted ? '✓ ' : '';
            button.innerHTML = `<span>${statusIcon}${index + 1}. ${chapter.name}</span><span class="text-sm">${questionsCount} questions</span>`;

            // Different styling for completed vs incomplete chapters
            if (isCompleted) {
                // Add both classes for a completed chapter
                button.className = 'chapter-btn completed';
            } else {
                // Add just the base class for an incomplete chapter
                button.className = 'chapter-btn';
            }

            button.onclick = () => this.startChapterQuiz(index);
            this.elements.chapterListContainer.appendChild(button);
        });
    },

    renderMainMenuProgress() {
        // Find or create progress container
        let progressContainer = document.getElementById('progress-container');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'progress-container';
            progressContainer.className = 'mt-6 p-4 rounded-lg';

            // Insert before the buttons
            const buttonsContainer = this.elements.mainMenu.querySelector('.flex');
            buttonsContainer.parentNode.insertBefore(progressContainer, buttonsContainer);
        }

        const totalChapters = this.state.chapters.length;
        const completedCount = this.getCompletedChaptersCount();
        const percentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

        progressContainer.innerHTML = `
                    <h3 class="text-lg font-semibold mb-2">Your Progress</h3>
                    <div class="flex items-center justify-between text-sm mb-2">
                        <span>Completed Chapters</span>
                        <span>${completedCount} / ${totalChapters} (${percentage}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                    </div>
                `;
    },

    renderAddQuestionForm() {
        this.elements.bulkQuestionsInput.value = '';
        this.elements.bulkAddFeedback.textContent = '';
    },

    // MODAL UTILITIES
    showConfirmModal(message, onConfirmCallback) {
        this.elements.modalBody.textContent = message;
        this.elements.confirmModal.classList.remove('hidden');

        const newConfirmBtn = this.elements.modalConfirmBtn.cloneNode(true);
        this.elements.modalConfirmBtn.parentNode.replaceChild(newConfirmBtn, this.elements.modalConfirmBtn);
        this.elements.modalConfirmBtn = newConfirmBtn;

        this.elements.modalConfirmBtn.onclick = () => { this.hideConfirmModal(); onConfirmCallback(); };
    },
    hideConfirmModal() { this.elements.confirmModal.classList.add('hidden'); },
};


App.init();