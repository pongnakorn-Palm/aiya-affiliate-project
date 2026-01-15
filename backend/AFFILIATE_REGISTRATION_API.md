# Affiliate Registration API Documentation

## Overview
This API endpoint registers new affiliates into the Main System Database (PostgreSQL/Neon Tech) with automatic approval and default commission/discount settings.

## Endpoint
```
POST /api/register-affiliate-main
```

## Request Body
```json
{
  "name": "User Name",
  "email": "user@email.com",
  "tel": "0812345678",
  "generatedCode": "USERCODE123"
}
```

### Field Requirements
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 1-255 characters |
| `email` | string | Yes | Valid email format |
| `tel` | string | Yes | 9-20 characters (phone number) |
| `generatedCode` | string | Yes | 1-50 characters, A-Z and 0-9 only |

## Response

### Success (200)
```json
{
  "success": true,
  "message": "ลงทะเบียนสำเร็จ",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "USERCODE123"
  }
}
```

### Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "message": "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่",
  "field": "email"
}
```

#### Duplicate Code (409)
```json
{
  "success": false,
  "message": "รหัส Affiliate นี้ถูกใช้งานแล้ว",
  "field": "generatedCode",
  "errorType": "duplicate"
}
```

#### Duplicate Email (409)
```json
{
  "success": false,
  "message": "Email นี้ถูกลงทะเบียนแล้ว",
  "field": "email",
  "errorType": "duplicate"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง"
}
```

## Database Schema & Default Values

### User-Provided Fields
- `name` → from request body
- `email` → from request body
- `phone` → from request body `tel`
- `code` → from request body `generatedCode`

### Auto-Generated Fields
- `id` → UUID v4 (generated)
- `created_at` → NOW()
- `updated_at` → NOW()

### Business Logic Defaults

#### Commission & Discount Settings
All monetary values are stored as integers representing cents (e.g., 5000 = 50.00 THB)

| Field | Value | Description |
|-------|-------|-------------|
| `is_active` | `true` | Auto-approved for immediate use |
| `commission_type` | `'fixed'` | Fixed commission amount |
| `commission_value` | `5000` | Default: 50 THB |
| `discount_type` | `'fixed'` | Fixed discount amount |
| `discount_value` | `10000` | Default: 100 THB |

#### Package-Specific Settings
| Package | Commission | Discount |
|---------|------------|----------|
| Single | 5000 (50 THB) | 10000 (100 THB) |
| Duo | 10000 (100 THB) | 20000 (200 THB) |

#### Statistics (Initial Values)
| Field | Value |
|-------|-------|
| `total_registrations` | `0` |
| `total_commission` | `0` |
| `pending_commission` | `0` |
| `approved_commission` | `0` |

## Environment Setup

### Required Environment Variable
Add to your `.env` file:
```bash
MAIN_SYSTEM_DB_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"
```

### Getting the Connection String
1. Log in to your Neon Tech dashboard
2. Navigate to your project
3. Copy the PostgreSQL connection string
4. Paste it as the value for `MAIN_SYSTEM_DB_URL` in your `.env` file

## Security Features

### Rate Limiting
The endpoint inherits the application-wide rate limiting:
- 3 requests per minute per IP address
- Returns 429 status code when exceeded

### Validation
- **Input Sanitization**: All fields are validated before processing
- **Duplicate Prevention**: Checks for existing code and email before insertion
- **SQL Injection Protection**: Uses parameterized queries via postgres.js

### Error Handling
- Detailed validation errors for debugging
- Generic error messages for security (doesn't expose internal details)
- Proper HTTP status codes for different error types

## Example Usage

### cURL
```bash
curl -X POST http://localhost:3000/api/register-affiliate-main \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "tel": "0812345678",
    "generatedCode": "JOHN2024"
  }'
```

### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/api/register-affiliate-main', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    tel: '0812345678',
    generatedCode: 'JOHN2024'
  })
});

const data = await response.json();
console.log(data);
```

## Testing

### Health Check
First, verify the database connection:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T...",
  "database": "connected",
  "mainSystemDatabase": "connected"
}
```

### Register Test Affiliate
```bash
curl -X POST http://localhost:3000/api/register-affiliate-main \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "tel": "0899999999",
    "generatedCode": "TEST001"
  }'
```

## Troubleshooting

### Error: "MAIN_SYSTEM_DB_URL environment variable is required"
**Solution**: Add `MAIN_SYSTEM_DB_URL` to your `.env` file and restart the server.

### Error: "Main System Database connection failed"
**Possible causes**:
1. Invalid connection string format
2. Incorrect credentials
3. Network/firewall issues
4. Database server is down

**Solution**: Verify your connection string and test it using a PostgreSQL client like psql or pgAdmin.

### Error: "รหัส Affiliate นี้ถูกใช้งานแล้ว"
**Solution**: The code already exists in the database. Use a different `generatedCode`.

### Error: "Email นี้ถูกลงทะเบียนแล้ว"
**Solution**: The email is already registered. Use a different email address.

## Database Table Structure
```sql
CREATE TABLE affiliates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  code VARCHAR(50) NOT NULL UNIQUE,
  commission_type VARCHAR(50) NOT NULL,
  commission_value INTEGER NOT NULL,
  discount_type VARCHAR(50) NOT NULL,
  discount_value INTEGER NOT NULL,
  total_registrations INTEGER NOT NULL DEFAULT 0,
  total_commission INTEGER NOT NULL DEFAULT 0,
  pending_commission INTEGER NOT NULL DEFAULT 0,
  approved_commission INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  single_commission_value INTEGER NOT NULL,
  single_discount_value INTEGER NOT NULL,
  duo_commission_value INTEGER NOT NULL,
  duo_discount_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_affiliates_code ON affiliates(code);
CREATE INDEX idx_affiliates_email ON affiliates(email);
```

## Notes
- All monetary values are stored as integers (cents)
- Affiliates are auto-approved (`is_active: true`)
- Default commission and discount values can be modified after registration through your admin panel
- The endpoint uses the same rate limiting as other API endpoints
