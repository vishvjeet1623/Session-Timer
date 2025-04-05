class Timer {
    constructor() {
        this.sessions = 0;
        this.totalSeconds = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.currentSession = 0;
        this.targetHours = 200;
        this.targetMinutes = 0;
        this.targetReached = false;
        this.interval = null;
        this.history = [];
        this.notes = [];
        this.audio = new Audio('1.mp3');
        this.audio.loop = true;

        // DOM elements
        this.sessionsElement = document.getElementById('sessions');
        this.totalHoursElement = document.getElementById('total-hours');
        this.progressFill = document.getElementById('progress-fill');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.stopSessionBtn = document.getElementById('stop-session-btn');
        this.activeTimer = document.getElementById('active-timer');
        this.currentTimerDisplay = document.getElementById('current-timer');
        this.historyList = document.getElementById('history-list');
        this.resetBtn = document.getElementById('reset-btn');
        this.editTargetBtn = document.getElementById('edit-target-btn');
        this.saveTargetBtn = document.getElementById('save-target-btn');
        this.targetValue = document.getElementById('target-value');
        this.targetInputContainer = document.querySelector('.target-input-container');
        this.targetValueContainer = document.querySelector('.target-value-container');
        this.targetHoursInput = document.getElementById('target-hours-input');
        this.targetMinutesInput = document.getElementById('target-minutes-input');
        this.notesArea = document.getElementById('notes-area');
        this.saveNotesBtn = document.getElementById('save-notes');
        this.notesHistory = document.getElementById('notes-history');

        // Create confirmation dialog
        this.createConfirmationDialog();

        // Load saved data
        this.loadData();
        
        // Event listeners
        this.startBtn.addEventListener('click', () => this.startSession());
        this.pauseBtn.addEventListener('click', () => this.pauseSession());
        this.stopSessionBtn.addEventListener('click', () => this.stopSession());
        this.resetBtn.addEventListener('click', () => this.showResetConfirmation());
        this.editTargetBtn.addEventListener('click', () => this.toggleTargetEdit());
        this.saveTargetBtn.addEventListener('click', () => this.updateTargetHours());
        this.saveNotesBtn.addEventListener('click', () => this.saveNote());
        
        // Add event delegation for note actions
        this.notesHistory.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('note-action-btn')) {
                const noteItem = target.closest('.note-item');
                const noteId = noteItem.dataset.noteId;
                if (target.classList.contains('edit')) {
                    this.editNote(noteId);
                } else if (target.classList.contains('delete')) {
                    this.showDeleteNoteConfirmation(noteId);
                }
            }
        });

        // Initial update
        this.updateDisplay();
        this.renderHistory();
        this.renderNotes();
    }

    createConfirmationDialog() {
        // Create dialog elements
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        
        const title = document.createElement('h3');
        title.textContent = 'Reset Progress';
        
        const message = document.createElement('p');
        message.textContent = 'Are you sure you want to reset all progress? This cannot be undone.';
        
        const buttons = document.createElement('div');
        buttons.className = 'dialog-buttons';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'dialog-btn confirm-btn';
        confirmBtn.textContent = 'Reset';
        confirmBtn.addEventListener('click', () => {
            this.resetProgress();
            overlay.classList.remove('show');
        });
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'dialog-btn cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => overlay.classList.remove('show'));
        
        buttons.appendChild(confirmBtn);
        buttons.appendChild(cancelBtn);
        dialog.appendChild(title);
        dialog.appendChild(message);
        dialog.appendChild(buttons);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        this.dialogOverlay = overlay;
    }

    showResetConfirmation() {
        this.dialogOverlay.classList.add('show');
    }

    resetProgress() {
        // Only reset timer-related data
        this.sessions = 0;
        this.totalSeconds = 0;
        this.currentSession = 0;
        this.history = [];
        this.targetReached = false;
        
        // Update display and save only timer data
        this.updateDisplay();
        this.renderHistory();
        
        // Save only timer data, preserving notes
        const savedData = JSON.parse(localStorage.getItem('timerData')) || {};
        savedData.sessions = this.sessions;
        savedData.totalSeconds = this.totalSeconds;
        savedData.history = this.history;
        savedData.targetHours = this.targetHours;
        savedData.targetMinutes = this.targetMinutes;
        savedData.targetReached = this.targetReached;
        localStorage.setItem('timerData', JSON.stringify(savedData));
    }

    toggleTargetEdit() {
        const isEditing = this.targetInputContainer.classList.contains('show');
        if (!isEditing) {
            // Show the input fields
            this.targetHoursInput.value = this.targetHours;
            this.targetMinutesInput.value = this.targetMinutes;
            this.targetValueContainer.classList.add('hide');
            this.targetInputContainer.classList.add('show');
            this.targetHoursInput.focus();
        } else {
            // Hide the input fields and update the target
            this.updateTargetHours();
        }
    }

    updateTargetHours() {
        const newTargetHours = parseInt(this.targetHoursInput.value) || 0;
        const newTargetMinutes = parseInt(this.targetMinutesInput.value) || 0;
        
        if (newTargetHours >= 0 && newTargetMinutes >= 0 && newTargetMinutes < 60) {
            this.targetHours = newTargetHours;
            this.targetMinutes = newTargetMinutes;
            this.targetValue.textContent = `${this.targetHours} h ${this.targetMinutes} m`;
            this.updateDisplay();
            this.saveData();
        } else {
            // If invalid input, reset to current values
            this.targetHoursInput.value = this.targetHours;
            this.targetMinutesInput.value = this.targetMinutes;
        }
        
        // Always hide the input fields and show the value
        this.targetValueContainer.classList.remove('hide');
        this.targetInputContainer.classList.remove('show');
    }

    startSession() {
        if (!this.isRunning && !this.isPaused) {
            this.isRunning = true;
            this.startBtn.classList.add('hidden');
            this.activeTimer.classList.add('show');
            this.sessionStartTime = new Date();
            
            this.interval = setInterval(() => {
                this.currentSession++;
                this.totalSeconds++;
                this.updateDisplay();
                this.saveData();
            }, 1000);
        }
    }

    pauseSession() {
        if (this.isRunning) {
            this.isRunning = false;
            this.isPaused = true;
            clearInterval(this.interval);
            this.pauseBtn.textContent = '▶️ Resume';
        } else if (this.isPaused) {
            this.isRunning = true;
            this.isPaused = false;
            this.pauseBtn.textContent = '⏸️ Pause';
            
            this.interval = setInterval(() => {
                this.currentSession++;
                this.totalSeconds++;
                this.updateDisplay();
                this.saveData();
            }, 1000);
        }
    }

    stopSession() {
        if (this.isRunning || this.isPaused) {
            this.isRunning = false;
            this.isPaused = false;
            this.startBtn.classList.remove('hidden');
            this.activeTimer.classList.remove('show');
            this.pauseBtn.textContent = '⏸️ Pause';
            clearInterval(this.interval);
            
            if (this.currentSession > 0) {
                this.sessions++;
                this.addToHistory({
                    sessionNumber: this.sessions,
                    startTime: this.sessionStartTime,
                    endTime: new Date(),
                    duration: this.currentSession
                });
                this.currentSession = 0;
                this.updateDisplay();
                this.saveData();
            }
        }
    }

    addToHistory(sessionData) {
        this.history.unshift(sessionData);
        // Keep only the last 50 sessions
        if (this.history.length > 50) {
            this.history.pop();
        }
        this.renderHistory();
    }

    renderHistory() {
        this.historyList.innerHTML = '';
        this.history.forEach(session => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const sessionInfo = document.createElement('div');
            sessionInfo.className = 'session-info';
            sessionInfo.textContent = `Session ${session.sessionNumber} - ${this.formatTime(session.duration)}`;
            
            const dateTime = document.createElement('div');
            dateTime.className = 'date-time';
            dateTime.textContent = this.formatDate(session.startTime);
            
            historyItem.appendChild(sessionInfo);
            historyItem.appendChild(dateTime);
            this.historyList.appendChild(historyItem);
        });
    }

    formatDate(date) {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours} h ${minutes} m ${seconds} s`;
    }

    formatCurrentTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    updateDisplay() {
        // Update sessions
        this.sessionsElement.textContent = this.sessions;

        // Update total hours
        this.totalHoursElement.textContent = this.formatTime(this.totalSeconds);

        // Update current session timer
        this.currentTimerDisplay.textContent = this.formatCurrentTime(this.currentSession);

        // Calculate and update progress
        const totalTargetSeconds = (this.targetHours * 3600) + (this.targetMinutes * 60);
        const progress = (this.totalSeconds / totalTargetSeconds) * 100;
        this.progressFill.style.width = `${Math.min(progress, 100)}%`;

        // Check if target is reached
        if (this.totalSeconds >= totalTargetSeconds && !this.targetReached) {
            this.targetReached = true;
            this.showCongratulations();
            this.stopSession(); // Automatically stop the session when target is reached
        }
    }

    saveData() {
        const data = {
            sessions: this.sessions,
            totalSeconds: this.totalSeconds,
            targetHours: this.targetHours,
            targetMinutes: this.targetMinutes,
            history: this.history,
            notes: this.notes
        };
        localStorage.setItem('timerData', JSON.stringify(data));
    }

    loadData() {
        const savedData = localStorage.getItem('timerData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.sessions = data.sessions || 0;
            this.totalSeconds = data.totalSeconds || 0;
            this.targetHours = data.targetHours || 200;
            this.targetMinutes = data.targetMinutes || 0;
            this.history = data.history || [];
            this.notes = data.notes || [];
            this.targetValue.textContent = `${this.targetHours} h ${this.targetMinutes} m`;
        }
    }

    saveNote() {
        const noteText = this.notesArea.value.trim();
        if (noteText) {
            const note = {
                id: Date.now().toString(), // Add unique ID for each note
                text: noteText,
                timestamp: new Date(),
                sessionNumber: this.sessions + (this.currentSession > 0 ? 1 : 0)
            };
            this.notes.unshift(note);
            this.notesArea.value = '';
            this.renderNotes();
            this.saveData();
        }
    }

    renderNotes() {
        this.notesHistory.innerHTML = '';
        this.notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.dataset.noteId = note.id;
            
            const noteDate = document.createElement('div');
            noteDate.className = 'note-date';
            noteDate.textContent = `Session ${note.sessionNumber} - ${this.formatDate(note.timestamp)}`;
            
            const noteContent = document.createElement('div');
            noteContent.className = 'note-content';
            noteContent.textContent = note.text;

            const noteActions = document.createElement('div');
            noteActions.className = 'note-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'note-action-btn edit';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit Quote';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'note-action-btn delete';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete Quote';

            const editInput = document.createElement('input');
            editInput.type = 'text';
            editInput.className = 'note-edit-input';
            editInput.value = note.text;
            
            noteActions.appendChild(editBtn);
            noteActions.appendChild(deleteBtn);
            noteItem.appendChild(noteDate);
            noteItem.appendChild(noteContent);
            noteItem.appendChild(noteActions);
            noteItem.appendChild(editInput);
            
            this.notesHistory.appendChild(noteItem);
        });
    }

    editNote(noteId) {
        const noteItem = this.notesHistory.querySelector(`[data-note-id="${noteId}"]`);
        const noteContent = noteItem.querySelector('.note-content');
        const editInput = noteItem.querySelector('.note-edit-input');
        const editBtn = noteItem.querySelector('.edit');

        if (editInput.classList.contains('show')) {
            // Save the edit
            const newText = editInput.value.trim();
            if (newText) {
                const noteIndex = this.notes.findIndex(note => note.id === noteId);
                if (noteIndex !== -1) {
                    this.notes[noteIndex].text = newText;
                    noteContent.textContent = newText;
                    this.saveData();
                }
            }
            editInput.classList.remove('show');
            editBtn.innerHTML = '✏️';
        } else {
            // Show edit input
            editInput.classList.add('show');
            editInput.focus();
            editBtn.innerHTML = '💾';

            // Handle enter key to save
            editInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    editBtn.click();
                }
            };

            // Handle blur to save
            editInput.onblur = () => {
                setTimeout(() => {
                    if (editInput.classList.contains('show')) {
                        editBtn.click();
                    }
                }, 200);
            };
        }
    }

    showDeleteNoteConfirmation(noteId) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay show';  // Add 'show' class immediately
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        
        const title = document.createElement('h3');
        title.textContent = 'Delete Quote';
        
        const message = document.createElement('p');
        message.textContent = 'Are you sure you want to delete this quote?';
        
        const buttons = document.createElement('div');
        buttons.className = 'dialog-buttons';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'dialog-btn confirm-btn';
        confirmBtn.textContent = 'Delete';
        confirmBtn.addEventListener('click', () => {
            this.deleteNote(noteId);
            document.body.removeChild(overlay);
        });
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'dialog-btn cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        buttons.appendChild(confirmBtn);
        buttons.appendChild(cancelBtn);
        dialog.appendChild(title);
        dialog.appendChild(message);
        dialog.appendChild(buttons);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    deleteNote(noteId) {
        const noteIndex = this.notes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            this.notes.splice(noteIndex, 1);
            this.renderNotes();
            this.saveData();
        }
    }

    showClearNotesConfirmation() {
        // Create and show confirmation dialog
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        
        const title = document.createElement('h3');
        title.textContent = 'Clear All Quotes';
        
        const message = document.createElement('p');
        message.textContent = 'Are you sure you want to clear all quotes? This cannot be undone.';
        
        const buttons = document.createElement('div');
        buttons.className = 'dialog-buttons';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'dialog-btn confirm-btn';
        confirmBtn.textContent = 'Clear';
        confirmBtn.addEventListener('click', () => {
            this.clearNotes();
            overlay.remove();
        });
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'dialog-btn cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => overlay.remove());
        
        buttons.appendChild(confirmBtn);
        buttons.appendChild(cancelBtn);
        dialog.appendChild(title);
        dialog.appendChild(message);
        dialog.appendChild(buttons);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    clearNotes() {
        this.notes = [];
        this.renderNotes();
        this.saveData();
    }

    showCongratulations() {
        // Create congratulations popup
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay show';
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog congratulations-dialog';
        
        const title = document.createElement('h3');
        title.textContent = 'Congratulations! 🎉';
        
        const message = document.createElement('p');
        message.textContent = `You've reached your target of ${this.targetHours} hours and ${this.targetMinutes} minutes!`;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'dialog-btn close-btn';
        closeBtn.innerHTML = '✖️';
        closeBtn.title = 'Close';
        closeBtn.addEventListener('click', () => {
            this.stopCongratulations();
            document.body.removeChild(overlay);
        });
        
        dialog.appendChild(closeBtn);
        dialog.appendChild(title);
        dialog.appendChild(message);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Start party popper animations
        this.startPartyPopperAnimations();
        
        // Play sound
        this.audio.play();
    }

    startPartyPopperAnimations() {
        // Create party popper elements
        for (let i = 0; i < 10; i++) {
            const popper = document.createElement('div');
            popper.className = 'party-popper';
            popper.style.left = `${Math.random() * 100}%`;
            popper.style.top = `${Math.random() * 100}%`;
            document.body.appendChild(popper);
            
            // Remove popper after animation
            setTimeout(() => {
                document.body.removeChild(popper);
            }, 3000);
        }
    }

    stopCongratulations() {
        // Stop sound
        this.audio.pause();
        this.audio.currentTime = 0;
        
        // Remove any remaining party poppers
        const poppers = document.querySelectorAll('.party-popper');
        poppers.forEach(popper => {
            document.body.removeChild(popper);
        });
    }
}

// Initialize the timer
const timer = new Timer(); 