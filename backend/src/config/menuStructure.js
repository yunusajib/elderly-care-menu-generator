/**
 * Menu Structure Configuration
 * Defines the expected menu structure and validation rules
 */

module.exports = {
  // Required sections that must be present
  requiredSections: [
    'Breakfast',
    'Lunch',
    'Dessert',
    'Evening Meal'
  ],
  
  // Optional sections that may be present
  optionalSections: [
    'Tea',
    'Supper',
    'Drinks',
    'Available on Request'
  ],
  
  // Section order for display (if detected)
  sectionOrder: [
    'Drinks',
    'Breakfast',
    'Lunch',
    'Dessert',
    'Evening Meal',
    'Supper',
    'Available on Request'
  ],
  
  // Image generation rules per section
  imageRules: {
    'Breakfast': {
      enabled: true,
      type: 'combined',
      description: 'Bowl of porridge, bowl of cornflakes, full English breakfast'
    },
    'Lunch': {
      enabled: true,
      type: 'first_option',
      description: 'First lunch option only'
    },
    'Dessert': {
      enabled: true,
      type: 'first_option',
      description: 'First dessert option'
    },
    'Evening Meal': {
      enabled: true,
      type: 'fixed',
      description: 'Assorted sandwiches and bowl of soup'
    },
    'Tea': {
      enabled: true,
      type: 'fixed',
      description: 'Assorted sandwiches and bowl of soup'
    },
    'Supper': {
      enabled: false,
      description: 'No image for supper'
    },
    'Drinks': {
      enabled: false,
      description: 'No image for drinks'
    },
    'Available on Request': {
      enabled: false,
      description: 'No image for request section'
    }
  },
  
  // Validation settings
  validation: {
    // Allow unknown sections (not in required or optional lists)
    allowUnknownSections: true,
    
    // Warn on empty sections
    warnOnEmptySections: true,
    
    // Minimum items per section (0 = no minimum)
    minItemsPerSection: 0
  }
};
