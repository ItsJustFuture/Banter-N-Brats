/**
 * DnD Character Creation Wizard - Main Logic
 * Multi-step wizard with validation and state management
 */

import {
  ATTRIBUTES,
  SKILLS,
  TRAITS,
  QUIRKS,
  ABILITIES,
  PERK_CATEGORIES,
  BUFFS,
  XP_MODIFIER_DEFAULT,
  XP_MODIFIER_WITH_BUFFS,
  ATTRIBUTE_POINT_TOTAL,
  PERK_MAX_SELECTED,
  ABILITY_MAX_SELECTED,
  ABILITY_MIN_SELECTED,
  SKILL_MIN_SELECTED,
  SKILL_MAX_SELECTED,
  VALIDATION_RULES
} from './dndCharacterWizardData.js';

// Wizard step definitions
const WIZARD_STEPS = [
  { id: 'identity', name: 'Identity', title: 'Character Identity' },
  { id: 'attributes', name: 'Core Attributes', title: 'Core Attributes' },
  { id: 'skills', name: 'Skills', title: 'Select Skills' },
  { id: 'traits', name: 'Traits & Quirks', title: 'Traits & Quirks' },
  { id: 'abilities', name: 'Abilities', title: 'Special Abilities' },
  { id: 'perks', name: 'Perks', title: 'Select Perks' },
  { id: 'buffs', name: 'Buffs', title: 'Optional Buffs' },
  { id: 'review', name: 'Final Review', title: 'Review Character' }
];

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Global wizard state
let wizardState = {
  currentStep: 0,
  characterData: {
    name: '',
    archetype: '', // Future expansion
    attributes: {},
    skills: [],
    traits: [],
    quirks: [],
    abilities: [],
    perks: [],  // Changed to array for server compatibility
    buffs: [],
    xpModifier: XP_MODIFIER_DEFAULT
  }
};

/**
 * Initialize the character creation wizard
 */
export function initCharacterWizard() {
  console.log('[Wizard] Initializing character creation wizard');
  
  // Reset state
  wizardState.currentStep = 0;
  wizardState.characterData = {
    name: '',
    archetype: '',
    attributes: {},
    skills: [],
    traits: [],
    quirks: [],
    abilities: [],
    perks: [],  // Changed to array for server compatibility
    buffs: [],
    xpModifier: XP_MODIFIER_DEFAULT
  };
  
  // Initialize default attribute values
  if (Array.isArray(ATTRIBUTES)) {
    ATTRIBUTES.forEach(attr => {
      wizardState.characterData.attributes[attr.id] = attr.default;
    });
  }
  
  // Render the wizard
  renderWizard();
}

/**
 * Main render function for the wizard
 */
function renderWizard() {
  const container = document.getElementById('dndCharacterWizardContainer');
  if (!container) {
    console.error('[Wizard] Container not found');
    return;
  }
  
  const currentStepData = WIZARD_STEPS[wizardState.currentStep];
  
  container.innerHTML = `
    <div class="wizard-progress">
      ${renderProgressIndicator()}
    </div>
    <div class="wizard-content">
      <h2 class="wizard-step-title">${currentStepData.title}</h2>
      <div class="wizard-step-container">
        ${renderCurrentStep()}
      </div>
    </div>
    <div class="wizard-navigation">
      ${renderNavigation()}
    </div>
  `;
  
  // Attach event listeners after rendering
  attachNavigationListeners();
  attachStepEventListeners();
}

/**
 * Render progress indicator
 */
function renderProgressIndicator() {
  return WIZARD_STEPS.map((step, index) => {
    const isActive = index === wizardState.currentStep;
    const isCompleted = index < wizardState.currentStep;
    const classes = ['wizard-progress-step'];
    
    if (isActive) classes.push('active');
    if (isCompleted) classes.push('completed');
    
    return `
      <div class="${classes.join(' ')}" data-step="${index}">
        <div class="wizard-progress-circle">
          ${isCompleted ? '✓' : index + 1}
        </div>
        <div class="wizard-progress-label">${step.name}</div>
      </div>
    `;
  }).join('');
}

/**
 * Render navigation buttons
 */
