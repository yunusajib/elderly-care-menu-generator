/**
 * Image Style Configuration
 * Locked visual style for consistent meal image generation
 * 
 * IMPORTANT: These settings should remain consistent across all menu generations
 * to maintain a unified visual appearance.
 */

module.exports = {
  lockedStyle: {
    // Camera positioning
    cameraAngle: '45-degree overhead angle',
    
    // Lighting
    lighting: 'Soft natural lighting, bright and inviting',
    
    // Background and plate
    background: 'White ceramic dinner plate on light wood table',
    
    // Composition
    composition: 'Centered, professional food photography',
    
    // Quality
    quality: 'High quality, sharp focus, photorealistic',
    
    // Color balance
    colorBalance: 'Natural food colors, no artistic filters or oversaturation',
    
    // Context
    context: 'Care home dining, institutional but appealing quality',
    
    // Plating style
    platingStyle: 'Traditional British plating style',
    
    // Portion size
    portionSize: 'Appropriate elderly care portions',
    
    // Additional context
    additionalContext: 'This is for an elderly care home menu. The presentation should be appetizing but realistic, clean and professional, not restaurant-fancy but appealing. Easy to identify each food item.',
    
    // Prohibited elements (things to avoid)
    prohibited: [
      'text overlays',
      'logos',
      'watermarks',
      'hands',
      'people',
      'cutlery in shot',
      'garnishes unless explicitly mentioned',
      'artistic styling',
      'restaurant-style fancy presentation',
      'abstract compositions'
    ]
  },
  
  // Image generation parameters
  generation: {
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'hd', // 'standard' or 'hd'
    style: 'natural' // 'natural' or 'vivid' - use 'natural' for realistic appearance
  },
  
  // Consistency enforcement
  consistency: {
    // Enable style validation (future feature)
    enableValidation: false,
    
    // Reference image for style comparison (path to reference)
    referenceImage: null,
    
    // Minimum similarity score (0-10)
    minSimilarityScore: 7
  }
};
