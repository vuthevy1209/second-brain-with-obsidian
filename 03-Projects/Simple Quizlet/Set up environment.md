---
title: Using Firebase
summary: Set up environment
tags:
  - daily
created: 2026-06-09
---
# Firebase

1. Đăng nhập vào Firebase Console → chọn project của bạn.
2. Vào Settings (biểu tượng bánh răng) → Project settings → tab "General".
3. Trong phần "Your apps" chọn app web (hoặc tạo app web mới). Bên dưới sẽ có đoạn cấu hình SDK.

```
# Firebase
VITE_API_KEY=
VITE_AUTH_DOMAIN=
VITE_PROJECT_ID=
VITE_STORAGE_BUCKET=
VITE_MESSAGING_SENDER_ID=
VITE_APP_ID=
```

![[Set up environment-1781016195335.webp]]
![[Set up environment-1781017179825.webp]]


- Bật Authentication

![[Set up environment-1781018049289.webp]]



# Cloudinary

```
# Cloudinary (used for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=dghhudofbdfb
VITE_CLOUDINARY_UPLOAD_PRESET=preset
```

![[Set up environment-1781016992936.webp]]

