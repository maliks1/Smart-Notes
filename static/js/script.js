document.addEventListener('DOMContentLoaded', function () {
    // --- Selektor Elemen ---
    const noteInput = document.getElementById('note');
    const saveNoteButton = document.getElementById('save-note-button');
    const savedNotesGrid = document.getElementById('saved-notes-grid');
    const searchInput = document.getElementById('search-notes');
    const notificationDiv = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const closeNotificationButton = document.getElementById('close-notification');
    const modal = document.getElementById('note-modal');
    const modalContent = document.getElementById('modal-note-content');
    const closeModalButton = document.getElementById('close-modal');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const cancelDeleteButton = document.getElementById('cancel-delete-button');
    const confirmDeleteButton = document.getElementById('confirm-delete-button');
    const resultContainer = document.getElementById('result-container');
    const resultElement = document.getElementById('result');
    const errorMessageElement = document.getElementById('error-message');
    const editConfirmModal = document.getElementById('edit-note-modal');
    const editNoteTextarea = document.getElementById('edit-note-textarea');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const saveEditButton = document.getElementById('save-edit-button');
    const closeEditModalX = document.getElementById('close-edit-modal-x');
    const closeResultButton = document.getElementById('close-result-button');

    let notificationTimeout;
    let idToEdit = null;
    let idToDelete = null
    let currentNotes = [];

    function showEditModal(noteId, textForEditing) {
        idToEdit = noteId;
        editNoteTextarea.value = textForEditing;
        editConfirmModal.classList.remove('hidden');
    }

    function hideEditModal() {
        editConfirmModal.classList.add('hidden');
        idToEdit = null;
        editNoteTextarea.value = ''; // Kosongkan textarea
    }

    // --- Fungsi Notifikasi ---
    function showNotification(message) {
        clearTimeout(notificationTimeout);
        notificationMessage.textContent = message;
        notificationDiv.classList.remove('hidden');
        notificationTimeout = setTimeout(hideNotification, 3000);
    }
    function hideNotification() {
        notificationDiv.classList.add('hidden');
    }
    closeNotificationButton.addEventListener('click', hideNotification);

    // --- Fungsi Modal Catatan ---
    function openModal(textToShow) {
        modalContent.textContent = textToShow;
        modal.classList.remove('hidden');
    }
    function closeModal() {
        modal.classList.add('hidden');
    }
    closeModalButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => { if (event.target === modal) { closeModal(); } });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.classList.contains('hidden')) { closeModal(); } });

    // --- Fungsi Modal Konfirmasi Hapus ---
    function showDeleteConfirmModal(noteId) {
        idToDelete = noteId;
        deleteConfirmModal.classList.remove('hidden');
        setTimeout(() => {
            deleteConfirmModal.querySelector('div').classList.remove('scale-95', 'opacity-0');
        }, 10);
    }

    function hideDeleteConfirmModal() {
        deleteConfirmModal.querySelector('div').classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            deleteConfirmModal.classList.add('hidden');
            idToDelete = null;
        }, 300);
    }

    // --- Fungsi Tampil Catatan ---
    function displaySavedNotes() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        savedNotesGrid.innerHTML = '';
        const filteredNotes = currentNotes.filter(note_obj =>
            note_obj.text.toLowerCase().includes(searchTerm)
        );
        const createIconButton = (title, onClick, iconSrc) => { /* ... kode lengkap ... */
            const btn = document.createElement('button');
            btn.className = `bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-all duration-150 flex items-center justify-center w-10 h-10 hover:scale-110 focus:outline-none`;
            btn.onclick = onClick;
            btn.setAttribute('title', title);
            const iconImage = document.createElement('img');
            iconImage.className = 'icon-image';
            iconImage.alt = title;
            iconImage.src = iconSrc;
            iconImage.style.width = '20px';
            iconImage.style.height = '20px';
            btn.appendChild(iconImage);
            return btn;
        };

        if (currentNotes.length === 0) {
            savedNotesGrid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">Belum ada catatan tersimpan.</p>';
        } else if (filteredNotes.length === 0 && searchTerm !== '') {
            savedNotesGrid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">Tidak ada catatan yang cocok dengan pencarian.</p>';
        } else {
            filteredNotes.forEach((note_obj) => {
                const card = document.createElement('div');
                card.className = 'note-card relative bg-gray-800 px-5 pt-5 pb-16 rounded-lg shadow-md border border-gray-700 flex flex-col justify-between min-h-[180px] hover:shadow-lg hover:border-indigo-500 transition-all duration-200 cursor-pointer';
                card.setAttribute('data-id', note_obj.id);
                const noteTextElement = document.createElement('p');
                noteTextElement.textContent = note_obj.text;
                noteTextElement.className = 'note-text-content text-gray-300 mb-4 flex-grow whitespace-pre-wrap break-words';
                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'button-group flex space-x-2 absolute bottom-4 right-4';

                buttonGroup.appendChild(createIconButton('Edit', (e) => {
                    e.stopPropagation();
                    showEditModal(note_obj.id, note_obj.text);
                }, '/static/icon/edit.png'));

                buttonGroup.appendChild(createIconButton('Hapus', (e) => {
                    e.stopPropagation();
                    showDeleteConfirmModal(note_obj.id);
                }, '/static/icon/hapus.png'));

                buttonGroup.appendChild(createIconButton('Proses', (e) => {
                    e.stopPropagation();
                    processSingleNote(note_obj.text);
                }, '/static/icon/proses.png'));

                card.appendChild(noteTextElement);
                card.appendChild(buttonGroup);
                savedNotesGrid.appendChild(card);
                card.addEventListener('click', (event) => {
                    if (event.target.closest('.button-group')) { return; }
                    openModal(note_obj.text);
                });
            });
        }
    }

    // --- Fungsi untuk Memuat Catatan dari Server ---
    function loadNotesFromServer() {
        fetch('/api/notes')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Gagal memuat catatan dari server');
                }
                return response.json();
            })
            .then(data => {
                currentNotes = data; // Simpan data ke variabel global
                displaySavedNotes(); // Tampilkan catatan setelah dimuat
            })
            .catch(error => {
                console.error('Error:', error);
                savedNotesGrid.innerHTML = `<p class="text-red-500 col-span-full">${error.message}</p>`;
            });
    }

    // --- Fungsi untuk Menyimpan Catatan ke Server ---
    function saveNoteToServer(noteText) {
        fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ note: noteText }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showNotification('Catatan berhasil disimpan!');
                    noteInput.value = '';
                    loadNotesFromServer(); // Muat ulang catatan dari server
                } else {
                    throw new Error(data.description || 'Gagal menyimpan catatan.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(`Gagal menyimpan catatan: ${error.message}`);
            });
    }

    function executeDelete(noteId) {
        fetch(`/api/notes/${noteId}`, { method: 'DELETE', })
            .then(response => { if (!response.ok) { return response.json().catch(() => ({})).then(err => { throw new Error(err.description || 'Gagal menghapus'); }); } return response.json(); })
            .then(data => { if (data.status === 'success') { showNotification('Catatan berhasil dihapus!'); loadNotesFromServer(); } else { throw new Error(data.description || 'Gagal menghapus.'); } })
            .catch(error => { console.error('Error:', error); alert(`Gagal menghapus: ${error.message}`); });
    }

    // --- Fungsi Menyimpan Urutan ---
    function saveOrderToServer(newOrder) { /* ... kode fetch PUT ... */
        fetch('/api/notes/order', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOrder), })
            .then(response => response.json())
            .then(data => { if (data.status === 'success') { loadNotesFromServer(); } else { console.error("Gagal menyimpan urutan."); } })
            .catch(error => { console.error('Error:', error); alert(`Gagal menyimpan urutan: ${error.message}`); });
    }

    // --- Fungsi Proses Catatan (Pastikan ini ada!) ---
    function processSingleNote(textToProcess) {
        // --- Ambil juga selektor result & error jika belum ada di atas ---
        const resultContainer = document.getElementById('result-container');
        const resultElement = document.getElementById('result');
        const errorMessageElement = document.getElementById('error-message');

        function showError(message) { // Fungsi helper jika belum ada
            resultElement.textContent = '';
            errorMessageElement.textContent = message;
            errorMessageElement.classList.remove('hidden');
            resultContainer.classList.remove('hidden');
        }
        // ------------------------------------------------------------------

        if (!textToProcess || textToProcess.trim() === '') {
            showError('Tidak ada catatan untuk diproses.');
            return;
        }
        resultElement.textContent = 'Memproses...';
        errorMessageElement.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        window.scrollTo({ top: resultContainer.offsetTop - 30, behavior: 'smooth' });
        fetch('/process_note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ 'note': textToProcess })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().catch(() => ({ error: `Server error: ${response.statusText}` }))
                        .then(err => { throw new Error(err.error || 'Terjadi kesalahan.') });
                }
                return response.json();
            })
            .then(data => {
                if (data.result) {
                    // Gunakan marked.parse() jika Anda menggunakan marked.js
                    if (window.marked) {
                        resultElement.innerHTML = marked.parse(data.result);
                    } else {
                        resultElement.textContent = data.result;
                    }
                } else {
                    resultElement.textContent = 'Tidak ada hasil.';
                }
                errorMessageElement.classList.add('hidden');
            })
            .catch(error => {
                console.error('Error:', error);
                showError(`Gagal terhubung atau terjadi kesalahan: ${error.message}`);
            });
    }

    function updateNoteOnServer(noteId, newText) {
        fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ note: newText }),
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().catch(() => ({})).then(err => {
                        throw new Error(err.description || 'Gagal mengupdate catatan.');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    showNotification('Catatan berhasil diperbarui!');
                    loadNotesFromServer(); // Muat ulang catatan
                } else {
                    throw new Error(data.description || 'Gagal mengupdate catatan.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(`Gagal mengupdate catatan: ${error.message}`);
            });
    }

    saveNoteButton.addEventListener('click', () => {
        const noteText = noteInput.value.trim();
        if (noteText === '') {
            alert('Catatan tidak boleh kosong.');
            return;
        }
        saveNoteToServer(noteText); // Panggil fungsi simpan ke server
    });

    // --- Event Listener Input Pencarian (Tetap Sama) ---
    if (searchInput) {
        searchInput.addEventListener('input', displaySavedNotes);
    }

    cancelEditButton.addEventListener('click', hideEditModal);
    closeEditModalX.addEventListener('click', hideEditModal); // Tambahkan listener untuk tombol X
    saveEditButton.addEventListener('click', () => {
        const newText = editNoteTextarea.value.trim();
        if (idToEdit !== null && newText !== '') {
            updateNoteOnServer(idToEdit, newText);
        } else if (newText === '') {
            alert("Catatan tidak boleh kosong.");
        }
        hideEditModal(); // Sembunyikan modal setelah klik
    });

    cancelDeleteButton.addEventListener('click', hideDeleteConfirmModal);
    confirmDeleteButton.addEventListener('click', () => {
        if (idToDelete !== null) {
            executeDelete(idToDelete);
        }
        hideDeleteConfirmModal(); // Sembunyikan modal setelah klik
    });

    if (closeResultButton && resultContainer) {
        closeResultButton.addEventListener('click', () => {
            resultContainer.classList.add('hidden'); // Sembunyikan kontainer hasil
        });
    }

    loadNotesFromServer(); // Muat dari server saat pertama kali

    // --- Inisialisasi SortableJS (MODIFIKASI) ---
    new Sortable(savedNotesGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        handle: '.note-card',
        filter: '.button-group',
        preventOnFilter: true,
        onEnd: function (evt) {
            // Jika pencarian aktif, jangan simpan & reset
            if (searchInput && searchInput.value.trim() !== '') {
                showNotification("Hapus filter pencarian untuk menyimpan .");
                loadNotesFromServer(); // Muat ulang urutan asli
                return;
            }

            // Ambil urutan baru dari DOM berdasarkan ID
            const cards = savedNotesGrid.querySelectorAll('.note-card');
            // Ambil atribut 'data-id' yang sudah kita set sebelumnya
            const newNotesIdOrder = Array.from(cards).map(card => card.getAttribute('data-id'));
            saveOrderToServer(newNotesIdOrder); // Kirim list ID ke server
        }
    });
});