function renderNavigation() {
  const isFirstStep = wizardState.currentStep === 0;
  const isLastStep = wizardState.currentStep === WIZARD_STEPS.length - 1;
  const canProceed = validateCurrentStep();
  
  return `
    <button 
      class="btn secondary wizard-back-btn" 
      ${isFirstStep ? 'disabled' : ''}
      data-action="back">
      ← Back
    </button>
    ${!isLastStep ? `
      <button 
        class="btn primary wizard-next-btn" 
        ${!canProceed ? 'disabled' : ''}
        data-action="next">
        Next →
      </button>
    ` : `
      <button 
        class="btn primary wizard-create-btn" 
        ${!canProceed ? 'disabled' : ''}
        data-action="create">
        Create Character
      </button>
    `}
  `;
}

/**
 * Attach navigation event listeners
 */
function attachNavigationListeners() {
  const backBtn = document.querySelector('.wizard-back-btn');
  const nextBtn = document.querySelector('.wizard-next-btn');
  const createBtn = document.querySelector('.wizard-create-btn');
  
  if (backBtn && !backBtn.disabled) {
    backBtn.addEventListener('click', wizardBack);
  }
  
  if (nextBtn && !nextBtn.disabled) {
    nextBtn.addEventListener('click', wizardNext);
  }
  
  if (createBtn && !createBtn.disabled) {
    createBtn.addEventListener('click', wizardCreate);
  }
}

/**
 * Render current step content
 */
function renderCurrentStep() {
  const stepId = WIZARD_STEPS[wizardState.currentStep].id;
  
  switch (stepId) {
    case 'identity':
      return renderIdentityStep();
    case 'attributes':
      return renderAttributesStep();
    case 'skills':
      return renderSkillsStep();
    case 'traits':
      return renderTraitsStep();
    case 'abilities':
      return renderAbilitiesStep();
    case 'perks':
      return renderPerksStep();
    case 'buffs':
      return renderBuffsStep();
    case 'review':
      return renderReviewStep();
    default:
      return '<p>Unknown step</p>';
  }
}

/**
 * Step 1: Identity
 */
function renderIdentityStep() {
  const escapedName = escapeHtml(wizardState.characterData.name);
  return `
    <div class="wizard-step-content scrollable">
      <div class="form-group">
        <label for="wizard-char-name">Character Name *</label>
        <input 
          type="text" 
          id="wizard-char-name" 
          class="form-control" 
          placeholder="Enter your character's name"
          value="${escapedName}"
          maxlength="40"
          required
        />
        <p class="form-hint">Choose a memorable name for your hero</p>
      </div>
      
      <div class="form-group">
        <label for="wizard-archetype">Archetype (Optional)</label>
        <select id="wizard-archetype" class="form-control">
          <option value="">Select an archetype...</option>
          <option value="warrior">Warrior - Master of combat</option>
          <option value="mage">Mage - Wielder of arcane power</option>
          <option value="rogue">Rogue - Shadow and subterfuge</option>
          <option value="cleric">Cleric - Divine servant</option>
          <option value="ranger">Ranger - Wilderness expert</option>
        </select>
        <p class="form-hint">Your character's core class (future feature)</p>
      </div>
    </div>
  `;
}

/**
 * Step 2: Core Attributes
 */
