# Razorpay Sandbox - Quick Setup Checklist

## ✅ Completed Setup

- [x] Backend `.env` has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- [x] Frontend `.env` has `VITE_RAZORPAY_KEY_ID`
- [x] Payment controller configured
- [x] Test credentials loaded from Razorpay dashboard

---

## 🧪 Ready to Test

### Step 1: Verify Backend
```bash
# Backend logs should show:
# "Razorpay initialized with Key ID: rzp_test_RhuzoD45nn8cUr"
```

### Step 2: Restart Both Servers
```bash
# Terminal 1 - Backend (port 5000)
npm run dev

# Terminal 2 - Frontend (port 5173)
npm run dev
```

### Step 3: Test a Payment
1. **Login** as a customer
2. **Navigate** to any service
3. **Click "Book Service"** button
4. **Proceed to Payment**
5. **Use Test Card**:
   - Number: `4111111111111111`
   - Expiry: `12/25`
   - CVV: `123`
   - Name: Any name
6. **Click "Pay"**

### Expected Results
✅ **Success**: 
- Popup closes
- Booking created in database
- Success message appears
- Redirected to dashboard

❌ **Failure** (if you use `4000000000000002`):
- Error message displays
- Booking NOT created
- Can try again

---

## 📋 Test Card Reference

| Purpose | Card Number | Status |
|---------|------------|--------|
| Success | 4111111111111111 | ✅ Succeeds |
| Failure | 4000000000000002 | ❌ Fails |
| OTP | 4111111111111111 | (Enter any 6 digits for OTP) |

**Expiry**: `12/25` (any future month/year)
**CVV**: `123` (any 3 digits)

---

## 🔍 Verify Payment in Dashboard

1. Go to [https://dashboard.razorpay.com/](https://dashboard.razorpay.com/)
2. **Login** with your Razorpay account
3. **Ensure "Test" mode is ON** (blue theme)
4. Click **"Payments"** in sidebar
5. You should see your test transactions

---

## 🚀 Next Steps

After successful test payments:
1. Complete Razorpay KYC verification
2. Request Live Mode activation
3. Get Live credentials (`rzp_live_*`)
4. Update `.env` files with live keys
5. Test with small amount before full launch

---

## 📞 Need Help?

- **Razorpay Sandbox Test Cases**: https://razorpay.com/docs/payments/payments/test-cases/
- **Documentation**: https://razorpay.com/docs/
- **Support**: support@razorpay.com

---

**Your Setup is Complete! Ready to test payments! 🎉**
