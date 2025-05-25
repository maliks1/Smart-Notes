
# 📝 Smart Notes - Catatan Cerdas dengan Dukungan AI

## Deskripsi

**Smart Notes** adalah aplikasi web pencatat yang intuitif dan modern, dibangun dengan antarmuka dinamis menggunakan HTML, TailwindCSS, dan JavaScript sebagai frontend dan Python Flask untuk backend. 
Aplikasi ini dirancang untuk penggunaan lokal, memungkinkan Anda membuat, mengedit, mencari, mengatur ulang, dan menghapus catatan dengan mudah.

Keunggulan utama **Smart Notes** adalah integrasinya dengan **AI melalui Replicate API**, menggunakan model **IBM Granite**. Fitur ini mampu mendeteksi tipe catatan Anda secara otomatis (seperti Rapat, Acara, Ide, Kode, atau Umum) dan memberikan ringkasan atau analisis yang relevan dan terstruktur, membantu Anda mendapatkan wawasan lebih cepat dari catatan Anda.

## Teknologi yang Digunakan

* **Frontend:**
    * HTML5
    * CSS3
    * TailwindCSS (Framework CSS)
    * JavaScript (ES6+)
* **Backend:**
    * Python 3.x
    * Flask (Web Framework)
* **Library JavaScript:**
    * SortableJS (Untuk fitur drag-and-drop urutan catatan)
    * Marked.js (Untuk merender output AI dalam format Markdown)
* **AI Service:**
    * Replicate API
    * Model: `ibm-granite/granite-3.3-8b-instruct`
* **Penyimpanan Data:**
    * File JSON (Lokal)

## Fitur Utama

* ✨ **Manajemen Catatan (CRUD):** Buat, Baca, Perbarui (teks & urutan), dan Hapus catatan.
* 🧠 **Dukungan AI Cerdas:**
    * Deteksi tipe catatan otomatis (Rapat, Acara, Ide, Kode, Umum).
    * Ringkasan dan analisis kontekstual berdasarkan tipe catatan.
    * Tampilan hasil AI yang jelas dan dapat ditutup.
* 🚀 **Antarmuka Responsif & Dinamis:**
    * Dibangun dengan TailwindCSS untuk tampilan modern di berbagai perangkat.
    * Interaksi tanpa *refresh* halaman (AJAX) untuk menambah, menghapus, dan memproses AI.
* ↕️ **Urutkan dengan Mudah:** Atur ulang urutan catatan Anda dengan *drag-and-drop*.
* 🔍 **Pencarian Cepat:** Temukan catatan Anda secara instan dengan fitur pencarian *real-time*.
* 📄 **Tampilan Kotak Dialog:** Lihat catatan lengkap dan konfirmasi hapus/edit dalam modal yang nyaman.
* ✍️ **Edit Langsung:** Perbarui teks catatan Anda langsung dari antarmuka.
* 🔔 **Notifikasi:** Dapatkan pemberitahuan visual untuk aksi yang berhasil (simpan, hapus, update).
* 📋 **Dukungan Markdown:** Hasil AI ditampilkan dengan format Markdown untuk keterbacaan yang lebih baik.
* 🔒 **Keamanan Input (Anti-XSS):** Dirancang dengan keamanan sebagai prioritas. Semua input pengguna ditangani dan ditampilkan secara aman untuk mencegah eksekusi skrip berbahaya (Cross-Site Scripting - XSS). Anda bebas memasukkan teks apa pun, termasuk contoh kode atau format yang mirip dengan payload XSS, tanpa perlu khawatir akan membahayakan sesi browser atau PC Anda.

## Petunjuk Setup (Instalasi Lokal)

Ikuti langkah-langkah berikut untuk menjalankan Smart Notes di komputer lokal Anda menggunakan *virtual environment*.

1.  **Prasyarat:**
    * Pastikan Anda telah menginstal **Python 3.7+** dan **pip**.
    * (Opsional) Git untuk mengkloning repositori.

2.  **Kloning Repositori:**
    ```bash
    git https://github.com/maliks1/Smart-Notes.git
    cd Smart-Notes
    ```
    *(Jika Anda tidak menggunakan Git, cukup unduh dan ekstrak file proyek, lalu buka terminal/CMD di folder tersebut)*

3.  **Buat Virtual Environment:**
    Sangat penting untuk menggunakan *virtual environment* (`venv`) agar dependensi proyek ini tidak tercampur dengan instalasi Python global Anda.
    ```bash
    python -m venv venv
    ```
    Perintah ini akan membuat folder bernama `venv` di dalam direktori proyek Anda.

