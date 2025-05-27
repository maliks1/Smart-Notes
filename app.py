# Import Library yang Dibutuhkan
from flask import Flask, render_template, request, jsonify, abort
import replicate
import os
import re
import json
import uuid

# Inisialisasi Aplikasi Flask
app = Flask(__name__)

REPLICATE_API_TOKEN = os.environ.get('REPLICATE_API_TOKEN')
if not REPLICATE_API_TOKEN:
    print("PERINGATAN: REPLICATE_API_TOKEN tidak diatur. Fitur AI tidak akan berfungsi.")
    # Tidak perlu exit, biarkan aplikasi jalan tapi fitur AI akan gagal dengan jelas nanti.
else:
    # Set hanya jika diperlukan oleh library (seringkali tidak perlu)
    os.environ['REPLICATE_API_TOKEN'] = REPLICATE_API_TOKEN

# Tentukan model Replicate yang akan digunakan
MODEL = "ibm-granite/granite-3.3-8b-instruct"

# Pengaturan Penyimpanan Catatan (File JSON)
NOTES_FILE = 'tmp/catatan.json'  # Nama file JSON untuk menyimpan catatan


def load_notes():
    """Memuat semua catatan dari file (List of Dicts)."""
    if not os.path.exists(NOTES_FILE):
        return []
    try:
        with open(NOTES_FILE, 'r', encoding='utf-8') as f:
            content = f.read().strip()  # Gunakan strip() untuk menangani file kosong
            if not content:  # Jika file kosong setelah strip
                return []
            data = json.loads(content)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, IOError) as e:
        app.logger.error(
            f"Error saat memuat catatan: {e}. Mengembalikan list kosong.")
        return []


def save_notes(notes):
    """Menyimpan list catatan ke file (List of Dicts)."""
    try:
        with open(NOTES_FILE, 'w', encoding='utf-8') as f:
            json.dump(notes, f, indent=4, ensure_ascii=False)
    except IOError as e:
        print(f"Error saat menyimpan catatan: {e}")

# Fungsi Logika AI (Deteksi Tipe & Buat Prompt)


# Konfigurasi Prompt AI Berdasarkan Tipe Catatan
PROMPT_CONFIG = {
    "acara": {
        "template": (
            "Peran: Anda adalah Asisten Perencana Acara yang efisien.\n"
            "Tugas: Ekstrak informasi kunci dari catatan acara berikut dan berikan ringkasan terstruktur. "
            "Sebutkan jika ada informasi penting (Nama Acara, Tanggal, Waktu, Lokasi) yang tidak ditemukan.\n"
            "Format Output (Gunakan Markdown):\n"
            "  - **Nama Acara**: [Nama Acara atau 'Tidak disebutkan']\n"
            "  - **Tanggal**: [Tanggal Acara atau 'Tidak disebutkan']\n"
            "  - **Waktu**: [Waktu Acara atau 'Tidak disebutkan']\n"
            "  - **Lokasi**: [Lokasi Acara atau 'Tidak disebutkan']\n"
            "  - **Hal Penting (Maksimal 3)**:\n"
            "    1. [Hal 1]\n"
            "    2. [Hal 2]\n"
            "    3. [Hal 3]\n\n"
            "Catatan Acara:\n---\n{note_text}\n---"
        ),
        "params": {"max_tokens": 350, "temperature": 0.3}
    },
    "rapat": {
        "template": (
            "Peran: Anda adalah Notulis Rapat Profesional dan Akurat.\n"
            "Tugas: Buat ringkasan notulen rapat berikut dalam format Markdown. "
            "Fokus pada **Keputusan Utama** dan **Action Items**. "
            "Sertakan penanggung jawab (PIC) dan tenggat waktu (Deadline) jika disebutkan. "
            "Jika tidak ada Action Items, sebutkan 'Tidak ada Action Items'.\n"
            "Format Output:\n"
            "  ### Ringkasan Rapat\n"
            "  [Ringkasan singkat tujuan & hasil rapat]\n\n"
            "  ### Keputusan Utama\n"
            "  - [Keputusan 1]\n"
            "  - [Keputusan ...]\n\n"
            "  ### Action Items\n"
            "  - [Tugas 1] - **PIC**: [Nama/Tidak disebutkan] - **Deadline**: [Tanggal/Tidak disebutkan]\n"
            "  - [Tugas ...]\n\n"
            "Notulen Rapat:\n---\n{note_text}\n---"
        ),
        "params": {"max_tokens": 750, "temperature": 0.2}
    },
    "kode": {
        "template": (
            "Peran: Anda adalah Programmer Senior yang ahli menjelaskan kode.\n"
            "Tugas: Jelaskan potongan kode berikut dalam bahasa Indonesia yang mudah dimengerti. Identifikasi bahasa pemrograman jika memungkinkan.\n"
            "Format Output:\n"
            "  - **Bahasa Pemrograman**: [Bahasa atau 'Tidak dapat dipastikan']\n"
            "  - **Tujuan Utama Kode**: [Penjelasan singkat]\n"
            "  - **Penjelasan Detail**: [Penjelasan lebih rinci per bagian/fungsi]\n"
            "  - **Contoh Penggunaan Sederhana**: [Contoh kode singkat]\n\n"
            "Potongan Kode:\n```\n{note_text}\n```"
        ),
        "params": {"max_tokens": 650, "temperature": 0.4}
    },
    "ide": {
        "template": (
            "Peran: Anda adalah Analis Strategi yang Kritis dan Inovatif.\n"
            "Tugas: Lakukan analisis seimbang terhadap ide berikut. Berikan 3 potensi keuntungan utama dan 3 potensi tantangan/risiko utama dalam mengimplementasikannya. Gunakan format Markdown.\n"
            "Format Output:\n"
            "  ### Analisis Ide\n"
            "  **Ide Utama**: [Ringkasan singkat ide]\n\n"
            "  #### Potensi Keuntungan\n"
            "  1. [Keuntungan 1]\n"
            "  2. [Keuntungan 2]\n"
            "  3. [Keuntungan 3]\n\n"
            "  #### Potensi Tantangan/Risiko\n"
            "  1. [Tantangan 1]\n"
            "  2. [Tantangan 2]\n"
            "  3. [Tantangan 3]\n\n"
            "Ide:\n---\n{note_text}\n---"
        ),
        "params": {"max_tokens": 550, "temperature": 0.6}
    },
    "umum": {
        "template": (
            "Tugas: Ringkas catatan berikut atau ekstrak poin-poin/informasi kunci yang paling penting. "
            "Sajikan dalam format yang jelas dan mudah dibaca (gunakan bullet points jika sesuai). "
            "Jangan menambahkan informasi atau opini yang tidak ada di dalam teks asli.\n\n"
            "Catatan:\n---\n{note_text}\n---"
        ),
        "params": {"max_tokens": 1024, "temperature": 0.5}
    }
}


