# 📘 HƯỚNG DẪN BUILD & ĐẨY PROJECT LÊN GIT (CHO NGƯỜI KHÔNG BIẾT CODE)

Tài liệu này dành cho **người mới hoàn toàn**, chỉ cần làm theo từng bước là có thể:

* Chạy project ở máy cá nhân (local)
* Kiểm tra xem web có chạy không
* Đẩy code lên GitHub

---

## 1️⃣ Chuẩn bị trước khi bắt đầu

### 🔹 Cần cài những thứ sau (chỉ làm 1 lần)

1. **Git**

* Tải tại: [https://git-scm.com](https://git-scm.com)
* Cài đặt → cứ bấm `Next` đến khi xong

2. **Node.js (nếu là web React / Next / Vite)**

* Tải tại: [https://nodejs.org](https://nodejs.org)
* Chọn bản **LTS**

3. **Visual Studio Code (VS Code)**

* Tải tại: [https://code.visualstudio.com](https://code.visualstudio.com)

👉 Sau khi cài xong, **khởi động lại máy** cho chắc.

---

## 2️⃣ Mở project trên máy

1. Giải nén project (nếu là file .zip)
2. Chuột phải vào thư mục project → chọn **Open with Code** (VS Code)

---

## 3️⃣ Cài thư viện cho project

Trong VS Code:

1. Bấm **Ctrl + `** để mở Terminal
2. Gõ lệnh sau rồi Enter:

```bash
npm install
```

⏳ Chờ chạy xong (có thể mất 1–3 phút)

👉 Nếu không báo lỗi đỏ là **OK**.

---

## 4️⃣ Chạy project để kiểm tra (build local)

Gõ tiếp:

```bash
npm run dev
```

Hoặc (tuỳ project):

```bash
npm start
```

Sau đó Terminal sẽ hiện đại loại như:

```
Local: http://localhost:3000
```

👉 Mở trình duyệt → dán link đó → thấy web chạy là **THÀNH CÔNG** ✅

---

## 5️⃣ Kiểm tra nhanh trước khi đẩy Git

* Web mở được
* Không lỗi trắng trang
* Không lỗi đỏ trong Terminal

👉 OK thì sang bước tiếp.

---

## 6️⃣ Đẩy code lên GitHub

### 🔹 Bước 1: Kiểm tra đã có Git chưa

Trong Terminal gõ:

```bash
git --version
```

Nếu hiện version → OK

---

### 🔹 Bước 2: Add & commit code

Chạy lần lượt từng lệnh (copy từng dòng):

```bash
git add .
```

```bash
git commit -m "Update_Post_21/01/2025"
```

---

### 🔹 Bước 3: Đẩy lên GitHub

```bash
git push origin main
```

⏳ Lần đầu có thể yêu cầu đăng nhập GitHub → đăng nhập là xong.

👉 Nếu không báo lỗi đỏ → **ĐẨY THÀNH CÔNG** 🎉

---

## 7️⃣ Các lỗi thường gặp & cách xử lý nhanh

### ❌ Lỗi: `npm install` không chạy

➡ Kiểm tra đã cài Node.js chưa

---

### ❌ Lỗi: `git push` bị từ chối

Chạy:

```bash
git pull origin main
```

Sau đó thử lại:

```bash
git push origin main
```

---

### ❌ Lỗi: `not a git repository`

➡ Bạn đang mở **sai thư mục**
➡ Phải mở đúng thư mục có file `.git`

---

## 8️⃣ Checklist nhanh (chỉ cần tick)

* [ ] Đã cài Git
* [ ] Đã cài Node.js
* [ ] Đã mở project bằng VS Code
* [ ] `npm install` OK
* [ ] Web chạy được ở localhost
* [ ] `git add .`
* [ ] `git commit -m "..."`
* [ ] `git push origin main`

---

✅ **Làm xong tới đây là bạn đã build & đẩy code thành công như dev rồi đó.**

Nếu cần mình có thể:

* Viết bản **siêu ngắn 1 trang** cho khách
* Chỉnh lại cho **Next.js / React / Laravel** riêng
* Thêm ảnh minh hoạ từng bước