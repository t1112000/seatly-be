# Cookie-Based Authentication Implementation

## Overview

Đã chuyển đổi authentication từ localStorage token sang HTTP-only cookie để tăng cường bảo mật.

## Changes Made

### 1. **Backend Changes**

#### Dependencies

- Đã cài đặt `cookie-parser` và `@types/cookie-parser`

#### `src/main.ts`

- Import `cookie-parser`
- Thêm middleware `app.use(cookieParser())`
- Cập nhật CORS config để enable credentials:
  ```typescript
  app.enableCors({
    origin: clientUrl,
    credentials: true,
    maxAge: 3600,
  });
  ```

#### `src/modules/auth/auth.controller.ts`

- **POST `/api/v1/auth/google`**:
  - Lưu token vào HTTP-only cookie thay vì trả về trong response body
  - Cookie config:
    - `httpOnly: true` - Không thể access từ JavaScript
    - `secure: true` (production) - Chỉ gửi qua HTTPS
    - `sameSite: 'lax'` - CSRF protection
    - `maxAge: 60 days`
  - Response: `{ success: true }` thay vì `{ token: "..." }`

- **POST `/api/v1/auth/logout`** (mới):
  - Clear cookie khi logout
  - Yêu cầu authentication

#### `src/common/guards/auth.guard.ts`

- Đọc token từ cookie trước: `request.cookies?.accessToken`
- Fallback về Authorization header nếu không có cookie (để test hoặc backward compatibility)

### 2. **Frontend Changes Required**

#### Axios Configuration

```typescript
// Thêm withCredentials để gửi cookies
axios.defaults.withCredentials = true;

// Hoặc cho từng request
axios.post('/api/v1/auth/google', data, {
  withCredentials: true,
});
```

#### Login Flow

```typescript
// Trước:
const { data } = await axios.post('/api/v1/auth/google', { access_token });
localStorage.setItem('token', data.token);

// Sau:
await axios.post(
  '/api/v1/auth/google',
  { access_token },
  {
    withCredentials: true,
  },
);
// Cookie tự động được set bởi browser
```

#### API Requests

```typescript
// Không cần thêm Authorization header nữa
// Cookie tự động được gửi với mỗi request
axios.get('/api/v1/auth/me', {
  withCredentials: true,
});
```

#### Logout

```typescript
await axios.post(
  '/api/v1/auth/logout',
  {},
  {
    withCredentials: true,
  },
);
```

### 3. **Security Benefits**

✅ **XSS Protection**: Cookie HTTP-only không thể access từ JavaScript
✅ **CSRF Protection**: SameSite=lax giảm thiểu CSRF attacks
✅ **Secure Transport**: Cookie chỉ gửi qua HTTPS trong production
✅ **Auto-cleanup**: Browser tự động xóa cookie khi hết hạn

### 4. **Environment Variables**

Đảm bảo có các biến môi trường:

```env
NODE_ENV=production # hoặc development
CLIENT_URL=http://localhost:3001 # URL của frontend
```

### 5. **Testing**

#### Development

- Cookie sẽ không có flag `secure` trong development
- Có thể test với HTTP

#### Production

- Cookie có flag `secure`, chỉ hoạt động với HTTPS
- Đảm bảo frontend và backend cùng domain hoặc configure CORS đúng

### 6. **Backward Compatibility**

Guard vẫn hỗ trợ Authorization header để:

- Test API với Postman/Swagger
- Mobile apps hoặc CLI tools
- Dễ dàng migrate dần dần

## Next Steps (Optional)

Nếu muốn implement refresh token sau này:

1. Tạo refresh token table/redis storage
2. Thêm endpoint `/api/v1/auth/refresh`
3. Implement token rotation
4. Thêm revoke mechanism cho logout
