const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract menu text from image using GPT-4 Vision API
 */
async function extractMenuFromImage(imagePath) {
  try {
    console.log('🔍 Reading image file...');

    // Read image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Determine media type
    const ext = path.extname(imagePath).toLowerCase();
    const mediaTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    const mediaType = mediaTypeMap[ext] || 'image/jpeg';

    console.log('📤 Sending to GPT-4 Vision API...');

    // Call GPT-4 Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-4-vision-preview" or "gpt-4-turbo"
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`,
                detail: "high" // Use "high" for better OCR accuracy
              }
            },
            {
              type: "text",
              text: `Extract the complete menu text from this image exactly as written. 

CRITICAL RULES:
1. Extract ALL text exactly as it appears - do not modify, rephrase, or correct anything
2. Preserve the exact structure and formatting
3. Include ALL sections: Breakfast, Lunch, Dessert, Evening Meal, Supper, etc.
4. Include ALL meal options and items
5. Preserve separator lines and spacing where important for structure
6. If text is unclear, use your best judgment but flag it with [?]

Return the extracted text in this format:

HEADER:
[Care home name and date line]

SECTION NAME:
[Items exactly as written]

SECTION NAME:
[Items exactly as written]

And so on for all sections present in the menu.`
            }
          ]
        }
      ]
    });

    // Extract text from response
    const extractedText = response.choices[0].message.content;

    console.log('✓ OCR extraction complete');
    console.log(`Extracted ${extractedText.length} characters`);

    return extractedText;

  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

/**
 * Extract menu from text (when user pastes directly)
 */
function extractMenuFromText(text) {
  // Just return the text as-is since it's already text
  return text.trim();
}

module.exports = {
  extractMenuFromImage,
  extractMenuFromText
};