function renderAttributesStep() {
  const totalPoints = Object.values(wizardState.characterData.attributes).reduce((sum, val) => sum + val, 0);
  const pointsRemaining = ATTRIBUTE_POINT_TOTAL - totalPoints;
  const isValid = pointsRemaining === 0;
  
  return `
    <div class="wizard-step-content scrollable">
      <div class="attribute-points-display ${isValid ? 'valid' : pointsRemaining < 0 ? 'exceeded' : ''}">
        <strong>Points Remaining: ${pointsRemaining} / ${ATTRIBUTE_POINT_TOTAL}</strong>
        ${!isValid ? '<p class="warning-text">You must allocate all points</p>' : ''}
      </div>
      
      <div class="attributes-grid">
        ${(Array.isArray(ATTRIBUTES) ? ATTRIBUTES : []).map(attr => `
          <div class="attribute-card">
            <div class="attribute-header">
              <span class="attribute-emoji">${attr.emoji}</span>
              <strong>${escapeHtml(attr.name)}</strong>
            </div>
            <p class="attribute-description">${escapeHtml(attr.description)}</p>
            <div class="attribute-control">
              <input 
                type="range" 
                id="attr-${attr.id}" 
                class="attribute-slider"
                min="${attr.min}" 
                max="${attr.max}" 
                value="${wizardState.characterData.attributes[attr.id] || attr.default}"
                data-attr="${attr.id}"
              />
              <input 
                type="number" 
                id="attr-${attr.id}-value" 
                class="attribute-value"
                min="${attr.min}" 
                max="${attr.max}" 
                value="${wizardState.characterData.attributes[attr.id] || attr.default}"
                data-attr="${attr.id}"
              />
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Step 3: Skills
 */
function renderSkillsStep() {
  const selectedCount = wizardState.characterData.skills.length;
  
  return `
    <div class="wizard-step-content scrollable">
      <div class="selection-counter">
        Selected: <strong>${selectedCount}</strong> skill${selectedCount !== 1 ? 's' : ''}
        ${selectedCount < SKILL_MIN_SELECTED || selectedCount > SKILL_MAX_SELECTED ? `<span class="warning-text"> (requires ${SKILL_MIN_SELECTED}-${SKILL_MAX_SELECTED} skills)</span>` : ''}
      </div>
      
      <div class="skills-grid">
        ${(Array.isArray(SKILLS) ? SKILLS : []).map(skill => {
          const isSelected = wizardState.characterData.skills.includes(skill.id);
          return `
            <div class="skill-card ${isSelected ? 'selected' : ''}" data-skill="${skill.id}">
              <div class="skill-header">
                <input 
                  type="checkbox" 
                  id="skill-${skill.id}" 
                  ${isSelected ? 'checked' : ''}
                  data-skill="${skill.id}"
                />
                <label for="skill-${skill.id}">
                  <strong>${escapeHtml(skill.name)}</strong>
                </label>
              </div>
              <p class="skill-description">${escapeHtml(skill.description)}</p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Step 4: Traits & Quirks
 */
function renderTraitsStep() {
  const traitsCount = wizardState.characterData.traits.length;
  const quirksCount = wizardState.characterData.quirks.length;
  const needsQuirk = traitsCount > 0 && quirksCount === 0;
  
  return `
    <div class="wizard-step-content scrollable">
      <div class="traits-rule-explanation">
        <strong>⚠️ Important Rule:</strong>
        <p>Traits are optional, but if you select any trait, you MUST also select at least one quirk.</p>
        <p>Quirks cannot be selected unless you have chosen at least one trait.</p>
      </div>
      
      <div class="traits-section">
        <h3>Traits (Positive Characteristics)</h3>
        <div class="selection-counter">
          Selected: <strong>${traitsCount}</strong> trait${traitsCount !== 1 ? 's' : ''}
        </div>
        <div class="traits-grid">
          ${(Array.isArray(TRAITS) ? TRAITS : []).map(trait => {
            const isSelected = wizardState.characterData.traits.includes(trait.id);
            return `
              <div class="trait-card ${isSelected ? 'selected' : ''}" data-trait="${trait.id}">
                <div class="trait-header">
                  <input 
                    type="checkbox" 
                    id="trait-${trait.id}" 
                    ${isSelected ? 'checked' : ''}
                    data-trait="${trait.id}"
                  />
                  <label for="trait-${trait.id}">
                    <strong>${escapeHtml(trait.name)}</strong>
                  </label>
                </div>
                <p class="trait-description">${escapeHtml(trait.description)}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="quirks-section">
        <h3>Quirks (Drawbacks)</h3>
        <div class="selection-counter">
          Selected: <strong>${quirksCount}</strong> quirk${quirksCount !== 1 ? 's' : ''}
          ${needsQuirk ? '<span class="warning-text"> (at least 1 required because traits are selected)</span>' : ''}
        </div>
        ${traitsCount === 0 ? '<p class="info-text">Select at least one trait to unlock quirks</p>' : ''}
        <div class="quirks-grid ${traitsCount === 0 ? 'disabled' : ''}">
          ${(Array.isArray(QUIRKS) ? QUIRKS : []).map(quirk => {
            const isSelected = wizardState.characterData.quirks.includes(quirk.id);
            const isDisabled = traitsCount === 0;
            return `
              <div class="quirk-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" data-quirk="${quirk.id}">
                <div class="quirk-header">
                  <input 
                    type="checkbox" 
                    id="quirk-${quirk.id}" 
                    ${isSelected ? 'checked' : ''}
                    ${isDisabled ? 'disabled' : ''}
                    data-quirk="${quirk.id}"
                  />
                  <label for="quirk-${quirk.id}">
                    <strong>${escapeHtml(quirk.name)}</strong>
                  </label>
                </div>
                <p class="quirk-description">${escapeHtml(quirk.description)}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Step 5: Abilities
 */
function renderAbilitiesStep() {
  const selectedCount = wizardState.characterData.abilities.length;
  const canSelectMore = selectedCount < ABILITY_MAX_SELECTED;
  
  return `
    <div class="wizard-step-content scrollable">
      <div class="selection-counter">
        Selected: <strong>${selectedCount} / ${ABILITY_MAX_SELECTED}</strong> abilities
        ${selectedCount < ABILITY_MIN_SELECTED ? `<span class="warning-text"> (minimum ${ABILITY_MIN_SELECTED} required)</span>` : ''}
      </div>
      
      <div class="abilities-grid">
        ${(Array.isArray(ABILITIES) ? ABILITIES : []).map(ability => {
          const isSelected = wizardState.characterData.abilities.includes(ability.id);
          const isDisabled = !isSelected && !canSelectMore;
          return `
            <div class="ability-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" data-ability="${ability.id}">
              <div class="ability-header">
                <input 
                  type="checkbox" 
                  id="ability-${ability.id}" 
                  ${isSelected ? 'checked' : ''}
                  ${isDisabled ? 'disabled' : ''}
                  data-ability="${ability.id}"
                />
                <label for="ability-${ability.id}">
                  <strong>${escapeHtml(ability.name)}</strong>
                </label>
              </div>
              <p class="ability-description">${escapeHtml(ability.description)}</p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Step 6: Perks
 */
function renderPerksStep() {
  const selectedCount = wizardState.characterData.perks.length;
  const canSelectMore = selectedCount < PERK_MAX_SELECTED;
  
  return `
    <div class="wizard-step-content scrollable">
      <div class="selection-counter">
        Selected: <strong>${selectedCount} / ${PERK_MAX_SELECTED}</strong> perks
        ${selectedCount === 0 ? '<span class="info-text"> (all perks are optional)</span>' : ''}
      </div>
      
      <div class="perks-grid">
        ${(Array.isArray(PERK_CATEGORIES) ? PERK_CATEGORIES : []).map(perk => {
          const isSelected = wizardState.characterData.perks.includes(perk.id);
          const isDisabled = !isSelected && !canSelectMore;
          return `
            <div class="perk-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" data-perk="${perk.id}">
              <div class="perk-header">
                <input 
                  type="checkbox" 
                  id="perk-${perk.id}" 
                  ${isSelected ? 'checked' : ''}
                  ${isDisabled ? 'disabled' : ''}
                  data-perk="${perk.id}"
                />
                <label for="perk-${perk.id}">
                  <strong>${escapeHtml(perk.name)}</strong>
                </label>
              </div>
              <p class="perk-description">${escapeHtml(perk.description)}</p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Step 7: Buffs
 */
function renderBuffsStep() {
  const selectedCount = wizardState.characterData.buffs.length;
  const hasBuffs = selectedCount > 0;
  
  return `
    <div class="wizard-step-content scrollable">
      ${hasBuffs ? `
        <div class="buff-warning">
          <strong>⚠️ XP Penalty Active</strong>
          <p>You have selected ${selectedCount} buff${selectedCount !== 1 ? 's' : ''}. Your XP gain will be reduced to <strong>${Math.round(XP_MODIFIER_WITH_BUFFS * 100)}%</strong> (−15%).</p>
        </div>
      ` : `
        <div class="buff-info">
          <strong>ℹ️ Optional Buffs</strong>
          <p>Buffs are powerful enhancements, but come with a permanent XP penalty. If you select ANY buff, your XP gain becomes <strong>${Math.round(XP_MODIFIER_WITH_BUFFS * 100)}%</strong> (−15%).</p>
        </div>
      `}
      
      <div class="selection-counter">
        Selected: <strong>${selectedCount}</strong> buff${selectedCount !== 1 ? 's' : ''}
        <span class="info-text">(all buffs are optional)</span>
      </div>
      
      <div class="buffs-grid">
        ${(Array.isArray(BUFFS) ? BUFFS : []).map(buff => {
          const isSelected = wizardState.characterData.buffs.includes(buff.id);
          return `
            <div class="buff-card ${isSelected ? 'selected' : ''}" data-buff="${buff.id}">
              <div class="buff-header">
                <input 
                  type="checkbox" 
                  id="buff-${buff.id}" 
                  ${isSelected ? 'checked' : ''}
                  data-buff="${buff.id}"
                />
                <label for="buff-${buff.id}">
                  <strong>${escapeHtml(buff.name)}</strong>
                </label>
              </div>
              <p class="buff-description">${escapeHtml(buff.description)}</p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Step 8: Final Review
 */
function renderReviewStep() {
  const hasBuffs = wizardState.characterData.buffs.length > 0;
  const xpModifier = hasBuffs ? XP_MODIFIER_WITH_BUFFS : XP_MODIFIER_DEFAULT;
  
  return `
    <div class="wizard-step-content scrollable">
      <div class="review-section">
        <h3>Character Summary</h3>
        
        <div class="review-card">
          <h4>Identity</h4>
          <p><strong>Name:</strong> ${escapeHtml(wizardState.characterData.name) || 'Not set'}</p>
          ${wizardState.characterData.archetype ? `<p><strong>Archetype:</strong> ${escapeHtml(wizardState.characterData.archetype)}</p>` : ''}
        </div>
        
        <div class="review-card">
          <h4>Core Attributes</h4>
          ${(Array.isArray(ATTRIBUTES) ? ATTRIBUTES : []).map(attr => `
            <p><strong>${attr.emoji} ${escapeHtml(attr.name)}:</strong> ${wizardState.characterData.attributes[attr.id]}</p>
          `).join('')}
        </div>
        
        <div class="review-card">
          <h4>Skills (${wizardState.characterData.skills.length})</h4>
          ${wizardState.characterData.skills.length > 0 ? `
            <ul>
              ${wizardState.characterData.skills.map(skillId => {
                const skill = (Array.isArray(SKILLS) ? SKILLS : []).find(s => s.id === skillId);
                return `<li>${skill ? escapeHtml(skill.name) : escapeHtml(skillId)}</li>`;
              }).join('')}
            </ul>
          ` : '<p class="muted">None selected</p>'}
        </div>
        
        <div class="review-card">
          <h4>Traits (${wizardState.characterData.traits.length})</h4>
          ${wizardState.characterData.traits.length > 0 ? `
            <ul>
              ${wizardState.characterData.traits.map(traitId => {
                const trait = (Array.isArray(TRAITS) ? TRAITS : []).find(t => t.id === traitId);
                return `<li>${trait ? escapeHtml(trait.name) : escapeHtml(traitId)}</li>`;
              }).join('')}
            </ul>
          ` : '<p class="muted">None selected</p>'}
        </div>
        
        <div class="review-card">
          <h4>Quirks (${wizardState.characterData.quirks.length})</h4>
          ${wizardState.characterData.quirks.length > 0 ? `
            <ul>
              ${wizardState.characterData.quirks.map(quirkId => {
                const quirk = (Array.isArray(QUIRKS) ? QUIRKS : []).find(q => q.id === quirkId);
                return `<li>${quirk ? escapeHtml(quirk.name) : escapeHtml(quirkId)}</li>`;
              }).join('')}
            </ul>
          ` : '<p class="muted">None selected</p>'}
        </div>
        
        <div class="review-card">
          <h4>Abilities (${wizardState.characterData.abilities.length})</h4>
          ${wizardState.characterData.abilities.length > 0 ? `
            <ul>
              ${wizardState.characterData.abilities.map(abilityId => {
                const ability = (Array.isArray(ABILITIES) ? ABILITIES : []).find(a => a.id === abilityId);
                return `<li>${ability ? escapeHtml(ability.name) : escapeHtml(abilityId)}</li>`;
              }).join('')}
            </ul>
          ` : '<p class="muted">None selected</p>'}
        </div>
        
        <div class="review-card">
          <h4>Perks (${wizardState.characterData.perks.length})</h4>
          ${wizardState.characterData.perks.length > 0 ? `
            <ul>
              ${wizardState.characterData.perks.map(perkId => {
                const perk = (Array.isArray(PERK_CATEGORIES) ? PERK_CATEGORIES : []).find(p => p.id === perkId);
                return `<li>${perk ? escapeHtml(perk.name) : escapeHtml(perkId)}</li>`;
              }).join('')}
            </ul>
          ` : '<p class="muted">None selected</p>'}
        </div>
        
        <div class="review-card">
          <h4>Buffs (${wizardState.characterData.buffs.length})</h4>
          ${wizardState.characterData.buffs.length > 0 ? `
            <ul>
              ${wizardState.characterData.buffs.map(buffId => {
                const buff = (Array.isArray(BUFFS) ? BUFFS : []).find(b => b.id === buffId);
                return `<li>${buff ? escapeHtml(buff.name) : escapeHtml(buffId)}</li>`;
              }).join('')}
            </ul>
          ` : '<p class="muted">None selected</p>'}
        </div>
        
        <div class="review-card xp-modifier">
          <h4>XP Modifier</h4>
          <p class="${hasBuffs ? 'warning-text' : 'success-text'}">
            <strong>XP Gain: ${Math.round(xpModifier * 100)}%</strong>
            ${hasBuffs ? ' (−15% due to buffs)' : ' (No penalty)'}
          </p>
          ${hasBuffs ? '<p class="warning-text">This penalty is permanent for this character</p>' : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach event listeners for current step
 */
function attachStepEventListeners() {
  const stepId = WIZARD_STEPS[wizardState.currentStep].id;
  
  switch (stepId) {
    case 'identity':
      attachIdentityListeners();
      break;
    case 'attributes':
      attachAttributeListeners();
      break;
    case 'skills':
      attachSkillListeners();
      break;
    case 'traits':
      attachTraitListeners();
      break;
    case 'abilities':
      attachAbilityListeners();
      break;
    case 'perks':
      attachPerkListeners();
      break;
    case 'buffs':
      attachBuffListeners();
      break;
  }
}

/**
 * Identity step listeners
 */
function attachIdentityListeners() {
  const nameInput = document.getElementById('wizard-char-name');
  const archetypeSelect = document.getElementById('wizard-archetype');
  
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      wizardState.characterData.name = e.target.value.trim();
      // Update only navigation buttons, not entire wizard
      updateNavigationButtons();
    });
  }
  
  if (archetypeSelect) {
    archetypeSelect.value = wizardState.characterData.archetype || '';
    archetypeSelect.addEventListener('change', (e) => {
      wizardState.characterData.archetype = e.target.value;
    });
  }
}

/**
 * Update only navigation buttons without re-rendering entire wizard
 */
function updateNavigationButtons() {
  const canProceed = validateCurrentStep();
  const nextBtn = document.querySelector('.wizard-next-btn');
  const createBtn = document.querySelector('.wizard-create-btn');
  
  if (nextBtn) {
    nextBtn.disabled = !canProceed;
  }
  if (createBtn) {
    createBtn.disabled = !canProceed;
  }
}

/**
 * Attributes step listeners
 */
function attachAttributeListeners() {
  if (!Array.isArray(ATTRIBUTES)) return;
  
  ATTRIBUTES.forEach(attr => {
    const slider = document.getElementById(`attr-${attr.id}`);
    const valueInput = document.getElementById(`attr-${attr.id}-value`);
    
    if (slider) {
      slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        wizardState.characterData.attributes[attr.id] = value;
        if (valueInput) valueInput.value = value;
        renderWizard(); // Re-render to update points display
      });
    }
    
    if (valueInput) {
      valueInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = attr.default;
        value = Math.max(attr.min, Math.min(attr.max, value));
        wizardState.characterData.attributes[attr.id] = value;
        if (slider) slider.value = value;
        renderWizard(); // Re-render to update points display
      });
    }
  });
}

/**
 * Skills step listeners
 */
function attachSkillListeners() {
  if (!Array.isArray(SKILLS)) return;
  
  SKILLS.forEach(skill => {
    const checkbox = document.getElementById(`skill-${skill.id}`);
    const card = document.querySelector(`.skill-card[data-skill="${skill.id}"]`);
    
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!wizardState.characterData.skills.includes(skill.id)) {
            wizardState.characterData.skills.push(skill.id);
          }
        } else {
          wizardState.characterData.skills = wizardState.characterData.skills.filter(s => s !== skill.id);
        }
        renderWizard();
      });
    }
    
    if (card) {
      card.addEventListener('click', (e) => {
        // Avoid double-toggling when clicking on inputs or labels
        if (!checkbox) return;
        
        const clickedInput = e.target.closest('input');
        const clickedLabel = e.target.closest('label');
        
        if (clickedInput || clickedLabel) {
          // Let native behavior handle checkbox/label clicks
          return;
        }
        
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
    }
  });
}

/**
 * Traits step listeners
 */
function attachTraitListeners() {
  // Trait checkboxes
  if (!Array.isArray(TRAITS)) return;
  
  TRAITS.forEach(trait => {
    const checkbox = document.getElementById(`trait-${trait.id}`);
    const card = document.querySelector(`.trait-card[data-trait="${trait.id}"]`);
    
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!wizardState.characterData.traits.includes(trait.id)) {
            wizardState.characterData.traits.push(trait.id);
          }
        } else {
          wizardState.characterData.traits = wizardState.characterData.traits.filter(t => t !== trait.id);
        }
        renderWizard();
      });
    }
    
    if (card) {
      card.addEventListener('click', (e) => {
        // Avoid double-toggling when clicking on inputs or labels
        if (!checkbox) return;
        
        const clickedInput = e.target.closest('input');
        const clickedLabel = e.target.closest('label');
        
        if (clickedInput || clickedLabel) {
          // Let native behavior handle checkbox/label clicks
          return;
        }
        
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
    }
  });
  
  // Quirk checkboxes
  if (!Array.isArray(QUIRKS)) return;
  
  QUIRKS.forEach(quirk => {
    const checkbox = document.getElementById(`quirk-${quirk.id}`);
    const card = document.querySelector(`.quirk-card[data-quirk="${quirk.id}"]`);
    
    if (checkbox && !checkbox.disabled) {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!wizardState.characterData.quirks.includes(quirk.id)) {
            wizardState.characterData.quirks.push(quirk.id);
          }
        } else {
          wizardState.characterData.quirks = wizardState.characterData.quirks.filter(q => q !== quirk.id);
        }
        renderWizard();
      });
    }
    
    if (card && !card.classList.contains('disabled')) {
      card.addEventListener('click', (e) => {
        // Avoid double-toggling when clicking on inputs or labels
        if (!checkbox) return;
        
        const clickedInput = e.target.closest('input');
        const clickedLabel = e.target.closest('label');
        
        if (clickedInput || clickedLabel) {
          // Let native behavior handle checkbox/label clicks
          return;
        }
        
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
    }
  });
}

/**
 * Abilities step listeners
 */
function attachAbilityListeners() {
  if (!Array.isArray(ABILITIES)) return;
  
  ABILITIES.forEach(ability => {
    const checkbox = document.getElementById(`ability-${ability.id}`);
    const card = document.querySelector(`.ability-card[data-ability="${ability.id}"]`);
    
    if (checkbox && !checkbox.disabled) {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!wizardState.characterData.abilities.includes(ability.id)) {
            wizardState.characterData.abilities.push(ability.id);
          }
        } else {
          wizardState.characterData.abilities = wizardState.characterData.abilities.filter(a => a !== ability.id);
        }
        renderWizard();
      });
    }
    
    if (card && !card.classList.contains('disabled')) {
      card.addEventListener('click', (e) => {
        // Avoid double-toggling when clicking on inputs or labels
        if (!checkbox) return;
        
        const clickedInput = e.target.closest('input');
        const clickedLabel = e.target.closest('label');
        
        if (clickedInput || clickedLabel) {
          // Let native behavior handle checkbox/label clicks
          return;
        }
        
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
    }
  });
}

