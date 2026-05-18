# Cowork × Mutagen × Tmux — Realtime Sync & Background Task Workflow

> Hướng dẫn thực hành: Dùng Mutagen để đồng bộ mã nguồn Realtime giữa máy cá nhân (Windows) và máy chủ từ xa (Linux), và dùng Tmux để quản lý tác vụ ngầm trên Linux.

## I. Giới thiệu tổng quan

### 1. Mục đích của tài liệu

Tài liệu này hướng dẫn cách thiết lập môi trường làm việc kết hợp giữa máy cá nhân (Windows) và máy chủ từ xa (Linux). Mục tiêu là đảm bảo mã nguồn luôn được đồng bộ theo thời gian thực (realtime) và các tác vụ nặng (như AI, build code) có thể chạy ngầm an toàn trên máy chủ ngay cả khi máy cá nhân đã tắt.

### 2. Quy trình làm việc (Workflow)

- **Máy Windows (Local):** Sử dụng các công cụ như Cowork để lên kế hoạch, ghi chú và chỉnh sửa code nhẹ nhàng.
- **Máy Linux (Remote Server):** Chạy Claude Code hoặc các tác vụ nặng.
- **Công cụ kết nối:**
  - **Mutagen:** Đồng bộ file 2 chiều siêu tốc giữa Windows và Linux.
  - **Tmux:** Giữ cho Claude Code (và các tác vụ khác) chạy ngầm trên Linux không bị ngắt khi tắt máy Windows.

## II. Quản lý tác vụ ngầm với Tmux trên Linux

### 1. Khái niệm và lợi ích

Tmux (**Terminal Multiplexer**) là công cụ cho phép tạo một "màn hình ảo" trên máy chủ.

- **Lợi ích:** Khi bạn ngắt kết nối SSH, các tiến trình chạy trong Tmux vẫn tiếp tục hoạt động. Lần sau kết nối lại, bạn có thể mở lại đúng màn hình đó.

### 2. Cài đặt Tmux

Truy cập vào máy chủ Linux qua SSH và chạy lệnh cài đặt:

- **Ubuntu/Debian:** `sudo apt update && sudo apt install tmux -y`
- **CentOS/RHEL:** `sudo dnf install tmux -y` (hoặc `yum`)

### 3. Cấu hình hỗ trợ chuột (Tùy chọn nhưng khuyên dùng)

Để có thể dùng chuột cuộn log hoặc click chuyển đổi giữa các ô làm việc, hãy tạo file cấu hình:

1. Chạy lệnh: `nano ~/.tmux.conf`
2. Dán nội dung: `set -g mouse on`
3. Lưu lại (`Ctrl+O`, **Enter**) và thoát (`Ctrl+X`).
4. Kích hoạt: `tmux source-file ~/.tmux.conf`

### 4. Các thao tác cơ bản

- **Xem danh sách phiên:** `tmux ls`
- **Tạo phiên làm việc mới:** `tmux new -s <mytask>`
- **Thoát tạm thời (Detach):** `Ctrl + B` → `D` hoặc `tmux d` (không cần nhấn `Ctrl + B`).
- **Quay lại phiên cũ (Attach):** `tmux a -t <mytask>`
- **Đóng hoàn toàn (Kill):** `exit` khi đang ở bên trong Tmux, hoặc `tmux kill-session -t <mytask>` để đóng phiên cụ thể.
- **Đóng tất cả phiên:** `tmux kill-server`

## III. Thiết lập kết nối SSH tự động (Bắt buộc)

Mutagen chạy ngầm và không thể hiển thị bảng hỏi mật khẩu. Do đó, việc thiết lập SSH Key không mật khẩu là bắt buộc.

### 1. Tạo SSH Key trên Windows

Mở PowerShell trên Windows và chạy:

```
ssh-keygen -t ed25519
```

_(Nhấn Enter liên tiếp 3 lần để giữ mặc định và không đặt mật khẩu cho file key)._

### 2. Cấu hình File config trên Windows (Sửa lỗi không nhận Hostname)

Để kết nối dễ dàng bằng tên (ví dụ `webserver`) thay vì nhớ IP:

1. Mở PowerShell với quyền Admin: `notepad $env:USERPROFILE\\.ssh\\config`
2. Dán cấu hình sau (thay IP thực tế):

```
Host webserver
 HostName 192.168.x.x
 User administrator
 IdentityFile ~/.ssh/id_ed25519
```

3. Lưu và đóng file.

### 3. Copy Public Key lên máy Linux

