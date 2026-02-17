# Hero Background Images

Place your hero background images in this directory.

## Recommended Image Specifications:
- **Format**: JPG or PNG
- **Dimensions**: 1920x1080px or larger (for high-DPI displays)
- **File size**: Keep under 500KB for fast loading
- **Aspect ratio**: 16:9 or similar wide format works best

## Usage:
After uploading your image (e.g., `hero-bg.jpg`), update `ExploreData.tsx`:

```tsx
<PageHero 
  title="Explore Startup Data"
  subtitle="Dive deep into the Finnish startup ecosystem statistics"
  backgroundImage="/images/hero-bg.jpg"
/>
```

## Tips:
- Use images with darker areas or lower contrast to ensure text readability
- The image will be automatically darkened with an overlay for better text contrast
- Consider using images related to Finnish startups, technology, or data visualization