/**
 * Perks step listeners
 */
function attachPerkListeners() {
  if (!Array.isArray(PERK_CATEGORIES)) return;
  
  PERK_CATEGORIES.forEach(perk => {
    const checkbox = document.getElementById(`perk-${perk.id}`);
    const card = document.querySelector(`.perk-card[data-perk="${perk.id}"]`);
    
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!wizardState.characterData.perks.includes(perk.id)) {
            wizardState.characterData.perks.push(perk.id);
          }
        } else {
          wizardState.characterData.perks = wizardState.characterData.perks.filter(p => p !== perk.id);
        }
        renderWizard();
      });
    }
    
    if (card) {
      card.addEventListener('click', (e) => {
        // Avoid double-toggling when clicking on inputs or labels
        if (!checkbox) return;
        
        const clickedInput = e.target.closest('input');
        const clickedLabel = e.target.closest('label');
        
        if (clickedInput || clickedLabel) {
          // Let native behavior handle checkbox/label clicks
          return;
        }
        
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
    }
  });
}

/**
 * Buffs step listeners
 */
function attachBuffListeners() {
  if (!Array.isArray(BUFFS)) return;
  
  BUFFS.forEach(buff => {
    const checkbox = document.getElementById(`buff-${buff.id}`);
    const card = document.querySelector(`.buff-card[data-buff="${buff.id}"]`);
    
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!wizardState.characterData.buffs.includes(buff.id)) {
            wizardState.characterData.buffs.push(buff.id);
          }
        } else {
          wizardState.characterData.buffs = wizardState.characterData.buffs.filter(b => b !== buff.id);
        }
        
        // Update XP modifier
        wizardState.characterData.xpModifier = wizardState.characterData.buffs.length > 0 
          ? XP_MODIFIER_WITH_BUFFS 
          : XP_MODIFIER_DEFAULT;
        
        renderWizard();
      });
    }
    
    if (card) {
      card.addEventListener('click', (e) => {
        // Avoid double-toggling when clicking on inputs or labels
        if (!checkbox) return;
        
        const clickedInput = e.target.closest('input');
        const clickedLabel = e.target.closest('label');
        
        if (clickedInput || clickedLabel) {
          // Let native behavior handle checkbox/label clicks
          return;
        }
        
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
    }
  });
}