4.  **Aktifkan Virtual Environment:**
    Setiap kali Anda ingin mengerjakan proyek ini, Anda harus mengaktifkan `venv` terlebih dahulu.
    * **Di Windows (Command Prompt):**
        ```bash
        .\venv\Scripts\activate
        ```
    * **Di Windows (PowerShell):**
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
        *(Jika Anda mendapatkan error, Anda mungkin perlu menjalankan `Set-ExecutionPolicy Unrestricted -Scope Process` terlebih dahulu)*
    * **Di macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```
    *(Setelah aktif, Anda akan melihat `(venv)` muncul di awal prompt terminal Anda)*

5.  **Instal Dependensi Python (di dalam venv):**
    Pastikan `venv` Anda sudah aktif (ada `(venv)` di prompt), lalu instal semua library yang terdaftar di `requirements.txt`:
    ```bash
    pip install -r requirements.txt
    ```
    *(Anda juga bisa memperbarui pip terlebih dahulu dengan `pip install --upgrade pip`)*

6.  **Atur Kunci API Replicate:**
    Anda **WAJIB** mengatur kunci API Replicate Anda sebagai *environment variable*. Dapatkan kunci Anda dari [Replicate.com](https://replicate.com/).
    * **Di Windows (Command Prompt - Sesi Saat Ini):**
        ```bash
        set REPLICATE_API_TOKEN=YourApiTokenHere
        ```
    * **Di Windows (PowerShell - Sesi Saat Ini):**
        ```powershell
        $env:REPLICATE_API_TOKEN="YourApiTokenHere"
        ```
    * **Di macOS/Linux (Sesi Saat Ini):**
        ```bash
        export REPLICATE_API_TOKEN=YourApiTokenHere
        ```
    **Penting:** Ganti `YourApiTokenHere` dengan kunci API Anda yang sebenarnya. Untuk pengaturan permanen, tambahkan ke *environment variables* sistem Anda.

7.  **Jalankan Aplikasi:**
    Pastikan `venv` masih aktif, lalu jalankan:
    ```bash
    python app.py
    ```

8.  **Akses Aplikasi:**
    Buka browser web Anda dan kunjungi alamat: `http://127.0.0.1:5000`

9. **Untuk Berhenti:** Tekan `Ctrl+C` di terminal. Untuk menonaktifkan `venv`, cukup ketik:
    ```bash
    deactivate
    ```

## Penjelasan Dukungan AI

Fitur AI di Smart Notes didukung oleh model bahasa besar melalui Replicate API. Berikut cara kerjanya:

1.  **Pemicu:** Anda dapat memicu AI dengan:
    * Mengklik tombol "Proses" pada setiap kartu catatan yang ada.
2.  **Deteksi Tipe:** Saat AI dipicu, teks catatan pertama kali dianalisis oleh fungsi `deteksi_tipe_catatan` di backend. Fungsi ini menggunakan kata kunci (seperti 'rapat', 'acara', 'def', 'ide:') dan pola (seperti tanggal/waktu) untuk mengklasifikasikan catatan ke dalam salah satu tipe: `acara`, `rapat`, `kode`, `ide`, atau `umum`.
3.  **Prompt Adaptif:** Berdasarkan tipe yang terdeteksi, sistem akan memilih *prompt* (instruksi) yang paling sesuai dari `PROMPT_CONFIG`. Setiap prompt dirancang khusus untuk meminta AI melakukan tugas tertentu:
    * **Acara:** Mengekstrak Nama, Tanggal, Waktu, Lokasi, dan Poin Penting.
    * **Rapat:** Membuat Notulen, Keputusan Utama, dan Action Items.
    * **Kode:** Menjelaskan fungsi kode, bahasa, dan contoh.
    * **Ide:** Menganalisis keuntungan dan tantangan.
    * **Umum:** Memberikan ringkasan atau poin kunci.
4.  **Panggilan API:** Prompt yang sudah diformat beserta teks catatan dikirim ke model IBM Granite di Replicate.
5.  **Tampilan Hasil:** Respons dari AI diterima kembali oleh aplikasi dan ditampilkan dalam format Markdown (jika memungkinkan) di bagian "Hasil dari IBM Granite", memberikan Anda wawasan atau ringkasan yang terstruktur. Anda bisa menutup bagian hasil ini jika sudah tidak diperlukan.

Fitur ini bertujuan untuk mengubah catatan biasa menjadi informasi yang lebih actionable dan mudah dipahami.