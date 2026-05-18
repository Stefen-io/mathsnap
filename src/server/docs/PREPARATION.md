## Chuẩn bị môi trường

### Cài đặt Python

#### Cách 1: Cài truyền thống *(Windows only)*

**Dùng Microsoft Store (khuyên dùng cho Windows 10/11)**

1. Mở **Microsoft Store**
2. Tìm kiếm **"Python Install Manager"** (hoặc bản mới nhất)
3. Nhấn **Install** (cài xong có thể dùng luôn trong PowerShell hoặc CMD)

**Tải từ trang chính thức**

1. Truy cập: https://www.python.org/downloads/
2. Tải bản phù hợp với hệ điều hành (Windows)
3. Trong quá trình cài: **tick vào ô "Add Python to PATH"**
4. Chọn "Install Now" và chờ hoàn tất

---

#### Cách 2: Dùng `uv` *(Windows & Linux — khuyên dùng)*

`uv` là công cụ quản lý Python hiện đại, viết bằng Rust — cài đặt nhanh hơn `pip` nhiều lần và tích hợp luôn việc quản lý phiên bản Python, không cần cài Python thủ công trước.

**1. Cài đặt `uv`**

- Windows (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

- Linux / macOS:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Sau khi cài xong, khởi động lại terminal rồi kiểm tra:

```bash
uv --version
```

**2. Cài đặt Python bằng `uv`**

```bash
uv python install 3.12
```

📌 Thay `3.12` bằng phiên bản bạn cần. `uv` sẽ tự tải và cài vào thư mục riêng, không ảnh hưởng Python hệ thống.

⚠️ Mặc định, `uv` chỉ cài lệnh `python3.12` (có phiên bản cụ thể), **không** tạo lệnh `python` hay `python3`. Nếu bạn muốn dùng lệnh `python` như bình thường, thêm flag `--default`:

```bash
uv python install --default 3.12
```

---

### Kiểm tra phiên bản

- Cách truyền thống:

```bash
python --version
```

> Cập nhật pip để cài thư viện mới nhất (nếu cần):
>
> ```bash
> python -m pip install --upgrade pip
> ```

- Dùng `uv`:

```bash
uv python list
```

---

### Thiết lập môi trường dự án

Có hai hướng để quản lý thư viện. Chọn **một trong hai** và dùng nhất quán trong suốt dự án.

---

#### Cách truyền thống: `pip` + `requirements.txt`

**1. Tạo môi trường ảo**

Mở Terminal trong VS Code (bấm `Ctrl + ~`):

```bash
python -m venv .venv
```

📌 `.venv` là tên thư mục môi trường (dấu chấm giúp ẩn thư mục trên macOS/Linux)

**2. Kích hoạt môi trường ảo**

- Windows:

```bash
.venv\Scripts\activate
```

- macOS / Linux:

```bash
source .venv/bin/activate
```

⚠️ Nếu bị lỗi "execution policy" trên Windows, chạy lệnh sau (chỉ cần làm 1 lần):

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**3. Cài thư viện**

```bash
pip install <tên-thư-viện>
```

**4. Xuất danh sách thư viện**

```bash
pip freeze > requirements.txt
```

**5. Cài lại từ `requirements.txt`** (khi clone dự án về máy mới)

```bash
pip install -r requirements.txt
```

**6. Chạy server**

```bash
uvicorn app.main:app --reload
```

**Cấu trúc thư mục:**

```plaintext
my_project/
├── .venv/              ← Môi trường ảo (thêm vào .gitignore)
├── app/
│   └── main.py
├── requirements.txt    ← Danh sách thư viện
└── ...
```

---

#### Dùng `uv`: `uv add` + `pyproject.toml`

`uv` quản lý thư viện qua `pyproject.toml` thay vì `requirements.txt`. Không cần tạo hay kích hoạt venv thủ công — `uv` tự xử lý.

**1. Khởi tạo dự án** *(chỉ làm 1 lần cho dự án mới)*

```bash
uv init
```

Lệnh này tạo file `pyproject.toml` để quản lý dependencies.

**2. Thêm thư viện**

```bash
uv add <tên-thư-viện>
```

`uv` sẽ tự tạo `.venv`, cập nhật `pyproject.toml` và `uv.lock`.

**3. Đồng bộ thư viện** (khi clone dự án về máy mới, hoặc sau khi pull code có thay đổi dependencies)

```bash
uv sync
```

**4. Chạy lệnh trong môi trường dự án**

Dùng `uv run` — không cần kích hoạt venv thủ công:

```bash
uv run uvicorn app.main:app --reload # Chạy server
uv run python main.py # Chạy file main.py
uv run pytest # Chạy test
```

**Cấu trúc thư mục:**

```plaintext
my_project/
├── .venv/              ← Môi trường ảo (uv tự tạo, thêm vào .gitignore)
├── app/
│   └── main.py
├── pyproject.toml      ← Danh sách thư viện & cấu hình dự án
├── uv.lock             ← Lock file (nên commit lên Git)
└── ...
```

---

#### Chọn môi trường ảo trong VS Code

Mở Command Palette (bấm `Ctrl + Shift + P`), chọn `Python: Select Interpreter`, rồi chọn interpreter trong thư mục `.venv` của dự án.

✅ Sau bước này, VS Code sẽ dùng đúng môi trường `.venv` trong workspace.

---

## Cấu hình VS Code để chạy Python

### Nếu VS Code hỏi "Select Environment" lần đầu → chọn Python Debugger → chọn Python File

### Nếu không thấy, bạn có thể làm thủ công

1. Nhấn `Ctrl + Shift + P` → gõ "Debug: Open launch.json"
2. Chọn "Python" nếu được hỏi loại dự án
3. Trong file `launch.json`, chỉnh như sau:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Run main.py",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal"
    }
  ]
}
```

`program: "${file}"` → nghĩa là sẽ chạy file đang mở hiện tại khi nhấn F5.
