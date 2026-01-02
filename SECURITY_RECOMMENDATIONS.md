# Frontend Security Recommendations

## Status
- ✅ **Implemented**: HTTPS via CloudFront
- ✅ **Implemented**: CORS-enabled API calls
- ⚠️ **Pending**: Items below

## High Priority

### 1. Add reCAPTCHA to Contact Form
**Risk**: Bot spam, automated attacks
**Impact**: High - Could overwhelm backend

**Implementation**:
```bash
npm install react-google-recaptcha-v3
```

```tsx
// In Contact.tsx
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export default function Contact() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!executeRecaptcha) {
      console.error('reCAPTCHA not loaded');
      return;
    }
    
    const token = await executeRecaptcha('contact_form');
    
    const response = await fetch(`${apiUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        recaptchaToken: token
      }),
      mode: 'cors',
    });
    
    // ... handle response ...
  };
}
```

Add provider in App.tsx:
```tsx
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

function App() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="YOUR_SITE_KEY">
      {/* Your app */}
    </GoogleReCaptchaProvider>
  );
}
```

**Cost**: Free (up to 1M assessments/month)

### 2. Content Security Policy (CSP)
**Risk**: XSS attacks, code injection
**Impact**: High - Could compromise user data

Add CSP meta tag in index.html:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://www.google.com https://www.gstatic.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:; 
               connect-src 'self' https://api.stinessolutions.com; 
               frame-ancestors 'none';">
```

Or better yet, configure in CloudFront (see infrastructure docs).

### 3. Input Validation on Frontend
**Risk**: Poor UX, unnecessary API calls
**Impact**: Medium - Wasted resources

Add validation before submission:
```tsx
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  // Client-side validation
  if (!validateEmail(formData.email)) {
    setStatus("Please enter a valid email address.");
    return;
  }
  
  if (formData.message.length > 5000) {
    setStatus("Message is too long (max 5000 characters).");
    return;
  }
  
  // ... proceed with submission ...
};
```

## Medium Priority

### 4. Rate Limiting UI Feedback
**Current**: No indication of rate limits to user
**Improvement**: Show cooldown period

```tsx
const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

useEffect(() => {
  if (cooldownRemaining > 0) {
    const timer = setInterval(() => {
      setCooldownRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }
}, [cooldownRemaining]);

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  const now = Date.now();
  const timeSinceLastSubmit = now - lastSubmitTime;
  
  if (timeSinceLastSubmit < 60000) { // 1 minute cooldown
    const remainingSeconds = Math.ceil((60000 - timeSinceLastSubmit) / 1000);
    setStatus(`Please wait ${remainingSeconds} seconds before submitting again.`);
    setCooldownRemaining(remainingSeconds);
    return;
  }
  
  setLastSubmitTime(now);
  // ... proceed with submission ...
};
```

### 5. Sanitize Display Content
**Risk**: If error messages from API contain user input
**Impact**: Low - XSS through error messages

Use a sanitization library:
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

```tsx
import DOMPurify from 'dompurify';

const setStatus = (message: string) => {
  const sanitized = DOMPurify.sanitize(message);
  setStatusMessage(sanitized);
};
```

### 6. Environment Variable Validation
**Current**: Basic check for apiUrl
**Improvement**: Fail fast with clear errors

```tsx
// In main.tsx or App.tsx
const requiredEnvVars = ['VITE_API_GATEWAY_URL'];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Validate URL format
const apiUrl = import.meta.env.VITE_API_GATEWAY_URL;
if (!apiUrl.startsWith('https://')) {
  throw new Error('API URL must use HTTPS');
}
```

## Low Priority

### 7. Subresource Integrity (SRI)
If loading external scripts, add integrity checks:
```html
<script src="https://cdn.example.com/lib.js" 
        integrity="sha384-..." 
        crossorigin="anonymous"></script>
```

### 8. Form Honeypot
Add hidden field to catch bots:
```tsx
const [honeypot, setHoneypot] = useState('');

// In form
<input 
  type="text" 
  name="website" 
  value={honeypot}
  onChange={(e) => setHoneypot(e.target.value)}
  style={{ display: 'none' }}
  tabIndex={-1}
  autoComplete="off"
/>

// In handleSubmit
if (honeypot) {
  console.warn('Bot detected - honeypot filled');
  return; // Silently reject
}
```

### 9. Disable Form After Submission
Prevent double submissions:
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  if (isSubmitting) return;
  
  setIsSubmitting(true);
  try {
    // ... submit form ...
  } finally {
    setIsSubmitting(false);
  }
};

// Update button
<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Sending...' : 'Send Message'}
</button>
```

## Dependencies
- Keep React and dependencies updated
- Run `npm audit` regularly
- Use `npm audit fix` to auto-fix vulnerabilities
- Consider adding Snyk or similar security scanning

## Build Security
- Ensure `.env` files are in `.gitignore`
- Never commit secrets or API keys
- Use environment variables for all configuration
- Verify build artifacts don't contain sensitive data

## Review Schedule
- Review quarterly or after any security incident
- Update dependencies monthly
- Run security scan before each deployment
- Last updated: January 2, 2026
