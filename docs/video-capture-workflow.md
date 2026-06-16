# Tài liệu Workflow: Quay Video 360° Google Earth

## 1. Tổng quan

Hệ thống tự động quay video 360° từ Google Earth dựa trên toạ độ (latitude, longitude) được gửi qua message queue (Apache Pulsar). Sau khi quay xong, video sẽ được upload lên MinIO storage và trả kết quả về qua Pulsar.

---

## 2. Luồng xử lý tổng quát

```
Pulsar Message → Nhận & Parse → Mở Chrome → Tìm vị trí → Quay video → Convert MP4 → Upload MinIO → Gửi kết quả
```

---

## 3. Chi tiết từng bước

### Bước 1: Nhận message từ Pulsar

- **Topic:** `persistent://public/default/property-capture-request`
- **Subscription:** `persistent-property-capture-request-subscription`

**Cấu trúc message nhận:**

| Field | Mô tả |
|-------|--------|
| propertyId | ID của property cần quay |
| data.longitude | Kinh độ |
| data.latitude | Vĩ độ |
| data.zoom | Mức zoom (mặc định: 20) |
| attempts | Số lần thử (tối đa 2) |
| app | Tên ứng dụng gọi |
| metadata | Thông tin bổ sung |

---

### Bước 2: Validate dữ liệu

- Kiểm tra `latitude` và `longitude` có tồn tại không
- Nếu thiếu → Negative Ack, message quay lại queue để retry
- Kiểm tra số lần `attempts` <= 2

---

### Bước 3: Mở Chrome và truy cập Google Earth

- Sử dụng **Puppeteer** (stealth mode) để điều khiển Chrome
- Viewport: **1920 x 1080**
- Truy cập: `https://earth.google.com/web/`
- Chờ canvas 3D load xong
- Đóng các popup/modal tự động

---

### Bước 4: Tìm vị trí trên Google Earth

- Mở thanh Search trên Google Earth
- Nhập toạ độ: `latitude, longitude`
- Chờ Earth di chuyển đến vị trí
- Áp dụng mức zoom (zoom 20 → scale thành zoom 4 trên Earth)

---

### Bước 5: Quay video (Screen Recording)

- Sử dụng **Chrome DevTools Protocol (CDP)** để screencast
- Cấu hình:
  - Thời lượng: **20 giây**
  - Frame rate: **10 FPS**
  - Format frame: JPEG (quality 95)
- Mỗi frame được lưu vào thư mục tạm `frames/`
- Tổng cộng: ~200 frames

---

### Bước 6: Convert frames → Video MP4

- Sử dụng **FFmpeg** để ghép frames thành video
- Cấu hình FFmpeg:
  - Codec: H.264 (libx264)
  - CRF: 18 (chất lượng cao)
  - Preset: veryfast
  - Crop filter: cắt bỏ phần UI của Google Earth
- Output: file `.mp4`
- Validate: video phải > **1 MB** (nếu nhỏ hơn = lỗi capture)

---

### Bước 7: Upload video lên MinIO

- **Endpoint:** MinIO Object Storage
- **Bucket:** `3d-tour-outside`
- **Path:** `3d-video-360/video-{uuid}.mp4`
- Trả về URL public: `https://{MINIO_URL}/{bucket}/{path}`

---

### Bước 8: Gửi kết quả qua Pulsar

- **Topic:** `persistent://public/default/property-capture-completed`

**Cấu trúc message trả về:**

| Field | Mô tả |
|-------|--------|
| eventType | Loại event (capture completed) |
| timestamp | Thời gian hoàn thành |
| propertyId | ID property |
| attempts | Số lần thử |
| app | Tên ứng dụng |
| videoUrl | URL video trên MinIO |
| metadata | Thông tin bổ sung |

---

### Bước 9: Cleanup

- Xoá folder `frames/` (các ảnh tạm)
- Xoá file `.mp4` local sau khi upload thành công
- Acknowledge message trên Pulsar

---

## 4. Xử lý lỗi

| Tình huống | Xử lý |
|------------|--------|
| Thiếu lat/lng | Negative Ack → retry |
| Chrome không load được | Negative Ack → retry (max 2 lần) |
| Video < 1MB | Coi như lỗi capture → retry |
| Upload MinIO thất bại | Negative Ack → retry |
| Quá 2 lần retry | Bỏ qua message, log error |

---

## 5. Sơ đồ luồng (Flow Diagram)

```
┌──────────────────┐
│  Pulsar Message  │
│  (capture-req)   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Validate Data   │──── Thiếu data ───→ Negative Ack
│  (lat, lng, zoom)│
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Launch Chrome   │
│  (Puppeteer)     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Navigate to     │
│  Google Earth    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Search Location │
│  & Apply Zoom    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Record 20s      │
│  (CDP Screencast)│
└────────┬─────────┘
         ↓
┌──────────────────┐
│  FFmpeg Convert  │
│  Frames → MP4    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Validate Video  │──── < 1MB ───→ Retry (max 2)
│  Size > 1MB      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Upload to MinIO │
│  (3d-tour-outside)│
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Publish Result  │
│  (capture-done)  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Cleanup &       │
│  Acknowledge     │
└──────────────────┘
```

---

## 6. Cấu hình hệ thống

| Biến môi trường | Mô tả |
|-----------------|--------|
| NODE_APP_PURSAL_URL | URL kết nối Pulsar |
| NODE_APP_PURSAL_TOKEN | Token xác thực Pulsar |
| NODE_APP_MINIO_URL | URL MinIO storage |
| NODE_APP_MINIO_ACCESS_KEY | Access key MinIO |
| NODE_APP_MINIO_SECRET_KEY | Secret key MinIO |
| NODE_APP_MINIO_BUCKET | Tên bucket (3d-tour-outside) |
| NODE_APP_MINIO_PATH_DIR | Thư mục lưu trữ |

---

## 7. Yêu cầu hạ tầng

- **Chrome/Chromium** đã cài đặt trên server
- **FFmpeg** đã cài đặt
- **Apache Pulsar** hoạt động
- **MinIO** hoạt động và accessible
- RAM khuyến nghị: >= 4GB (Puppeteer + FFmpeg)
