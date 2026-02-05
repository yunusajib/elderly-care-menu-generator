# Daily Usage Guide

## Quick Start (Every Day)

### Step 1: Take/Upload Menu Photo
- Use your phone or camera to photograph today's handwritten menu
- Or type the menu directly into the system

### Step 2: Upload to System
1. Open http://localhost:3000 (or your deployed URL)
2. Click "Upload Menu Image" or paste text
3. Click "Extract Menu Content"

### Step 3: Review
- System shows extracted menu items
- Verify all sections are present
- Check for any errors or warnings
- If incorrect, start over with clearer photo

### Step 4: Generate
- Click "Generate Menu with Images"
- Wait 30-60 seconds while AI generates images
- System creates PDF automatically

### Step 5: Download & Print
- Click "Download Menu PDF"
- Print PDF using regular printer
- Display in dining room

**Total Time: 2-3 minutes**

---

## Tips for Best Results

### Photo Quality
✓ **DO:**
- Take photo in good lighting
- Hold camera straight (not at angle)
- Ensure all text is visible
- Use plain background

✗ **DON'T:**
- Take photo in shadows
- Include hands or other objects
- Use blurry or out-of-focus images

### Menu Writing
✓ **DO:**
- Write clearly and legibly
- Use consistent formatting
- List sections in order (Breakfast, Lunch, etc.)
- Use "Or" between options

✗ **DON'T:**
- Use abbreviations
- Skip sections
- Mix sections together
- Use unclear handwriting

---

## Understanding the Output

### Menu Sections
The system recognizes these sections:
- **Breakfast** - Gets combined image (porridge, cereal, full English)
- **Lunch** - Gets image of first option only
- **Dessert** - Gets image of first option
- **Evening Meal** - Gets image (sandwiches & soup)
- **Supper** - Text only, no image
- **Drinks** - Text only, no image

### Image Generation
- **First time**: Generates new images (~30-60 seconds)
- **Recurring meals**: Uses cached images (~5 seconds)
- **Example**: "Roast Chicken" from last week = instant reuse

---

## Common Issues

### "Validation Failed"
**Problem**: Missing required section
**Solution**: Check your menu has Breakfast, Lunch, Dessert, and Evening Meal

### "OCR Extraction Failed"
**Problem**: Can't read photo
**Solution**: 
- Retake photo with better lighting
- Or type menu manually

### "Image Generation Slow"
**Problem**: First time generating takes longer
**Solution**: This is normal! Subsequent generations are faster

### "PDF Download Not Working"
**Problem**: Browser blocking download
**Solution**: Check browser settings, allow downloads from site

---

## Staff Training Checklist

Train staff to:
- [ ] Take clear photos of handwritten menus
- [ ] Upload to system daily
- [ ] Review extracted content for accuracy
- [ ] Generate and download PDF
- [ ] Print and display menu
- [ ] Know who to contact if issues occur

**Estimated Training Time: 15 minutes**

---

## Maintenance Tasks

### Daily
- Generate today's menu
- Print and display

### Weekly
- Check cache statistics (optional)
- Review audit logs (optional)

### Monthly
- Backup generated PDFs
- Check disk space
- Review API usage/costs

---

## Cost Tracking

### Per Menu Generation:
- Without caching: ~$0.26
- With caching: ~$0.10-0.15

### Monthly Estimate:
- 30 menus/month: ~$3-8
- Less for recurring menus

---

## Emergency Procedures

### System Down
**Temporary Solution:**
1. Use previous day's PDF as template
2. Manually edit in Word/Canva
3. Print temporary menu

**Long-term:**
- Contact IT support
- Check server status
- Restart services if needed

### API Limits Reached
**Problem**: Hit daily generation limit
**Solution:**
- Wait 24 hours for reset
- Or upgrade API plan
- Use cached menus when possible

---

## Contact Information

**System Administrator:**
[Add contact details]

**Technical Support:**
[Add contact details]

**For Emergencies:**
[Add emergency contact]

---

## Quick Commands Reference

### Start System
```bash
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

### Check System Health
Open: http://localhost:5000/health

### View Logs
```bash
cd backend
npm run dev  # Shows live logs
```

### Clear Cache (if needed)
API endpoint: DELETE http://localhost:5000/api/cache/clear

---

## FAQ

**Q: Can I edit the extracted menu before generating?**
A: Not currently - if incorrect, start over with better photo/text

**Q: How long are images cached?**
A: Permanently, until manually cleared

**Q: Can I change the menu design?**
A: Yes, but requires editing backend/src/templates/menuTemplate.html

**Q: What if a meal isn't generating correctly?**
A: System uses first option - ensure it's written clearly

**Q: Can multiple users use the system?**
A: Currently single-user - for multi-user, add authentication

---

## Best Practices

1. **Consistency** - Write menus the same way each day
2. **Timing** - Generate menus at same time daily (e.g., 8am)
3. **Backup** - Save PDFs to network drive
4. **Quality Check** - Always review before printing
5. **Feedback** - Note any issues for improvement

---

**Remember**: The system is designed to save you time while maintaining professional quality. The more you use it, the faster it becomes through caching! 🎉