/**
 * Validate current step
 */
function validateCurrentStep() {
  const stepId = WIZARD_STEPS[wizardState.currentStep].id;
  
  switch (stepId) {
    case 'identity':
      return wizardState.characterData.name.trim().length > 0;
      
    case 'attributes': {
      const totalPoints = Object.values(wizardState.characterData.attributes).reduce((sum, val) => sum + val, 0);
      return totalPoints === ATTRIBUTE_POINT_TOTAL;
    }
      
    case 'skills':
      return wizardState.characterData.skills.length >= SKILL_MIN_SELECTED &&
             wizardState.characterData.skills.length <= SKILL_MAX_SELECTED;
      
    case 'traits': {
      const hasTraits = wizardState.characterData.traits.length > 0;
      const hasQuirks = wizardState.characterData.quirks.length > 0;
      
      if (VALIDATION_RULES?.TRAITS_REQUIRE_QUIRKS) {
        // If traits selected, must have quirks
        if (hasTraits && !hasQuirks) return false;
      }
      
      return true; // Traits are optional
    }
      
    case 'abilities':
      return wizardState.characterData.abilities.length >= ABILITY_MIN_SELECTED && 
             wizardState.characterData.abilities.length <= ABILITY_MAX_SELECTED;
      
    case 'perks':
      return wizardState.characterData.perks.length <= PERK_MAX_SELECTED;
      
    case 'buffs':
      return true; // Buffs are optional
      
    case 'review':
      return true; // Always valid on review
      
    default:
      return false;
  }
}

