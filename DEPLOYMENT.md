# Deployment Guide

This guide covers various deployment options for the Commercial Truck Dealership Market Investor Dashboard.

## 🚀 Deployment Options

### 1. Vercel (Recommended)

Vercel provides the easiest deployment for React applications with automatic builds and deployments.

#### Steps:
1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com) and sign up
3. Click "New Project" and import your GitHub repository
4. Vercel will automatically detect it's a Vite project
5. Click "Deploy" - your app will be live in minutes

#### Configuration:
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

### 2. Netlify

Another excellent option for static site deployment.

#### Steps:
1. Push your code to GitHub
2. Visit [netlify.com](https://netlify.com) and sign up
3. Click "New site from Git" and connect your repository
4. Configure build settings:
   - **Build command**: `pnpm run build`
   - **Publish directory**: `dist`
5. Click "Deploy site"

### 3. GitHub Pages

Free hosting directly from your GitHub repository.

#### Steps:
1. Install gh-pages: `pnpm add -D gh-pages`
2. Add to package.json scripts:
   ```json
   {
     "scripts": {
       "predeploy": "pnpm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```
3. Update `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... other config
   })
   ```
4. Run: `pnpm run deploy`
5. Enable GitHub Pages in repository settings

### 4. AWS S3 + CloudFront

For enterprise deployment with CDN.

#### Steps:
1. Build the project: `pnpm run build`
2. Create an S3 bucket with static website hosting
3. Upload the `dist` folder contents to S3
4. Create a CloudFront distribution pointing to the S3 bucket
5. Configure custom domain if needed

### 5. Docker Deployment

For containerized deployment.

#### Create Dockerfile:
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Build and run:
```bash
docker build -t investor-dashboard .
docker run -p 80:80 investor-dashboard
```

## 🔧 Environment Configuration

### Environment Variables

Create `.env` files for different environments:

#### `.env.development`
```
VITE_APP_TITLE=Commercial Truck Dealership Market - Dev
VITE_API_URL=http://localhost:3000
```

#### `.env.production`
```
VITE_APP_TITLE=Commercial Truck Dealership Market
VITE_API_URL=https://api.yourdomain.com
```

### Build Optimization

For production builds, ensure optimal performance:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-slider']
        }
      }
    }
  }
})
```

## 📊 Performance Optimization

### Code Splitting
The app automatically splits code by routes and components for optimal loading.

### Asset Optimization
- Images are optimized during build
- CSS is minified and purged
- JavaScript is minified and tree-shaken

### Caching Strategy
- Static assets have long cache headers
- HTML files have short cache headers
- Service worker can be added for offline support

## 🔒 Security Considerations

### Content Security Policy
Add CSP headers for enhanced security:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### HTTPS
Always deploy with HTTPS enabled. Most platforms provide this automatically.

## 📱 Mobile Optimization

The dashboard is fully responsive, but consider:
- Testing on various device sizes
- Optimizing touch interactions
- Ensuring charts are readable on small screens

## 🔍 Analytics Integration

### Google Analytics
Add to `index.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🚨 Monitoring

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Hotjar for user behavior analysis

### Performance Monitoring
- Lighthouse CI for performance testing
- Web Vitals monitoring
- Real User Monitoring (RUM)

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Build
      run: pnpm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Build completes without errors
- [ ] All tests pass
- [ ] Performance audit completed
- [ ] Security headers configured
- [ ] Analytics tracking implemented
- [ ] Error monitoring setup
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility verified
- [ ] SEO meta tags added

## 🆘 Troubleshooting

### Common Issues

**Build Fails**
- Check Node.js version (18+ required)
- Clear node_modules and reinstall
- Check for TypeScript errors

**Charts Not Rendering**
- Ensure Recharts is properly installed
- Check for console errors
- Verify data format matches chart expectations

**Styling Issues**
- Ensure Tailwind CSS is properly configured
- Check for conflicting CSS rules
- Verify all UI components are imported correctly

### Support Resources
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Recharts Documentation](https://recharts.org/)

---

**Happy Deploying! 🚀**

