const menuStructureConfig = require('../config/menuStructure');

/**
 * Parse raw menu text into structured format
 */
function parseMenuStructure(menuText) {
  const lines = menuText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const parsed = {
    header: '',
    sections: {}
  };
  
  let currentSection = null;
  let currentContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect header (first few lines usually)
    if (i < 3 && (line.includes('Care Home') || line.includes('Menu') || line.includes('Week'))) {
      parsed.header += (parsed.header ? ' ' : '') + line;
      continue;
    }
    
    // Detect section headers (usually capitalized or have keywords)
    const sectionMatch = detectSection(line);
    
    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        parsed.sections[currentSection] = {
          title: currentSection,
          content: currentContent.join('\n').trim(),
          items: parseItems(currentContent)
        };
      }
      
      // Start new section
      currentSection = sectionMatch;
      currentContent = [];
    } else if (currentSection) {
      // Add to current section
      currentContent.push(line);
    }
  }
  
  // Save last section
  if (currentSection) {
    parsed.sections[currentSection] = {
      title: currentSection,
      content: currentContent.join('\n').trim(),
      items: parseItems(currentContent)
    };
  }
  
  return parsed;
}

/**
 * Detect if a line is a section header
 */
function detectSection(line) {
  const normalized = line.toLowerCase().trim();
  
  const sectionPatterns = [
    { pattern: /^breakfast/i, name: 'Breakfast' },
    { pattern: /^lunch/i, name: 'Lunch' },
    { pattern: /^tea\b/i, name: 'Tea' },
    { pattern: /^evening meal/i, name: 'Evening Meal' },
    { pattern: /^dessert/i, name: 'Dessert' },
    { pattern: /^supper/i, name: 'Supper' },
    { pattern: /^drinks/i, name: 'Drinks' },
    { pattern: /available.*request/i, name: 'Available on Request' }
  ];
  
  for (const { pattern, name } of sectionPatterns) {
    if (pattern.test(line)) {
      return name;
    }
  }
  
  return null;
}

/**
 * Parse items from section content
 */
function parseItems(contentLines) {
  const items = [];
  
  for (const line of contentLines) {
    // Skip empty lines and separators
    if (!line || line.match(/^[-~=]+$/)) continue;
    
    // Check if it's an option separator (Or, Alternative, etc.)
    if (/^(or|alternative|also)\b/i.test(line.trim())) {
      items.push({
        type: 'option',
        text: line.trim()
      });
    } else {
      items.push({
        type: 'item',
        text: line.trim()
      });
    }
  }
  
  return items;
}

/**
 * Validate parsed menu structure
 */
function validateMenu(parsedMenu) {
  const errors = [];
  const warnings = [];
  
  // Check required sections exist
  const requiredSections = menuStructureConfig.requiredSections || [
    'Breakfast',
    'Lunch',
    'Dessert',
    'Evening Meal'
  ];
  
  for (const required of requiredSections) {
    const found = Object.keys(parsedMenu.sections).some(key => 
      key.toLowerCase().includes(required.toLowerCase())
    );
    
    if (!found) {
      errors.push(`Missing required section: ${required}`);
    }
  }
  
  // Check for empty sections
  for (const [section, data] of Object.entries(parsedMenu.sections)) {
    if (!data.items || data.items.length === 0) {
      warnings.push(`Section "${section}" has no items`);
    }
  }
  
  // Check for unexpected sections
  const knownSections = [
    'breakfast', 'lunch', 'tea', 'evening meal', 'dessert', 
    'supper', 'drinks', 'available on request'
  ];
  
  for (const section of Object.keys(parsedMenu.sections)) {
    const normalized = section.toLowerCase();
    const isKnown = knownSections.some(known => normalized.includes(known));
    
    if (!isKnown) {
      warnings.push(`Unexpected section found: "${section}"`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    sectionCount: Object.keys(parsedMenu.sections).length,
    totalItems: Object.values(parsedMenu.sections).reduce((sum, s) => sum + s.items.length, 0)
  };
}

/**
 * Extract meal options for image generation
 */
function extractMealOptions(parsedMenu) {
  const options = {};
  
  for (const [sectionName, sectionData] of Object.entries(parsedMenu.sections)) {
    const normalized = sectionName.toLowerCase();
    
    // Group items by "or" separators
    const groups = [];
    let currentGroup = [];
    
    for (const item of sectionData.items) {
      if (item.type === 'option') {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      } else {
        currentGroup.push(item.text);
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    options[sectionName] = {
      groups: groups,
      firstOption: groups[0] ? groups[0].join(', ') : null,
      allItems: sectionData.items.filter(i => i.type === 'item').map(i => i.text)
    };
  }
  
  return options;
}

module.exports = {
  parseMenuStructure,
  validateMenu,
  extractMealOptions
};
