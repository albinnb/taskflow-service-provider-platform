# Razorpay Payment Flow Diagram

## Complete Payment Process

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER                                 │
│              (LocalLink Frontend)                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 1. View Service
                           │ 2. Click "Book Service"
                           │ 3. Enter booking details
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND SERVER                             │
│              POST /api/payments/create-order                │
│                                                             │
│  1. Receive serviceId & totalPrice from frontend           │
│  2. Create Razorpay Order (amount * 100 for paise)         │
│  3. Return order details to frontend                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Order details
                           │ (order_id, amount, etc)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 RAZORPAY CHECKOUT                           │
│                  (Payment Gateway)                          │
│                                                             │
│  Popup appears with payment form:                          │
│  ┌─────────────────────────────────┐                       │
│  │  Card Details                   │                       │
│  │  ├─ Card Number                 │                       │
│  │  ├─ Expiry (MM/YY)             │                       │
│  │  ├─ CVV                         │                       │
│  │  └─ Name                        │                       │
│  │                                 │                       │
│  │  [Pay Now]                      │                       │
│  └─────────────────────────────────┘                       │
│                                                             │
│  Customer enters test card:                                │
│  • 4111111111111111 (Success)                              │
│  • 4000000000000002 (Failure)                              │
│  • Expiry: 12/25 (any future)                              │
│  • CVV: 123 (any 3 digits)                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Payment processed
                           │
                    ┌──────┴──────┐
                    │             │
              SUCCESS         FAILURE
                    │             │
                    ↓             ↓
         ┌──────────────┐  ┌──────────────┐
         │ payment_id   │  │ Error info   │
         │ signature    │  │ reason       │
         │ order_id     │  └──────────────┘
         └──────────────┘         │
                    │             │
                    │         Error shown
                    │         to customer
                    │         (retry option)
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND SERVER                             │
│              POST /api/payments/verify                      │
│                                                             │
│  1. Receive payment credentials from frontend              │
│  2. Verify signature using HMAC SHA256                     │
│  3. If valid:                                              │
│     ├─ Create Booking in database                          │
│     ├─ Update Booking status = "confirmed"                 │
│     └─ Set paymentStatus = "paid"                          │
│  4. Return success response                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Success response
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER                                 │
│              (LocalLink Frontend)                           │
│                                                             │
│  1. Show success message                                   │
│  2. Booking created and visible in dashboard               │
│  3. Redirect to /customer/dashboard                        │
│  4. Show booking in "My Bookings" list                     │
│  5. Status: "Confirmed"                                    │
│  6. Payment status: "Paid" ✓                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Test Payment Scenarios

### Scenario 1: Successful Payment
```
Input:  Card 4111111111111111
        Expiry: 12/25
        CVV: 123
        
Process: Razorpay processes payment
         Amount deducted in test account
         payment_id generated
         
Output: ✅ Booking created
        ✅ Payment status = "Paid"
        ✅ Customer dashboard updated
        ✅ Can see booking details
```

### Scenario 2: Failed Payment
```
Input:  Card 4000000000000002
        Expiry: 12/25
        CVV: 123
        
Process: Razorpay rejects payment
         (Simulated payment gateway decline)
         
Output: ❌ Error message shown
        ❌ Booking NOT created
        ❌ No charge applied
        ✅ User can retry
```

### Scenario 3: OTP-Based Payment
```
Input:  Card 4111111111111111
        (May trigger OTP screen)
        
Process: OTP prompt appears
         Customer enters any 6-digit number
         
Output: ✅ Payment succeeds after OTP
        ✅ Booking created
```

---

## Amount Conversion

```
Frontend sends:      totalPrice = 500 (INR)
                            ↓
Backend converts:    500 * 100 = 50000 (paise)
                            ↓
Razorpay processes:  50000 paise = ₹500
                            ↓
Customer pays:       ₹500.00
```

---

## Database Impact

### Before Payment
```javascript
// No Booking exists
Booking.findOne({ userId: customer_id }) → null
```

### After Successful Payment
```javascript
// Booking created
{
  _id: "booking_123",
  userId: "customer_456",
  serviceId: "service_789",
  providerId: "provider_101",
  scheduledAt: "2025-12-20T10:00:00",
  durationMinutes: 60,
  totalPrice: 500,
  status: "confirmed",
  paymentStatus: "paid",
  razorpay_order_id: "order_xxx",
  razorpay_payment_id: "pay_yyy",
  razorpay_signature: "signature_zzz",
  createdAt: "2025-12-16T15:30:00",
  updatedAt: "2025-12-16T15:30:00"
}
```

### After Failed Payment
```javascript
// No Booking created
Booking.findOne({ userId: customer_id }) → null
```

---

## Key Environment Variables

```env
# Backend (.env)
RAZORPAY_KEY_ID=rzp_test_RhuzoD45nn8cUr
RAZORPAY_KEY_SECRET=1zxhnzGow9nNhKmiKwVvnG1C

# Frontend (.env)
VITE_RAZORPAY_KEY_ID=rzp_test_RhuzoD45nn8cUr
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Security Notes

1. **Never expose KEY_SECRET in frontend code**
   - Only KEY_ID is public
   - KEY_SECRET stays in backend only

2. **Verify signature on backend**
   - Prevents tampering
   - Ensures payment is legitimate

3. **Test before production**
   - Always test with sandbox first
   - Use small amount for live testing

4. **Keep credentials secure**
   - Don't commit to Git
   - Use environment variables
   - Rotate keys periodically

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Popup doesn't appear | KEY_ID not in frontend .env | Add VITE_RAZORPAY_KEY_ID |
| "Invalid signature" | KEY_SECRET mismatch | Verify in backend .env |
| Test card declined | Using wrong card number | Use exact numbers from guide |
| Amount not matching | Paise conversion error | Multiply by 100 in backend |
| Booking not created | Payment not verified | Check signature verification |

---

## Testing Checklist

- [ ] Backend `.env` has credentials
- [ ] Frontend `.env` has KEY_ID
- [ ] Servers restarted
- [ ] Razorpay Dashboard in Test mode
- [ ] Can navigate to book service
- [ ] Payment popup appears on checkout
- [ ] Test card payment succeeds
- [ ] Booking created in database
- [ ] Payment status shows as "Paid"
- [ ] Can see booking in customer dashboard

---

**Once all tests pass, you're ready for production!** 🎉