1. Trên Windows, mở file `$env:USERPROFILE\\.ssh\\id_ed25519.pub` bằng Notepad và **copy** toàn bộ nội dung bên trong.
2. SSH vào máy Linux (lúc này vẫn cần nhập mật khẩu), chạy các lệnh sau:

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
```

3. Dán đoạn key vừa copy vào, lưu lại và thoát.
4. Phân quyền bảo mật: `chmod 600 ~/.ssh/authorized_keys`

**Kiểm tra:** Mở PowerShell mới trên Windows, gõ `ssh webserver`. Nếu truy cập thành công mà không hỏi mật khẩu là đạt yêu cầu.

## IV. Cài đặt và cấu hình Mutagen đồng bộ mã nguồn

### 1. Lựa chọn môi trường

Chúng ta cài Mutagen trên **Windows** vì Cowork hoạt động trên Windows. Mutagen sẽ đóng vai trò trung gian, lấy file từ ổ cứng Windows đẩy thẳng qua SSH lên Linux.

### 2. Cài đặt trên Windows

Thực hiện theo các bước sau để cài đặt Mutagen thông qua file thực thi:

1. **Tải tệp:** Truy cập vào trang Releases của [Mutagen](https://github.com/mutagen-io/mutagen/releases/latest) trên GitHub. Tải về file nén (zip) dành cho hệ điều hành Windows phiên bản **AMD64** (ví dụ: mutagen_windows_amd64_v...zip).
2. **Giải nén và thiết lập:**
   - Giải nén file .zip vừa tải về.
   - Tạo thư mục `.local\bin` bên trong thư mục người dùng của bạn nếu chưa có (có thể mở PowerShell và chạy lệnh: `mkdir -p $env:USERPROFILE\.local\bin`).
   - Di chuyển file mutagen.exe vào thư mục vừa tạo (`$env:USERPROFILE\.local\bin`).
3. **Cấu hình biến môi trường (PATH):**
   - Đảm bảo đường dẫn `%USERPROFILE%\.local\bin` đã được thêm vào biến môi trường `PATH` của hệ thống. Điều này giúp Windows nhận diện lệnh `mutagen` ở bất kỳ thư mục nào.
4. **Kiểm tra cài đặt:** Mở một cửa sổ PowerShell mới và chạy lệnh:

```
mutagen version
```

### 3. Khởi tạo phiên đồng bộ đầu tiên (Kéo code từ Server về)

Giả sử trên Server đã có code, nhưng máy Windows đang là thư mục trống. Tạo một thư mục trống trên Windows, mở PowerShell và chạy:

```
mutagen sync create --name=mathsnap \
   "." \
   "webserver:~/projects/.local/mathsnap" \
   --mode=two-way-resolved \
   --ignore-vcs \
   --ignore="node_modules,bin,obj" \
   --symlink="ignore"
```

- `--mode=two-way-resolved`: Đồng bộ 2 chiều, tự động giải quyết xung đột dựa trên thời gian sửa file.
- `--ignore-vcs`: Bỏ qua thư mục .git (Rất quan trọng để tránh lỗi git index).
- `--ignore="..."`: Tương đương .gitignore, bỏ qua các file build/rác.
- `--symlink="ignore"`: Bỏ qua việc tạo symlink.

### 4. Quản lý các phiên đồng bộ

- **Xem trạng thái:** `mutagen sync list` (Trạng thái Watching for changes là đang hoạt động tốt).
- **Tạm dừng:** `mutagen sync pause mathsnap`
- **Tiếp tục:** `mutagen sync resume mathsnap`
- **Xóa kết nối:** `mutagen sync terminate mathsnap`

## V. Quy trình làm việc thực tế

1. **Bắt đầu ngày làm việc:** Bật máy Windows, mở PowerShell gõ `mutagen sync list` để đảm bảo kết nối đang chạy.
2. **Lập kế hoạch & Viết code:** Mở Cowork trên Windows, trỏ vào thư mục dự án. Mọi chỉnh sửa sẽ tự động đẩy lên Linux trong tích tắc.
3. **Thực thi tác vụ:**
   - Mở Terminal, gõ `ssh webserver`
   - Gõ `tmux a` để quay lại màn hình đang chạy Claude Code.
   - Ra lệnh cho Claude Code thực thi các thay đổi mới nhất.
4. **Kết thúc:** Thoát Tmux bằng `Ctrl + B`, `D`. Tắt máy Windows. (Claude Code trên Server vẫn tự động chạy ngầm).

## VI. Xử lý sự cố thường gặp (Troubleshooting)

### 1. Lỗi _"Could not resolve hostname"_

- **Nguyên nhân:** Windows không hiểu webserver là IP nào.
- **Khắc phục:** Kiểm tra lại bước cấu hình file `~/.ssh/config` trên Windows (Mục III - Bước 2).

### 2. Trạng thái Mutagen báo _"Waiting for connection"_

- **Nguyên nhân:** Mutagen bị Server chặn lại đòi mật khẩu SSH.
- **Khắc phục:** Thực hiện lại bước Copy Public Key lên file authorized_keys của server (Mục III - Bước 3). Đảm bảo phân quyền `chmod 600 ~/.ssh/authorized_keys`.

### 3. Máy Windows tắt, khi bật lại code có đồng bộ không?

- **Trả lời:** CÓ. Khi máy Windows bật lại và kết nối mạng, Mutagen sẽ thực hiện quá trình **Reconciliation (Đối soát)**. Mọi thay đổi do Claude Code tự động sửa trên Linux trong lúc Windows tắt sẽ được Mutagen tải ngược (pull) về máy Windows tự động. Tránh chỉnh sửa cùng 1 file trên Windows khi đang mất kết nối để hạn chế Conflict.
