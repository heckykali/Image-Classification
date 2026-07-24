# Implementation TODO

## Phase 1: Backend - OTP & Email System
- [x] 1. Add email SMTP config to `backend/app/core/config.py`
- [x] 2. Create `backend/app/core/email.py` - Email utility
- [x] 3. Create `backend/app/core/otp.py` - OTP generation & store
- [x] 4. Add OTP schemas to `backend/app/schemas/auth.py`
- [x] 5. Update auth routes with OTP endpoints: `backend/app/api/routes/auth.py`
- [x] 6. Add `update_user()` to `backend/app/core/database.py`
- [x] 7. Add admin edit endpoint to `backend/app/api/routes/admin.py`
- [x] 8. Add `aiosmtplib` to `backend/requirements.txt`

## Phase 2: Frontend - OTP Flow & Auth
- [x] 1. Add OTP & admin update APIs to `frontend/src/services/api.js`
- [x] 2. Update `frontend/src/pages/RegisterPage.jsx` - OTP verification flow
- [x] 3. Update `frontend/src/pages/LoginPage.jsx` - OTP verification flow
- [x] 4. Update `frontend/src/App.jsx` - Require login for ALL pages

## Phase 3: Frontend - Admin User Edit
- [x] 1. Update `frontend/src/pages/AdminPage.jsx` - Add edit user modal

