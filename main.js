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

    // --- Form Initialization ---
    function initializeForm() {
        trainingDaysContainer.innerHTML = trainingDaysData.map(day => `
            <div><input type="radio" id="day-${day}" name="trainingDays" value="${day}" class="hidden peer"><label for="day-${day}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Training days option for ${day} days">${day}</label></div>`).join('');
        mainGoalContainer.innerHTML = mainGoalsData.map(goal => `
            <div><input type="radio" id="mainGoal-${goal.replace(/ /g, '')}" name="mainGoal" value="${goal}" class="hidden peer"><label for="mainGoal-${goal.replace(/ /g, '')}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Main goal option for ${goal}">${goal}</label></div>`).join('');
        equipmentContainer.innerHTML = equipmentData.map(equip => `
            <div><input type="radio" id="equip-${equip.replace(/ /g,'')}" name="equipment" value="${equip}" class="hidden peer"><label for="equip-${equip.replace(/ /g,'')}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Equipment option for ${equip}">${equip}</label></div>`).join('');
        genderContainer.innerHTML = genderData.map(gender => `
            <div><input type="radio" id="gender-${gender}" name="gender" value="${gender}" class="hidden peer"><label for="gender-${gender}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Gender option for ${gender}">${gender}</label></div>`).join('');
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
        }
    }

    window.prevStep = function(step) {
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        currentStep = step;
        document.getElementById(`step-${currentStep}`).classList.add('active');
        updateProgressBar();
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
✅ OUTPUT FORMAT:
Return ONLY a valid JSON object, strictly matching this structure:
{
  "plan": [ ... ],
  "meals": { ... },
  "summary": { ... }
}
No markdown, no explanations, no extra text.

✅ WORKOUT PLAN LOGIC:
- Match all exercises, sets, reps, and rest to the user's goal, experience, and available equipment.
- Prioritize compound lifts and safe, effective movements.
- Include clear, step-by-step instructions for each exercise.
- Always provide rest intervals and safety tips.
- Respect any injuries or limitations provided by the user.
- For each exercise, you MUST include an "instructions" field as an array of at least 3 step-by-step strings. Do not use any other type or omit this field.

✅ NUTRITION LOGIC:
- Use evidence-based formulas (e.g., Mifflin-St Jeor for calories).
- Set protein, fat, and carb targets based on user weight, goal, and best practices (e.g., 1.8–2.2g/kg protein for fat loss).
- Never recommend extreme or unsafe diets.
- The "meals" object MUST include a "macros" object with "protein_g", "carbs_g", and "fats_g" as numbers. Do not omit or rename these fields.

✅ PERSONALIZATION:
- Use all user inputs: gender, weight, height, days per week, equipment, limitations, etc.
- Adjust plan for training split, style, and user preferences.

✅ SAFETY & PROFESSIONALISM:
- Never recommend dangerous exercises or unsupervised max lifts.
- Always include warm-up and cool-down suggestions if possible.
- Use a positive, encouraging, but professional tone.

✅ CLARITY & STRUCTURE:
- Use clear section headings in the JSON (e.g., "plan", "meals", "summary").
- For each exercise, include: name, sets, reps, rest, notes, instructions.
- For each day, include: focus, exercises, optional cardio.

✅ NO UNSOLICITED ADVICE:
- Only provide what’s asked for—no extra commentary, jokes, or off-topic advice.

✅ STRICT FORMATTING:
- No markdown, no HTML, no emojis in the JSON output.
- All instructions and notes should be plain text.

-------------------
✅ GOAL-SPECIFIC LOGIC:
- If the user selects "Muscle Gain", design the plan and macros for optimal hypertrophy: use a calorie surplus (5–15% above maintenance), high protein (2–2.5g/kg), and evidence-based training (compound lifts, progressive overload, 6–12 reps/set, 3–5 sets/exercise).
- If the user selects "Fat Loss", design the plan and macros for fat loss: use a calorie deficit (10–25% below maintenance), high protein (1.8–2.2g/kg), and training that preserves muscle (compound lifts, moderate volume, some cardio).
- If the user selects "Science-Based", use only methods and recommendations supported by peer-reviewed research (e.g., ACSM, ISSN, Schoenfeld et al., Helms et al.).
- The plan and macros must always match the user's selected goal and preferences. Do NOT use generic or mismatched plans.

✅ MACROS LOGIC:
- Always calculate calories and macros based on the user's goal, weight, and activity.
- For fat loss: calories = maintenance - 10–25%, protein = 1.8–2.2g/kg, fats = 25–30% of calories, carbs = remainder.
- For muscle gain: calories = maintenance + 5–15%, protein = 2–2.5g/kg, fats = 20–30% of calories, carbs = remainder.
- For maintenance: calories = maintenance, protein = 1.6–2g/kg, fats = 25–30%, carbs = remainder.

✅ PERSONALIZATION (REPEAT):
- Use all user inputs (goal, style, equipment, limitations, etc.) to fully customize the plan.
- Do NOT include exercises or recommendations that do not fit the user's selections.

✅ STRICTNESS:
- If the user selects "science-based", reference or use only evidence-backed methods (e.g., progressive overload, periodization, research-based macro targets).
- If the user selects "intense", increase training volume or intensity, but still within safe, evidence-based limits.

✅ EXAMPLES:
- If user goal is "Fat Loss", calories should be lower than maintenance, and the plan should include some cardio and muscle-preserving resistance training.
- If user goal is "Muscle Gain", calories should be higher than maintenance, and the plan should focus on hypertrophy training.

-------------------

✅ INPUT VARIABLES TO BE INJECTED:
- sex: "${data.gender}"
- weight_kg: ${data.weight}
- height_cm: ${data.height}
- age: 28
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
            console.log('Raw AI plan response:', resultText);
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
            const swapPrompt = `Provide a single suitable alternative exercise for "${exerciseToSwap.name}". The user has access to a "${equipment}". Return a single valid JSON object for the new exercise, with no explanation. The JSON object must have the exact same structure as the original: { "name": "...", "sets": ..., "reps": ..., "rest_seconds": (number, required), "notes": "...", "youtube_search_query": "...", "instructions": ["...", ...] (array of at least 3 steps, required) }. Original exercise for context: ${JSON.stringify(exerciseToSwap)}`;
            let resultText = await callGeminiAPI(swapPrompt);
            const startIndex = resultText.indexOf('{');
            const endIndex = resultText.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                resultText = resultText.substring(startIndex, endIndex + 1);
            }
            console.log('Raw AI swap response:', resultText);
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
            const exercisesHtml = day.exercises.map((ex, exIndex) => {
                // Fallback for rest_seconds
                let restDisplay = (ex.rest_seconds !== undefined && ex.rest_seconds !== null && ex.rest_seconds !== '' && ex.rest_seconds !== 'undefined' && !isNaN(Number(ex.rest_seconds))) ? `${ex.rest_seconds}s` : 'N/A';
                return `
                    <div class="flex justify-between items-center gap-2 flex-wrap">
                        <span class="font-semibold text-white">${ex.name} <button onclick="openExerciseModal(${dayIndex}, ${exIndex})" class="text-blue-400 hover:underline text-xs ml-1 font-normal" aria-label="View instructions for ${ex.name}">(view instructions)</button></span>
                        <div class="flex items-center gap-4 flex-shrink-0">
                           <p class="text-blue-400 font-semibold text-right whitespace-nowrap">${ex.sets} x ${ex.reps} reps</p>
                           <button onclick="swapExercise(${dayIndex}, ${exIndex}, this)" class="text-xs bg-gray-600 hover:bg-gray-500 rounded-full px-2 py-1 transition" aria-label="Swap exercise">Swap</button>
                        </div>
                    </div>
                    <p class="text-sm text-gray-400 mt-1">Rest: ${restDisplay}. ${ex.notes || ''}</p>
                </li>`;
            }).join('');
            planDetailsContainer.innerHTML += `<div class="plan-card transition-all duration-500"><h4 class="text-xl font-bold text-blue-400">${day.day}</h4><h5 class="text-lg font-semibold mb-4 text-white">${day.focus}</h5><ul class="space-y-2 flex-grow">${exercisesHtml}</ul></div>`;
        });

        // Nutrition/macros section with fallback
        if (meals && meals.macros && typeof meals.macros === 'object' && meals.macros !== null) {
            const macros = meals.macros;
            nutritionSection.innerHTML = `
                <div class="nutrition-card mt-12 transition-all duration-500">
                    <h3 class="text-3xl font-bold text-center text-white mb-6">AI Nutrition Guidance</h3>
                    <div class="grid grid-cols-1 gap-6 text-center">
                        <div class="bg-gray-800 p-6 rounded-xl">
                            <p class="text-lg text-gray-400">Calories</p>
                            <p class="text-4xl font-bold text-blue-400">${macros.daily_calories !== undefined ? macros.daily_calories + ' kcal' : (meals.daily_calories !== undefined ? meals.daily_calories + ' kcal' : 'N/A')}</p>
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
                </div>`;
        } else {
            nutritionSection.innerHTML = `<div class='nutrition-card mt-12 text-center text-red-400'>Nutrition data unavailable.</div>`;
        }
    }

    // --- Modal Functions ---
    window.openExerciseModal = function(dayIndex, exIndex) {
        if (!currentPlanData) return;
        const exercise = currentPlanData.plan[dayIndex].exercises[exIndex];
        modalTitle.textContent = exercise.name;
        const videoQuery = encodeURIComponent(exercise.youtube_search_query || exercise.name);
        modalVideo.src = `https://www.youtube.com/embed?listType=search&list=${videoQuery}`;
        youtubeLink.href = `https://www.youtube.com/results?search_query=${videoQuery}`;
        // Robust instructions handling
        if (Array.isArray(exercise.instructions) && exercise.instructions.length > 0) {
            modalInstructions.innerHTML = exercise.instructions.map(step => `<li>${step}</li>`).join('');
        } else if (typeof exercise.instructions === 'string' && exercise.instructions.length > 0) {
            modalInstructions.innerHTML = `<li>${exercise.instructions}</li>`;
        } else {
            modalInstructions.innerHTML = '<li>No instructions available.</li>';
        }
        exerciseModal.classList.remove('hidden');
        // Accessibility: trap focus
        lastFocusedElement = document.activeElement;
        trapModalFocus();
        setTimeout(() => {
            const closeBtn = exerciseModal.querySelector('button[aria-label="Close Exercise Details Modal"]');
            if (closeBtn) closeBtn.focus();
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
        if (!currentPlanData || !currentPlanData.plan || !Array.isArray(currentPlanData.plan) || currentPlanData.plan.length === 0) {
            alert("No plan data available. Please generate a plan first.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        const { plan, meals, summary } = currentPlanData;

        // Layout constants
        const margin = 15;
        const bottomMargin = 20; // Minimum space from bottom for footer
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const usableWidth = pageWidth - margin * 2;
        const accent = { r: 29, g: 78, b: 216 }; // Tailwind blue-700
        const dark = { r: 31, g: 41, b: 55 };
        const light = { r: 245, g: 245, b: 245 };
        let y = margin;

        // --- Helper Functions ---
        function addSeparator(extra = 0) {
            doc.setDrawColor(180);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 6 + extra;
        }
        function checkPageBreak(linesNeeded = 10) {
            if (y > pageHeight - bottomMargin - linesNeeded) {
                doc.addPage();
                y = margin;
            }
        }

        // --- Cover Page (logo) ---
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

        // --- User Profile & Plan Settings ---
        doc.setFont("times", "bold").setFontSize(16).setTextColor(accent.r, accent.g, accent.b);
        doc.text("User Profile", margin, y);
        y += 8;
        addSeparator();
        doc.setFont("times", "normal").setFontSize(12).setTextColor(0);
        if (summary && summary.user_profile) {
            const up = summary.user_profile;
            doc.text(`Gender: ${up.sex || ''}`, margin, y); y += 6;
            doc.text(`Weight: ${up.weight_kg ? up.weight_kg + ' kg' : ''}`, margin, y); y += 8;
        }
        doc.setFont("times", "bold").setFontSize(16).setTextColor(accent.r, accent.g, accent.b);
        doc.text("Goal Settings", margin, y);
        y += 8;
        addSeparator();
        doc.setFont("times", "normal").setFontSize(12).setTextColor(0);
        if (summary) {
            doc.text(`Goal: ${summary.goal || ''}`, margin, y); y += 6;
            doc.text(`Training Split: ${summary.style || ''}`, margin, y); y += 6;
            doc.text(`Days per Week: ${summary.days_per_week || ''}`, margin, y); y += 6;
            doc.text(`Equipment Access: ${(summary.equipment_used || []).join(', ')}`, margin, y); y += 8;
        }
        addSeparator(2);

        // --- Days/Workouts ---
        plan.forEach((day, dayIdx) => {
            checkPageBreak(30);
            doc.setFont("times", "bold").setFontSize(15).setTextColor(accent.r, accent.g, accent.b);
            doc.text(`DAY ${dayIdx + 1} – ${day.focus}`, margin, y);
            y += 8;
            addSeparator();
            day.exercises.forEach(ex => {
                checkPageBreak(20);
                doc.setFont("times", "bold").setFontSize(13).setTextColor(dark.r, dark.g, dark.b);
                doc.text(ex.name, margin, y);
                y += 6;
                doc.setFont("times", "normal").setFontSize(11).setTextColor(0);
                doc.text(`Sets x Reps: ${ex.sets} x ${ex.reps}      Rest: ${ex.rest_seconds} sec`, margin + 2, y);
                y += 5;
                if (ex.notes) {
                    doc.setFont("times", "italic").setFontSize(10).setTextColor(0);
                    doc.text(`Tip: ${ex.notes}`, margin + 2, y);
                    y += 5;
                }
                // Only loop if instructions is an array
                if (Array.isArray(ex.instructions) && ex.instructions.length > 0) {
                    doc.setFont("times", "normal").setFontSize(10);
                    ex.instructions.forEach((step, idx) => {
                        checkPageBreak(10);
                        doc.text(`- ${step}`, margin + 6, y);
                        y += 4;
                    });
                } else if (typeof ex.instructions === 'string' && ex.instructions.length > 0) {
                    doc.setFont("times", "normal").setFontSize(10);
                    doc.text(`- ${ex.instructions}`, margin + 6, y);
                    y += 4;
                }
                y += 4;
            });
            // Cardio Section
            if (day.cardio) {
                checkPageBreak(15);
                doc.setFont("times", "bold").setFontSize(13).setTextColor(accent.r, accent.g, accent.b);
                doc.text("Cardio Session", margin, y);
                y += 6;
                addSeparator();
                doc.setFont("times", "normal").setFontSize(11).setTextColor(0);
                if (day.cardio.type) {
                    doc.text(`Type: ${day.cardio.type}`, margin, y); y += 5;
                }
                if (day.cardio.duration_minutes) {
                    doc.text(`Duration: ${day.cardio.duration_minutes} minutes`, margin, y); y += 5;
                }
                if (day.cardio.intensity) {
                    doc.text(`Intensity: ${day.cardio.intensity}`, margin, y); y += 5;
                }
                if (day.cardio.notes) {
                    doc.setFont("times", "italic").setFontSize(10);
                    doc.text(`Notes: ${day.cardio.notes}`, margin, y); y += 5;
                }
                y += 2;
            }
            addSeparator(2);
        });

        // --- Nutrition Summary as Table ---
        if (meals && meals.macros) {
            checkPageBreak(25);
            doc.setFont("times", "bold").setFontSize(15).setTextColor(accent.r, accent.g, accent.b);
            doc.text("Daily Nutrition Summary", margin, y);
            y += 8;
            addSeparator();
            // Table
            const macros = meals.macros;
            const table = [
                ["Calories", `${macros.daily_calories || meals.daily_calories} kcal`],
                ["Protein", `${macros.protein_g}g`],
                ["Carbohydrates", `${macros.carbs_g}g`],
                ["Fats", `${macros.fats_g}g`],
            ];
            const col1 = margin;
            const col2 = margin + 45;
            doc.setFont("times", "bold").setFontSize(12);
            table.forEach((row, i) => {
                checkPageBreak(10);
                doc.setTextColor(accent.r, accent.g, accent.b);
                doc.text(row[0], col1, y);
                doc.setTextColor(0);
                doc.text(row[1], col2, y);
                y += 7;
            });
            addSeparator();
            doc.setFont("times", "italic").setFontSize(10).setTextColor(0);
            if (summary && summary.user_profile && macros.protein_g && summary.user_profile.weight_kg) {
                const proteinPerKg = (macros.protein_g / summary.user_profile.weight_kg).toFixed(2);
                doc.text(`Protein = ${proteinPerKg}g/kg (based on ${summary.user_profile.weight_kg}kg weight)`, margin, y);
                y += 5;
            }
            doc.setFont("times", "normal").setFontSize(10).setTextColor(0);
            doc.text("Suggested meal breakdown available at: gymplan.fit/macros", margin, y);
            y += 8;
        }

        // --- Progress Log (Optional) ---
        checkPageBreak(30);
        doc.setFont("times", "bold").setFontSize(14).setTextColor(accent.r, accent.g, accent.b);
        doc.text("Weekly Progress Log (Optional)", margin, y);
        y += 7;
        addSeparator();

        // Use monospace font for the table
        doc.setFont("courier", "bold").setFontSize(11).setTextColor(0);
        // Define column positions
        const colDay = margin;
        const colExercise = margin + 18;
        const colWeight = margin + 55;
        const colNotes = margin + 90;
        // Header
        doc.text("Day", colDay, y);
        doc.text("Exercise", colExercise, y);
        doc.text("Weight Used", colWeight, y);
        doc.text("Notes", colNotes, y);
        y += 6;
        // Divider
        doc.setFont("courier", "normal").setFontSize(10);
        doc.text("-----", colDay, y);
        doc.text("----------", colExercise, y);
        doc.text("-----------", colWeight, y);
        doc.text("------------------", colNotes, y);
        y += 5;
        // Rows
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        days.forEach(day => {
            checkPageBreak(10);
            doc.text(day, colDay, y);
            // Leave columns blank for user to fill in
            doc.text("", colExercise, y);
            doc.text("", colWeight, y);
            doc.text("", colNotes, y);
            y += 7; // More vertical space for clarity
        });
        addSeparator(2);

        // --- Motivational Tagline ---
        checkPageBreak(10);
        doc.setFont("times", "italic").setFontSize(12).setTextColor(accent.r, accent.g, accent.b);
        doc.text('"Built by science. Personalized by AI. Executed by you."', pageWidth / 2, y, { align: "center" });
        y += 10;

        // --- Footer: Page Numbers ---
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
}); 