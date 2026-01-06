# Razorpay Sandbox Testing Guide for TaskFlow

## Overview
This guide explains how to set up and test payments using **Razorpay's Sandbox (Test) Environment**. No real money is charged in sandbox mode.

---

## Part 1: Initial Setup

### 1.1 Create Razorpay Account
1. Visit [https://razorpay.com/](https://razorpay.com/)
2. Click **"Sign Up"** (top right)
3. Enter:
   - Email address
   - Strong password
   - Phone number
   - Business name: `LocalLink`
4. Verify your email via the link sent to your inbox
5. Complete KYC verification (usually 1-2 hours)

### 1.2 Access Sandbox Credentials
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. **IMPORTANT**: Toggle to **"Test Mode"** (top-right corner - screen turns blue)
3. Go to **Settings** → **API Keys**
4. Copy:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (long string)

### 1.3 Configure Environment Variables

**Backend (.env file)**:
```env
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET_HERE
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Frontend (.env.local or .vite.env)**:
```env
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID_HERE
```

### 1.4 Restart Servers
After updating `.env` files:
1. Restart backend: `npm run dev`
2. Restart frontend: `npm run dev`
3. Check backend logs for: `"Razorpay initialized with Key ID: rzp_test_..."`

---

## Part 2: Testing Payments

### 2.1 Test Card Numbers

Use these **test card details** in the Razorpay popup:

#### ✅ Successful Payment
- **Card Number**: `4111111111111111`
- **Expiry**: `12/25` (any future month/year)
- **CVV**: `123` (any 3 digits)
- **Name**: `Test User`
- **Email**: Any email address
- **Phone**: Any phone number

#### ❌ Failed Payment
- **Card Number**: `4000000000000002`
- **Expiry**: `12/25`
- **CVV**: `123`
- Result: Payment will **fail** (for testing error handling)

#### 🚫 OTP-Required Payment (Two-Factor)
- **Card Number**: `4111111111111111`
- **Expiry**: `12/25`
- **CVV**: `123`
- At OTP prompt: Enter any **6-digit number** (e.g., `123456`)
- Result: Payment **succeeds** after OTP

---

### 2.2 Test Payment Flow

1. **Login to LocalLink** as a customer
2. **Navigate to a Service**
3. **Click "Book Service"** or similar button
4. **Enter Booking Details**:
   - Date
   - Time
   - Duration
5. **Click "Pay Now"** or "Proceed to Payment"
6. **Razorpay Popup Opens**:
   - Select **"Card"** tab
   - Enter test card details above
   - Click **"Pay [Amount]"**
7. **Result**:
   - ✅ Success: Booking is created, payment saved
   - ❌ Failed: Error message displays, no booking created

---

### 2.3 Verify Payment in Razorpay Dashboard

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Ensure **Test Mode is ON** (blue theme)
3. Click **"Payments"** in sidebar
4. You should see your test transactions:
   - Order ID
   - Amount
   - Status (Captured/Failed)
   - Timestamp

---

## Part 3: Testing Different Scenarios

### Scenario 1: Successful Payment (Happy Path)
```
1. Use card: 4111111111111111
2. Enter valid expiry & CVV
3. Payment succeeds → Booking created
4. Check database: Booking status = "confirmed"
```

### Scenario 2: Payment Failure
```
1. Use card: 4000000000000002
2. Payment fails
3. Error message shows on frontend
4. Booking NOT created in database
```

### Scenario 3: Payment with OTP
```
1. Use card: 4111111111111111
2. OTP prompt appears
3. Enter any 6-digit number
4. Payment succeeds after OTP
```

### Scenario 4: Webhook Testing (Advanced)
```
After successful payment, Razorpay sends webhook to your backend
To test locally, use ngrok tunnel:
1. Install ngrok: https://ngrok.com/download
2. Run: ngrok http 5000
3. Copy ngrok URL (e.g., https://abc123.ngrok.io)
4. Add to Razorpay Dashboard → Webhooks:
   URL: https://abc123.ngrok.io/api/payments/webhook
```

---

## Part 4: Backend Payment Routes

### Create Order
```
POST /api/payments/create-order
Headers: Authorization: Bearer {token}
Body: {
  "serviceId": "service_id_here",
  "totalPrice": 500
}
Response: {
  "success": true,
  "order": { "id": "order_xxx", "amount": 50000, ... },
  "totalPrice": 500
}
```

### Verify Payment
```
POST /api/payments/verify
Headers: Authorization: Bearer {token}
Body: {
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "bookingData": {
    "serviceId": "service_id",
    "scheduledAt": "2025-12-20T10:00:00",
    "durationMinutes": 60,
    "totalPrice": 500
  }
}
Response: {
  "success": true,
  "booking": { "id": "booking_xxx", ... }
}
```

---

## Part 5: Frontend Integration

### Payment Button
```jsx
// In BookingModal or ServiceDetailPage
const handlePayment = async () => {
  try {
    // 1. Create order on backend
    const orderRes = await coreApi.createPaymentOrder({
      serviceId,
      totalPrice
    });
    
    // 2. Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    
    script.onload = () => {
      // 3. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: orderRes.data.order.id,
        handler: async (response) => {
          // 4. Verify payment
          const verifyRes = await coreApi.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingData: {
              serviceId,
              scheduledAt,
              durationMinutes,
              totalPrice
            }
          });
          
          if (verifyRes.data.success) {
            toast.success('Payment successful! Booking confirmed.');
            navigate('/customer/dashboard');
          }
        },
        prefill: {
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: '#0d9488' // Teal color for LocalLink
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
  } catch (error) {
    toast.error('Payment failed: ' + error.message);
  }
};
```

---

## Part 6: Troubleshooting

### Issue: "Razorpay Key not found"
**Solution**: 
- Check `.env` file has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Restart backend server
- Verify credentials are correct (from Test Mode dashboard)

### Issue: "Payment popup doesn't appear"
**Solution**:
- Check browser console (F12) for errors
- Ensure `VITE_RAZORPAY_KEY_ID` is in frontend `.env`
- Verify Razorpay script loaded: `window.Razorpay` exists

### Issue: "Signature verification failed"
**Solution**:
- Ensure `RAZORPAY_KEY_SECRET` matches in backend `.env`
- Don't mix Live and Test keys
- Make sure Test Mode is ON in Razorpay Dashboard

### Issue: Test cards don't work
**Solution**:
- Use EXACT card numbers from Part 2.1
- Don't add spaces in card number
- Ensure expiry is in future (e.g., 12/25 or later)
- Test Mode must be ON in dashboard

---

## Part 7: Switching to Live Mode (Production)

### When Ready for Real Payments:
1. Complete full KYC verification
2. Request "Live Mode" activation from Razorpay support
3. Get Live credentials (Key ID starts with `rzp_live_`)
4. Update `.env` with **LIVE credentials**
5. Toggle to **Live Mode** in dashboard
6. Test with small amount before full launch
7. Set up proper webhook handling

⚠️ **DO NOT commit live credentials to Git!** Use environment variables.

---

## Quick Reference

| Item | Value |
|------|-------|
| Test Card (Success) | 4111111111111111 |
| Test Card (Failure) | 4000000000000002 |
| Expiry | 12/25 (or any future) |
| CVV | 123 (any 3 digits) |
| Mode | Test (blue dashboard) |
| Currency | INR |
| Webhook URL | POST /api/payments/webhook |

---

## Support Resources

- **Razorpay Docs**: https://razorpay.com/docs/
- **Test Data**: https://razorpay.com/docs/payments/payments/test-cases/
- **Dashboard**: https://dashboard.razorpay.com/
- **Support**: support@razorpay.com

---

**Created for LocalLink Service Marketplace**