# Konstanta untuk Deteksi Tipe
KATA_KUNCI_ACARA = ['acara', 'event', 'undangan',
                    'jadwal', 'pertemuan', 'party', 'ulang tahun']
KATA_KUNCI_RAPAT = ['rapat', 'meeting',
                    'notulen', 'diskusi', 'agenda', 'hadir:']
KATA_KUNCI_KODE = ['def ', 'function ',
                   'class ', '<div>', 'import ', 'require(']
KATA_KUNCI_IDE = ['ide:', 'gagasan:', 'bagaimana jika', 'mungkin kita bisa']
POLA_TANGGAL = re.compile(
    r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)\s+\d{4}')
POLA_WAKTU = re.compile(r'\d{1,2}:\d{2}')


def deteksi_tipe_catatan(note_text):
    """Mencoba mendeteksi tipe catatan berdasarkan kata kunci dan pola."""
    text_lower = note_text.lower()
    ada_tanggal = POLA_TANGGAL.search(text_lower)
    ada_waktu = POLA_WAKTU.search(text_lower)

    if any(kata in text_lower for kata in KATA_KUNCI_ACARA) and (ada_tanggal or ada_waktu):
        return "acara"
    if any(kata in text_lower for kata in KATA_KUNCI_RAPAT):
        return "rapat"
    # Perhatikan note_text (bukan lower) untuk kode
    if any(kata in note_text for kata in KATA_KUNCI_KODE):
        return "kode"
    if any(kata in text_lower for kata in KATA_KUNCI_IDE):
        return "ide"
    return "umum"
# Fungsi Buat Prompt yang Dioptimasi


def buat_prompt_adaptif(note_text):
    """Membuat prompt AI berdasarkan tipe catatan yang terdeteksi,
       menggunakan konfigurasi terpusat."""

    # Panggil fungsi deteksi tipe catatan Anda
    tipe = deteksi_tipe_catatan(note_text)
    print(f"DEBUG: Tipe catatan terdeteksi: {tipe}")

    # Ambil konfigurasi prompt berdasarkan tipe, jika tidak ada gunakan 'umum'
    config = PROMPT_CONFIG.get(tipe, PROMPT_CONFIG["umum"])

    # Format prompt dengan teks catatan
    prompt = config["template"].format(note_text=note_text)

    # Ambil parameter
    params = config["params"]

    return prompt, params

# --- [START] API Endpoints untuk CRUD Catatan ---