/**
 * Update navigation buttons
 */
function updateNavigation() {
  renderWizard();
}

/**
 * Navigate to next step
 */
export function wizardNext() {
  if (!validateCurrentStep()) {
    console.warn('[Wizard] Cannot proceed - validation failed');
    return;
  }
  
  if (wizardState.currentStep < WIZARD_STEPS.length - 1) {
    wizardState.currentStep++;
    renderWizard();
    scrollToTop();
  }
}

/**
 * Navigate to previous step
 */
export function wizardBack() {
  if (wizardState.currentStep > 0) {
    wizardState.currentStep--;
    renderWizard();
    scrollToTop();
  }
}

/**
 * Create character (final step)
 */
export function wizardCreate() {
  if (!validateCurrentStep()) {
    console.warn('[Wizard] Cannot create character - validation failed');
    return;
  }
  
  console.log('[Wizard] Creating character:', wizardState.characterData);
  
  // Trigger character creation via the existing save function
  if (window.saveDndCharacterFromWizard) {
    window.saveDndCharacterFromWizard(wizardState.characterData);
  } else {
    console.error('[Wizard] saveDndCharacterFromWizard function not found');
  }
}

/**
 * Scroll to top of wizard content
 */
function scrollToTop() {
  const container = document.querySelector('.wizard-step-container');
  if (container) {
    container.scrollTop = 0;
  }
}

/**
 * Get current wizard state (for external access)
 */
export function getWizardState() {
  return wizardState;
}

/**
 * Reset wizard to initial state
 */
export function resetWizard() {
  initCharacterWizard();
}

// Expose functions to window for button onclick handlers and app.js integration
window.dndWizardNext = wizardNext;
window.dndWizardBack = wizardBack;
window.dndWizardCreate = wizardCreate;
window.initCharacterWizard = initCharacterWizard;
window.getWizardState = getWizardState;
window.resetWizard = resetWizard;
