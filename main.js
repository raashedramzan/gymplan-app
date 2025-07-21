// Automatically load the logo as base64 for PDF export
fetch('logo.png.png')
  .then(response => response.blob())
  .then(blob => {
    const reader = new FileReader();
    reader.onloadend = function() {
      window.gymplanLogoBase64 = reader.result;
    };
    reader.readAsDataURL(blob);
  });

document.addEventListener('DOMContentLoaded', function() {
    // --- Form Data ---
    const trainingDaysData = [1, 2, 3, 4, 5, 6, 7];
    const mainGoalsData = ['Muscle Gain', 'Fat Loss'];
    const subGoalsData = ['Science-Based', 'Intense'];
    const equipmentData = ['Commercial Gym', 'Dumbbells at Home', 'Calisthenics'];
    const genderData = ['Male', 'Female'];

    // --- State Management ---
    let currentStep = 1;
    const totalSteps = 4; // Updated to 4 steps
    let currentPlanData = null; // To store the generated plan for PDF download
    let lastFormData = null; // To store last form data for pre-filling
    let lastFocusedElement = null;

    // --- DOM Elements ---
    const progressBar = document.getElementById('progress-bar');
    const form = document.getElementById('gymPlanForm');
    const planGeneratorSection = document.getElementById('plan-generator');
    const planOutputSection = document.getElementById('plan-output');
    const loaderContainer = document.getElementById('loader-container');
    const resultsContainer = document.getElementById('results-container');
    const planDetailsContainer = document.getElementById('plan-details');
    const nutritionSection = document.getElementById('nutrition-section');
    const trainingDaysContainer = document.getElementById('trainingDaysContainer');
    const mainGoalContainer = document.getElementById('mainGoalContainer');
    const subGoalContainer = document.getElementById('subGoalContainer');
    const subGoalOptions = document.getElementById('subGoalOptions');
    const equipmentContainer = document.getElementById('equipmentContainer');
    const genderContainer = document.getElementById('genderContainer');
    const exerciseModal = document.getElementById('exerciseModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalVideo = document.getElementById('modalVideo');
    const modalInstructions = document.getElementById('modalInstructions');
    const youtubeLink = document.getElementById('youtubeLink');

    // --- Utility: Manage Required Attributes for Visible Step ---
    function updateRequiredAttributes() {
        // Remove 'required' from all inputs
        const allRequired = form.querySelectorAll('[required]');
        allRequired.forEach(input => input.removeAttribute('required'));
        // Add 'required' only to visible step's required fields
        const currentStepElement = document.getElementById(`step-${currentStep}`);
        if (currentStepElement) {
            const visibleRequired = currentStepElement.querySelectorAll('[data-always-required]');
            visibleRequired.forEach(input => input.setAttribute('required', 'required'));
        }
    }

    // --- Form Initialization ---
    function initializeForm() {
        trainingDaysContainer.innerHTML = trainingDaysData.map(day => `
            <div><input type="radio" id="day-${day}" name="trainingDays" value="${day}" class="hidden peer" data-always-required><label for="day-${day}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Training days option for ${day} days">${day}</label></div>`).join('');
        mainGoalContainer.innerHTML = mainGoalsData.map(goal => `
            <div><input type="radio" id="mainGoal-${goal.replace(/ /g, '')}" name="mainGoal" value="${goal}" class="hidden peer" data-always-required><label for="mainGoal-${goal.replace(/ /g, '')}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Main goal option for ${goal}">${goal}</label></div>`).join('');
        equipmentContainer.innerHTML = equipmentData.map(equip => `
            <div><input type="radio" id="equip-${equip.replace(/ /g,'')}" name="equipment" value="${equip}" class="hidden peer" data-always-required><label for="equip-${equip.replace(/ /g,'')}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Equipment option for ${equip}">${equip}</label></div>`).join('');
        genderContainer.innerHTML = genderData.map(gender => `
            <div><input type="radio" id="gender-${gender}" name="gender" value="${gender}" class="hidden peer" data-always-required><label for="gender-${gender}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Gender option for ${gender}">${gender}</label></div>`).join('');
        // After rendering, update required attributes for the first step
        updateRequiredAttributes();
    }
    initializeForm();

    // --- Event Listeners ---
    mainGoalContainer.addEventListener('change', (event) => {
        if (event.target.name === 'mainGoal') {
            subGoalContainer.classList.remove('hidden');
            subGoalOptions.innerHTML = subGoalsData.map(subGoal => `
                 <div><input type="radio" id="subGoal-${subGoal.replace(/ /g, '')}" name="subGoal" value="${subGoal}" class="hidden peer" required><label for="subGoal-${subGoal.replace(/ /g, '')}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Sub goal option for ${subGoal}">${subGoal}</label></div>`).join('');
        }
    });

    // --- Navigation ---
    window.smoothScroll = function(event) {
        event.preventDefault();
        const targetId = event.currentTarget.getAttribute("href");
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            manualSmoothScroll(targetElement);
        }
    }

    function manualSmoothScroll(element) {
        const targetPosition = element.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 750; // milliseconds
        let start = null;

        window.requestAnimationFrame(step);

        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const ease = progress / duration < 0.5 ? 2 * (progress / duration) * (progress / duration) : -1 + (4 - 2 * (progress / duration)) * (progress / duration);
            window.scrollTo(0, startPosition + distance * ease);
            if (progress < duration) window.requestAnimationFrame(step);
        }
    }

    window.nextStep = function(step) {
        if (validateStep(currentStep)) {
            document.getElementById(`step-${currentStep}`).classList.remove('active');
            currentStep = step;
            document.getElementById(`step-${currentStep}`).classList.add('active');
            updateProgressBar();
            updateRequiredAttributes();
        }
    }

    window.prevStep = function(step) {
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        currentStep = step;
        document.getElementById(`step-${currentStep}`).classList.add('active');
        updateProgressBar();
        updateRequiredAttributes();
    }

    function updateProgressBar() {
        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    function validateStep(step) {
        const currentStepElement = document.getElementById(`step-${step}`);
        const inputs = currentStepElement.querySelectorAll('[required]');
        let isValid = true;
        for (const input of inputs) {
            if ((input.type === 'radio' || input.type === 'checkbox')) {
                const groupName = input.name;
                const groupContainer = input.closest('.form-step');
                if (groupContainer && window.getComputedStyle(groupContainer).display === 'none') continue;
                if (!document.querySelector(`input[name="${groupName}"]:checked`)) {
                    isValid = false;
                    break;
                }
            } else if (!input.value) {
                isValid = false;
                break;
            }
        }
        if (!isValid) alert('Please fill out all required fields before proceeding.');
        return isValid;
    }

    // On editInputs, also update required attributes
    window.editInputs = function() {
        planOutputSection.classList.add('hidden');
        planGeneratorSection.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        loaderContainer.classList.remove('hidden');
        planDetailsContainer.innerHTML = '';
        nutritionSection.innerHTML = '';
        // Pre-fill form with lastFormData if available
        if (lastFormData) {
            for (const [key, value] of Object.entries(lastFormData)) {
                const el = form.elements[key];
                if (!el) continue;
                if (el.type === 'radio' || el.type === 'checkbox') {
                    const group = form.querySelectorAll(`[name="${key}"]`);
                    group.forEach(input => {
                        input.checked = input.value === value;
                    });
                } else {
                    el.value = value;
                }
            }
        }
        updateRequiredAttributes();
    }

    // --- Form Submission & API Call ---
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const formData = new FormData(form);
        const mainGoal = formData.get('mainGoal');
        const subGoal = formData.get('subGoal');
        const combinedGoal = `${subGoal} ${mainGoal}`;

        const data = {
            days: formData.get('trainingDays'),
            goal: combinedGoal,
            gender: formData.get('gender'),
            height: formData.get('height'),
            weight: formData.get('weight'),
            age: formData.get('age'),
            equipment: formData.get('equipment'),
            style: formData.get('trainingStyle'),
            limitations: formData.get('limitations'),
        };
        lastFormData = Object.fromEntries(formData.entries());

        planGeneratorSection.classList.add('hidden');
        planOutputSection.classList.remove('hidden');
        manualSmoothScroll(planOutputSection);

        // Show loader
        try {
            const prompt = `
You are a certified strength and conditioning coach, clinical exercise physiologist, and precision nutrition expert. Your job is to return a fully customized weekly training and meal plan, built around the user's input. The response must be strictly formatted as a valid JSON object. No markdown, no text, no headers — only JSON.

-------------------
✅ JSON STRUCTURE (Strictly Follow):
{
  "plan": [ ... ],
  "meals": { ... },
  "summary": { ... }
}
-------------------

✅ PERSONALIZATION RULES (MANDATORY):
- You MUST use ALL user inputs to fully tailor the plan and macros: goal, training style, equipment, gender, weight, height, days per week, and any limitations or injuries.
- If the user selects "Science-Based", all recommendations must be research-backed and evidence-based (e.g., cite ACSM, ISSN, Schoenfeld, Helms, etc. in your logic, not in the output).
- If the user has an injury or limitation, you MUST reflect this in the plan (avoid or modify exercises as needed, and mention modifications in notes).
- The plan and macros MUST always match the user's goal:
  - For fat loss: calories must be in a deficit, macros must support muscle retention.
  - For muscle gain: calories must be in a surplus, macros must support hypertrophy.
  - For maintenance: calories at maintenance, balanced macros.
- Do NOT return a generic plan. Every aspect must be personalized to the user's selections and notes.

✅ REQUIRED FIELDS (MANDATORY):
- For each day: include 'day' (string), 'focus' (string), and 'exercises' (array, at least one).
- For each exercise: include 'name', 'sets', 'reps', 'rest_seconds', 'notes', 'youtube_search_query', 'instructions' (array, at least 3 steps).
- The 'meals' object MUST include a 'macros' object with 'protein_g', 'carbs_g', 'fats_g', and 'daily_calories' (all numbers).
- The 'summary' object MUST include: 'goal' (string, user’s selected goal), 'style' (string, user’s selected training style), 'days_per_week' (number), 'equipment_used' (array of strings), and 'user_profile' (object with 'sex', 'weight_kg', 'height_cm', and 'age'). Never omit or rename any of these fields. If a value is unknown, use the user's input or a reasonable default.
- Never return undefined, null, or omit any required field. If a value is unknown, use a reasonable default.

✅ LOGIC RULES:
1.  **Workout Plan:** For each exercise, include "name", "sets", "reps", "rest_seconds", "notes", a "youtube_search_query", and a detailed "instructions" array with at least 3 steps. Match the training style and goal with appropriate exercises. Prioritize compound lifts. Only use available "equipment". Respect injury "notes".
2.  **Nutrition logic:** Use **Mifflin-St Jeor formula** as a base for daily calories. Set macros as: **Protein**: 1.8–2.2g/kg for fat loss, 2–2.5g/kg for muscle gain; **Fats**: 25–30% total calories; **Carbs**: Remaining cals.
3.  Return **only valid JSON**, no explanations, markdown, or commentary.

-------------------

✅ INPUT VARIABLES TO BE INJECTED:
- sex: "${data.gender}"
- weight_kg: ${data.weight}
- height_cm: ${data.height}
- age: ${data.age}
- days_per_week: ${data.days}
- goal: "${data.goal}"
- equipment: ["${data.equipment}"]
- style: "${data.style || 'Not specified, choose best fit'}"
- notes: "${data.limitations || 'None'}"
`;

            let resultText = await callGeminiAPI(prompt);
            const startIndex = resultText.indexOf('{');
            const endIndex = resultText.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                resultText = resultText.substring(startIndex, endIndex + 1);
            }
            const resultJson = JSON.parse(resultText);
            currentPlanData = resultJson;
            displayPlan(resultJson);
        } catch (error) {
            console.error("Error generating plan:", error);
            let msg = 'Sorry, we couldn\'t generate your plan.';
            if (error.message && error.message.includes('Failed to parse')) {
                msg += ' The AI response was not in the correct format.';
            } else if (error.message && error.message.includes('Function call failed')) {
                msg += ' The AI service is currently unavailable. Please try again later.';
            } else {
                msg += ' Please check your network connection and try again.';
            }
            resultsContainer.innerHTML = `<p class="text-center text-red-400">${msg}</p>`;
        } finally {
            loaderContainer.classList.add('hidden');
            resultsContainer.classList.remove('hidden');
        }
    });

    async function callGeminiAPI(prompt) {
        const functionUrl = '/api/generate-plan';
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        if (!response.ok) throw new Error(`Function call failed with status: ${response.status}`);
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0) return result.candidates[0].content.parts[0].text;
        throw new Error("Failed to parse the plan from the API response.");
    }
    
    window.swapExercise = async function(dayIndex, exIndex, buttonElement) {
        const originalButtonContent = buttonElement.innerHTML;
        buttonElement.innerHTML = `<div class="swap-loader"></div>`;
        buttonElement.disabled = true;
        try {
            const exerciseToSwap = currentPlanData.plan[dayIndex].exercises[exIndex];
            const formData = new FormData(form);
            const equipment = formData.get('equipment');
            const weight = formData.get('weight');
            const height = formData.get('height');
            const days = formData.get('trainingDays');
            // Add user info to prompt for backend validation
            const swapPrompt = `Suggest a suitable alternative exercise for "${exerciseToSwap.name}" for a user with access to "${equipment}". User info: weight_kg: ${weight}, height_cm: ${height}, days_per_week: ${days}. Return ONLY a valid JSON object with the same structure as the original exercise: { "name": "...", "sets": ..., "reps": ..., "rest_seconds": ..., "notes": "...", "youtube_search_query": "...", "instructions": ["...", ...] }`;
            let resultText = await callGeminiAPI(swapPrompt);
            const startIndex = resultText.indexOf('{');
            const endIndex = resultText.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                resultText = resultText.substring(startIndex, endIndex + 1);
            }
            let newExercise = {};
            try {
                newExercise = JSON.parse(resultText);
            } catch (e) {
                throw new Error('Malformed exercise returned by AI');
            }
            // Validate and fill missing fields
            if (!newExercise.name) throw new Error('Malformed exercise returned by AI');
            if (newExercise.rest_seconds === undefined || newExercise.rest_seconds === null || isNaN(Number(newExercise.rest_seconds))) newExercise.rest_seconds = 60;
            if (!Array.isArray(newExercise.instructions) || newExercise.instructions.length < 1) newExercise.instructions = ["See video for steps."];
            if (!('sets' in newExercise)) newExercise.sets = exerciseToSwap.sets || 3;
            if (!('reps' in newExercise)) newExercise.reps = exerciseToSwap.reps || 10;
            if (!('notes' in newExercise)) newExercise.notes = '';
            if (!('youtube_search_query' in newExercise)) newExercise.youtube_search_query = newExercise.name;
            currentPlanData.plan[dayIndex].exercises[exIndex] = newExercise;
            displayPlan(currentPlanData);
        } catch (error) {
            console.error("Error swapping exercise:", error);
            let msg = 'Could not swap the exercise.';
            if (error.message && error.message.includes('Failed to parse')) {
                msg += ' The AI response was not in the correct format.';
                msg += ' The AI service is currently unavailable. Please try again later.';
            } else if (error.message && error.message.includes('Malformed exercise')) {
                msg += ' The AI did not return a valid exercise.';
            } else {
                msg += ' Please check your network connection and try again.';
            }
            alert(msg);
            buttonElement.innerHTML = originalButtonContent;
        } finally {
            buttonElement.disabled = false;
        }
    }

    // --- UI Display ---
    function displayPlan(data) {
        const { plan, meals } = data;
        planDetailsContainer.innerHTML = '';
        nutritionSection.innerHTML = '';

        plan.forEach((day, dayIndex) => {
            const dayFocus = day.focus || 'No focus specified';
            const exercises = Array.isArray(day.exercises) ? day.exercises : [];
            let exercisesHtml = '';
            if (exercises.length > 0) {
                exercisesHtml = exercises.map((ex, exIndex) => `
                    <li class="py-3 border-b border-gray-700 last:border-b-0 transition-all duration-300">
                        <div class="flex justify-between items-center gap-2 flex-wrap">
                            <span class="font-semibold text-white">${ex.name} <button onclick="openExerciseModal(${dayIndex}, ${exIndex})" class="text-blue-400 hover:underline text-xs ml-1 font-normal" aria-label="View instructions for ${ex.name}">(view instructions)</button></span>
                            <div class="flex items-center gap-4 flex-shrink-0">
                               <p class="text-blue-400 font-semibold text-right whitespace-nowrap">${ex.sets} x ${ex.reps} reps</p>
                               <button onclick="swapExercise(${dayIndex}, ${exIndex}, this)" class="text-xs bg-gray-600 hover:bg-gray-500 rounded-full px-2 py-1 transition" aria-label="Swap exercise">Swap</button>
                            </div>
                        </div>
                        <p class="text-sm text-gray-400 mt-1">Rest: ${ex.rest_seconds}s. ${ex.notes || ''}</p>
                    </li>`).join('');
            } else {
                exercisesHtml = '<li class="text-gray-400">No exercises specified.</li>';
            }
            planDetailsContainer.innerHTML += `<div class="plan-card transition-all duration-500"><h4 class="text-xl font-bold text-blue-400">${day.day || ''}</h4><h5 class="text-lg font-semibold mb-4 text-white">${dayFocus}</h5><ul class="space-y-2 flex-grow">${exercisesHtml}</ul></div>`;
        });

        if (meals && meals.macros) {
            const macros = meals.macros;
            nutritionSection.innerHTML = `
                <div class="nutrition-card mt-12 transition-all duration-500">
                    <h3 class="text-3xl font-bold text-center text-white mb-6">AI Nutrition Guidance</h3>
                    <div class="grid grid-cols-1 gap-6 text-center">
                        <div class="bg-gray-800 p-6 rounded-xl">
                            <p class="text-lg text-gray-400">Calories</p>
                            <p class="text-4xl font-bold text-blue-400">${macros.daily_calories || meals.daily_calories || 'N/A'} kcal</p>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div class="bg-gray-800 p-6 rounded-xl">
                                <p class="text-lg text-gray-400">Protein</p>
                                <p class="text-4xl font-bold text-blue-400">${macros.protein_g !== undefined ? macros.protein_g + 'g' : 'N/A'}</p>
                            </div>
                            <div class="bg-gray-800 p-6 rounded-xl">
                                <p class="text-lg text-gray-400">Carbs</p>
                                <p class="text-4xl font-bold text-blue-400">${macros.carbs_g !== undefined ? macros.carbs_g + 'g' : 'N/A'}</p>
                            </div>
                            <div class="bg-gray-800 p-6 rounded-xl">
                                <p class="text-lg text-gray-400">Fats</p>
                                <p class="text-4xl font-bold text-blue-400">${macros.fats_g !== undefined ? macros.fats_g + 'g' : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <small class="block mt-2 text-xs text-gray-400">These macros are calculated based on your goal, weight, and evidence-based guidelines for optimal results.</small>
                </div>`;
        } else {
            nutritionSection.innerHTML = `<div class='nutrition-card mt-12 text-center text-red-400'>Nutrition data unavailable.</div>`;
        }
        // Log raw AI response for debugging
        console.log('Raw AI plan data:', data);
    }

    // --- Modal Functions ---
    window.openExerciseModal = function(dayIndex, exIndex) {
        if (!currentPlanData) return;
        const exercise = currentPlanData.plan[dayIndex].exercises[exIndex];
        modalTitle.textContent = exercise.name;
        const videoQuery = encodeURIComponent(exercise.youtube_search_query);
        modalVideo.src = `https://www.youtube.com/embed?listType=search&list=${videoQuery}`;
        youtubeLink.href = `https://www.youtube.com/results?search_query=${videoQuery}`;
        modalInstructions.innerHTML = exercise.instructions.map(step => `<li>${step}</li>`).join('');
        exerciseModal.classList.remove('hidden');
        // Accessibility: trap focus
        lastFocusedElement = document.activeElement;
        trapModalFocus();
        setTimeout(() => {
            exerciseModal.querySelector('button[aria-label="Close Exercise Details Modal"]').focus();
        }, 100);
    }

    window.closeExerciseModal = function() {
        exerciseModal.classList.add('hidden');
        modalVideo.src = '';
        // Accessibility: return focus
        if (lastFocusedElement) lastFocusedElement.focus();
    }

    // Trap focus in modal
    function trapModalFocus() {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableEls = exerciseModal.querySelectorAll(focusableSelectors);
        const firstFocusableEl = focusableEls[0];
        const lastFocusableEl = focusableEls[focusableEls.length - 1];
        function handleTrap(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableEl) {
                        e.preventDefault();
                        lastFocusableEl.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusableEl) {
                        e.preventDefault();
                        firstFocusableEl.focus();
                    }
                }
            } else if (e.key === 'Escape') {
                window.closeExerciseModal();
            }
        }
        exerciseModal.addEventListener('keydown', handleTrap);
        // Remove event listener when modal closes
        const removeTrap = () => {
            exerciseModal.removeEventListener('keydown', handleTrap);
            exerciseModal.removeEventListener('transitionend', removeTrap);
        };
        exerciseModal.addEventListener('transitionend', removeTrap);
    }

    // --- Utility Functions ---
    window.downloadPDF = function() {
        if (!currentPlanData) {
            alert("Please generate a plan first!");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        const { plan, meals, summary } = currentPlanData;

        // Layout constants
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const usableWidth = pageWidth - margin * 2;
        const pad = 4;
        const accent = { r: 29, g: 78, b: 216 }; // Tailwind blue-700
        const dark = { r: 31, g: 41, b: 55 };
        const light = { r: 245, g: 245, b: 245 };
        let y = margin;

        // Cover Page (logo)
        doc.setFillColor(light.r, light.g, light.b);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        if (window.gymplanLogoBase64) {
            doc.addImage(window.gymplanLogoBase64, 'PNG', pageWidth/2-20, y + 10, 40, 40);
            y += 35;
        }
        doc.setFont("times", "bold").setFontSize(32).setTextColor(accent.r, accent.g, accent.b);
        doc.text("GymPlan", pageWidth / 2, y + 30, { align: "center" });
        doc.setFontSize(18).setTextColor(dark.r, dark.g, dark.b);
        doc.text("Your AI-Powered Custom Workout Plan", pageWidth / 2, y + 50, { align: "center" });
        doc.setFontSize(12).setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, y + 70, { align: "center" });
        doc.addPage();
        y = margin;

        // --- Plan Summary ---
        doc.setFont("times", "bold").setFontSize(20).setTextColor(accent.r, accent.g, accent.b);
        doc.text("Plan Summary", margin, y);
        y += 10;
        doc.setDrawColor(accent.r, accent.g, accent.b);
        doc.setLineWidth(0.7);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
        doc.setFont("times", "normal").setFontSize(12).setTextColor(0);
        // Always render all summary fields, wrap long values
        const summaryFields = [
            { label: "Goal", value: summary && summary.goal ? summary.goal : 'N/A' },
            { label: "Training Style", value: summary && summary.style ? summary.style : 'N/A' },
            { label: "Days per Week", value: summary && summary.days_per_week ? summary.days_per_week : 'N/A' },
            { label: "Equipment Used", value: summary && summary.equipment_used && summary.equipment_used.length ? summary.equipment_used.join(', ') : 'N/A' },
            { label: "User Profile", value: summary && summary.user_profile ? `${summary.user_profile.sex || ''}${summary.user_profile.sex ? ', ' : ''}${summary.user_profile.age ? summary.user_profile.age + ' years old, ' : ''}${summary.user_profile.weight_kg ? summary.user_profile.weight_kg + ' kg' : ''}${summary.user_profile.height_cm ? summary.user_profile.height_cm + ' cm' : ''}`.trim() || 'N/A' : 'N/A' }
        ];
        summaryFields.forEach(field => {
            doc.setFont("times", "bold").text(field.label + ':', margin, y);
            doc.setFont("times", "normal");
            const wrapped = doc.splitTextToSize(field.value, pageWidth - margin - (margin + 45));
            doc.text(wrapped, margin + 45, y);
            y += 8 + (wrapped.length - 1) * 6;
        });
        y += 2;
        doc.setDrawColor(180);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // --- Days/Workouts ---
        plan.forEach((day, dayIdx) => {
            if (y > pageHeight - 40) { doc.addPage(); y = margin; }
            doc.setFont("times", "bold").setFontSize(16).setTextColor(accent.r, accent.g, accent.b);
            doc.text(`Day ${dayIdx + 1} – ${day.focus}`, margin, y);
            y += 9;
            doc.setDrawColor(220);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 4;
            day.exercises.forEach(ex => {
                if (y > pageHeight - 30) { doc.addPage(); y = margin; }
                doc.setFont("times", "bold").setFontSize(13).setTextColor(dark.r, dark.g, dark.b);
                doc.text(ex.name, margin, y);
                y += 7; // More vertical spacing
                // Highlight key numbers in blue and/or bold
                doc.setFont("times", "bold").setFontSize(11).setTextColor(accent.r, accent.g, accent.b);
                doc.text(`Sets x Reps:`, margin + 2, y);
                doc.setFont("times", "bold").setTextColor(0);
                doc.text(` ${ex.sets} x ${ex.reps}`, margin + 32, y);
                y += 5;
                doc.setFont("times", "bold").setTextColor(accent.r, accent.g, accent.b);
                doc.text(`Rest:`, margin + 2, y);
                doc.setFont("times", "bold").setTextColor(0);
                doc.text(` ${ex.rest_seconds} seconds`, margin + 18, y);
                y += 5;
                if (ex.notes) {
                    doc.setFont("times", "italic").setFontSize(10).setTextColor(0);
                    doc.text(`Notes: ${ex.notes}`, margin + 2, y);
                    y += 5;
                }
                if (ex.instructions && ex.instructions.length) {
                    doc.setFont("times", "normal").setFontSize(10);
                    ex.instructions.forEach((step, idx) => {
                        if (y > pageHeight - 20) { doc.addPage(); y = margin; }
                        doc.text(`- ${step}`, margin + 6, y);
                        y += 4;
                    });
                }
                y += 6; // More vertical spacing between exercises
            });
            if (day.cardio) {
                if (y > pageHeight - 30) { doc.addPage(); y = margin; }
                doc.setFont("times", "bold").setFontSize(12).setTextColor(accent.r, accent.g, accent.b);
                doc.text("Cardio", margin, y);
                y += 6;
                doc.setFont("times", "normal").setFontSize(11).setTextColor(0);
                if (day.cardio.type) {
                    doc.text(`Type: ${day.cardio.type}`, margin + 2, y); y += 5;
                }
                if (day.cardio.duration_minutes) {
                    doc.text(`Duration: ${day.cardio.duration_minutes} minutes`, margin + 2, y); y += 5;
                }
                if (day.cardio.intensity) {
                    doc.text(`Intensity: ${day.cardio.intensity}`, margin + 2, y); y += 5;
                }
                if (day.cardio.notes) {
                    doc.setFont("times", "italic").setFontSize(10);
                    doc.text(`Notes: ${day.cardio.notes}`, margin + 2, y); y += 5;
                }
                y += 2;
            }
            y += 2;
            doc.setDrawColor(180);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10; // More vertical spacing between days
        });

        // --- Nutrition Summary as Table ---
        if (meals && meals.macros) {
            if (y > pageHeight - 40) { doc.addPage(); y = margin; }
            doc.setFont("times", "bold").setFontSize(16).setTextColor(accent.r, accent.g, accent.b);
            doc.text("Daily Nutrition Summary", margin, y);
            y += 9;
            doc.setDrawColor(accent.r, accent.g, accent.b);
            doc.setLineWidth(0.7);
            doc.line(margin, y, pageWidth - margin, y);
            y += 6;
            // Table
            const macros = meals.macros;
            const table = [
                ["Calories", `${macros.daily_calories || meals.daily_calories} kcal`],
                ["Protein", `${macros.protein_g}g`],
                ["Carbohydrates", `${macros.carbs_g}g`],
                ["Fats", `${macros.fats_g}g`],
            ];
            const col1 = margin;
            const col2 = margin + 60;
            doc.setFont("times", "bold").setFontSize(12);
            table.forEach((row, i) => {
                if (y > pageHeight - 20) { doc.addPage(); y = margin; }
                doc.setTextColor(accent.r, accent.g, accent.b);
                doc.text(row[0], col1, y);
                doc.setTextColor(0);
                doc.text(row[1], col2, y);
                y += 10;
            });
            y += 2;
            doc.setDrawColor(180);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 8;
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
               .setFont("times", "normal")
               .setFontSize(9)
               .setTextColor(150)
               .text(`Page ${i} of ${pageCount}  |  gymplan.fit`, pageWidth - margin, pageHeight - 10, { align: "right" });
        }

        doc.save("GymPlan.pdf");
    }

    // --- Keyboard Navigation for Enter Key ---
    document.addEventListener('keydown', function(event) {
        // Only act if Enter is pressed and not Shift+Enter (which should insert a newline in textarea)
        if (event.key === 'Enter' && !event.shiftKey) {
            const active = document.activeElement;
            // If in a textarea, only move if not Shift+Enter
            if (active && (active.tagName === 'INPUT' || (active.tagName === 'TEXTAREA' && !event.shiftKey))) {
                // Find the current step
                const currentStepElement = document.querySelector('.form-step.active');
                if (currentStepElement) {
                    // Prevent default Enter behavior (like submitting form)
                    event.preventDefault();
                    // Find the step number
                    const stepId = currentStepElement.id;
                    const match = stepId && stepId.match(/step-(\d+)/);
                    if (match) {
                        const stepNum = parseInt(match[1], 10);
                        // Only move to next step if not the last step
                        if (stepNum < totalSteps) {
                            if (validateStep(stepNum)) {
                                window.nextStep(stepNum + 1);
                            }
                        } else if (stepNum === totalSteps) {
                            // On last step, allow form submission
                            // Do nothing, let form submit
                        }
                    }
                }
            }
        }
    });
}); 