# [CREATE] Menambahkan catatan baru
@app.route('/api/notes', methods=['POST'])
def add_note_api():
    """[CREATE] Menambahkan catatan baru dengan ID unik."""
    if not request.json or 'note' not in request.json:
        abort(400, description="Request harus JSON dan mengandung 'note'.")
    note_text = request.json['note'].strip()
    if not note_text:
        abort(400, description="'note' tidak boleh kosong.")
    notes = load_notes()
    new_note = {"id": str(uuid.uuid4()), "text": note_text}
    notes.append(new_note)
    save_notes(notes)
    return jsonify({'status': 'success', 'note': new_note}), 201

# [READ] Mendapatkan semua catatan
@app.route('/api/notes', methods=['GET'])
def get_notes_api():
    """[READ] Mengirim semua catatan (dengan ID) sebagai JSON."""
    notes = load_notes()
    return jsonify(notes)

# [UPDATE] Memperbarui urutan catatan


@app.route('/api/notes/order', methods=['PUT'])
def update_order_api():
    """[UPDATE] Memperbarui urutan catatan berdasarkan list ID."""
    if not request.json:
        abort(400, description="Request harus JSON.")
    id_order = request.json
    if not isinstance(id_order, list):
        abort(400, description="Request harus list ID.")
    notes = load_notes()
    notes_dict = {note['id']: note for note in notes if 'id' in note}
    new_notes_order = [notes_dict[note_id]
                       for note_id in id_order if note_id in notes_dict]
    new_notes_order.extend(
        [note for note_id, note in notes_dict.items() if note_id not in id_order])
    save_notes(new_notes_order)
    return jsonify({'status': 'success'})


# [DELETE] Menghapus catatan berdasarkan index
@app.route('/api/notes/<string:note_id>', methods=['DELETE'])
def delete_note_api(note_id):
    """[DELETE] Menghapus catatan berdasarkan ID."""
    notes = load_notes()
    original_length = len(notes)
    notes_after_delete = [note for note in notes if note.get("id") != note_id]
    if len(notes_after_delete) < original_length:
        save_notes(notes_after_delete)
        return jsonify({'status': 'success', 'deleted_id': note_id})
    else:
        abort(404, description="Catatan tidak ditemukan.")
# --- [END] API Endpoints untuk CRUD Catatan ---

# --- [START] Tambahkan Endpoint Baru untuk Update Teks ---


@app.route('/api/notes/<string:note_id>', methods=['PUT'])
def update_note_text_api(note_id):
    """[UPDATE] Memperbarui teks catatan berdasarkan ID."""
    if not request.json or 'note' not in request.json:
        abort(400, description="Request harus JSON dan mengandung 'note'.")
    new_text = request.json['note'].strip()
    if not new_text:
        abort(400, description="'note' tidak boleh kosong.")
    notes = load_notes()
    updated_note = None
    for note in notes:
        if note.get("id") == note_id:
            note["text"] = new_text
            updated_note = note
            break
    if updated_note:
        save_notes(notes)
        return jsonify({'status': 'success', 'note': updated_note})
    else:
        abort(404, description="Catatan tidak ditemukan.")
# --- [END] Tambahkan Endpoint Baru untuk Update Teks ---


@app.route('/', methods=['GET'])
def index():
    """Menampilkan halaman HTML utama."""
    return render_template('index.html')


@app.route('/process_note', methods=['POST'])
def process_note_endpoint():
    """Menerima catatan, memprosesnya dengan AI, dan mengembalikan hasilnya."""
    if 'note' not in request.form:
        return jsonify({'error': 'Form data harus mengandung "note".'}), 400
    note_text = request.form['note'].strip()
    if not note_text:
        return jsonify({'error': 'Catatan tidak boleh kosong'}), 400
    try:
        prompt_final, params_final = buat_prompt_adaptif(
            note_text)  # Pastikan ini diisi
        output = replicate.run(
            MODEL, input={**params_final, "prompt": prompt_final})
        return jsonify({'result': "".join(output)})
    except replicate.exceptions.ReplicateError as e:
        if "authentication failed" in str(e).lower() or "401" in str(e):
            return jsonify({'error': f'Autentikasi Replicate gagal (Periksa Token Anda!): {e}'}), 401
        elif "disabled" in str(e).lower():
            return jsonify({'error': f'Model deployment tidak aktif: {e}'}), 503
        else:
            return jsonify({'error': f'Terjadi kesalahan pada Replicate API: {e}'}), 500
    except Exception as e:
        print(f"Kesalahan Umum: {e}")
        return jsonify({'error': f'Terjadi kesalahan umum.'}), 500


# Menjalankan Aplikasi Flask
if __name__ == '__main__':
    # Jalankan dalam mode debug (akan restart otomatis saat ada perubahan & beri info error)
    # Jangan gunakan mode debug di produksi!
    app.run(debug=True)
