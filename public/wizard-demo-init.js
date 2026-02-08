/**
 * Demo initialization script for wizard testing
 */

// Mock data for testing
window.me = { username: 'TestUser' };
window.dndState = { session: { id: 1 } };

// Mock save function
window.saveDndCharacterFromWizard = async function(wizardData) {
    console.log('Character Data:', wizardData);
    const msg = document.getElementById('dndCharMsg');
    if (msg) {
        msg.textContent = '✅ Character created successfully! (Demo Mode)';
        msg.style.background = 'rgba(16, 185, 129, 0.2)';
        msg.style.color = '#10b981';
        msg.style.fontWeight = 'bold';
    }
    
    // Show the data in console for verification
    console.table({
        'Name': wizardData.name,
        'Skills Count': wizardData.skills.length,
        'Traits Count': wizardData.traits.length,
        'Quirks Count': wizardData.quirks.length,
        'Abilities Count': wizardData.abilities.length,
        'Buffs Count': wizardData.buffs.length,
        'XP Modifier': `${Math.round(wizardData.xpModifier * 100)}%`
    });
    
    console.log('Full character data:', JSON.stringify(wizardData, null, 2));
};

// Handle close button
document.getElementById('dndCharacterClose')?.addEventListener('click', () => {
    alert('Close button clicked - would normally close the modal');
});

// Initialize wizard on load
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.initCharacterWizard) {
            console.log('Initializing character wizard...');
            window.initCharacterWizard();
        } else {
            console.error('Wizard not loaded yet');
            setTimeout(() => {
                if (window.initCharacterWizard) {
                    console.log('Retrying wizard initialization...');
                    window.initCharacterWizard();
                }
            }, 500);
        }
    }, 100);
});
