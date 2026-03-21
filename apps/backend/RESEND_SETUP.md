# Resend Email Service Setup Guide

## 🚀 Quick Setup Steps

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" and create a free account
3. Verify your email address

### 2. Get Your API Key
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Click on "API Keys" in the sidebar
3. Click "Create API Key"
4. Give it a name (e.g., "Scorer App")
5. Copy the API key (starts with `re_`)

### 3. Configure Your Domain
1. In Resend Dashboard, click "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Follow the DNS setup instructions:
   - Add the TXT record to verify domain ownership
   - Add the MX records for email delivery
   - Add the CNAME records for DKIM/SPF

### 4. Update Your Environment
Add to your `.env` file:
```bash
# Email Configuration
RESEND_API_KEY=re_your-api-key-here
FROM_EMAIL=onboarding@yourdomain.com
```

### 5. Test the Integration
```bash
# Run the production flow test
pnpm run test:production-flow

# Or test manually
pnpm run dev
# Then create an admin invitation to test email delivery
```

## 📧 Free Tier Benefits

- **3,000 emails/month** (100 emails/day)
- **No credit card required**
- **Full API access**
- **Email analytics**
- **Domain verification**
- **DKIM/SPF setup**

## 🔧 Advanced Configuration

### Custom Email Templates
The system includes beautiful HTML templates for:
- Admin invitations
- Security alerts
- OTP verification

### Email Analytics
Resend provides:
- Delivery tracking
- Open rates
- Click tracking
- Bounce handling

### Domain Authentication
For better deliverability:
1. Add your custom domain
2. Configure DNS records
3. Set up DKIM/SPF/DMARC

## 🛠️ Troubleshooting

### Common Issues

#### 1. "API key not found"
**Solution:** Check your `.env` file and ensure `RESEND_API_KEY` is correct

#### 2. "Domain not verified"
**Solution:** Complete the DNS setup in Resend Dashboard

#### 3. "Email not delivered"
**Solution:** Check Resend Dashboard for delivery status and bounce reasons

#### 4. "Rate limit exceeded"
**Solution:** Free tier has 100 emails/day limit

### Debug Mode
Add to your `.env`:
```bash
LOG_LEVEL=debug
```

This will show detailed email service logs.

## 📊 Monitoring

### Resend Dashboard
- Real-time email delivery
- Analytics and insights
- Error logs
- Usage statistics

### Application Logs
The app logs:
- Email send attempts
- Success/failure status
- Error details
- Provider used (Resend/SendGrid)

## 🔄 Migration from SendGrid

If you're switching from SendGrid:

1. **Install Resend:** `pnpm add resend`
2. **Update .env:** Replace `SENDGRID_API_KEY` with `RESEND_API_KEY`
3. **Test:** Run `pnpm run test:production-flow`
4. **Remove SendGrid:** `pnpm remove @sendgrid/mail` (optional)

The code automatically detects which service to use based on environment variables.

## 🎯 Best Practices

### 1. Domain Setup
- Use a custom domain for better deliverability
- Complete all DNS verification steps
- Set up proper SPF/DKIM records

### 2. Email Content
- Use HTML templates provided
- Include plain text alternatives
- Avoid spam trigger words

### 3. Rate Limiting
- Monitor daily usage (100 emails/day free)
- Implement queueing for bulk emails
- Upgrade to paid plan if needed

### 4. Error Handling
- Check email service logs
- Monitor Resend dashboard
- Implement retry logic for failed sends

## 📈 Scaling Up

### When to Upgrade
- More than 100 emails/day
- Need advanced analytics
- Require dedicated IP
- Want priority support

### Paid Plans
- **Starter:** $20/month (50,000 emails)
- **Growth:** $80/month (100,000 emails)
- **Scale:** Custom pricing

## 🔗 Useful Links

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Email Templates Guide](https://resend.com/docs/send-with-resend/emails)
- [Domain Verification](https://resend.com/docs/domains)

## ✅ Setup Checklist

- [ ] Resend account created
- [ ] API key obtained
- [ ] Domain added and verified
- [ ] DNS records configured
- [ ] Environment variables set
- [ ] Test email sent successfully
- [ ] Production flow test passed
- [ ] Monitoring dashboard checked

---

**Your Resend email service is now ready!** 🎉

You now have a robust, free email delivery system with 3,000 emails/month capacity. The system will automatically use Resend when configured, with SendGrid as fallback.
