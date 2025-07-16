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
            <div><input type="radio" id="day-${day}" name="trainingDays" value="${day}" class="hidden peer" required><label for="day-${day}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Training days option for ${day} days">${day}</label></div>`).join('');
        mainGoalContainer.innerHTML = mainGoalsData.map(goal => `
            <div><input type="radio" id="mainGoal-${goal.replace(/ /g, '')}" name="mainGoal" value="${goal}" class="hidden peer" required><label for="mainGoal-${goal.replace(/ /g, '')}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Main goal option for ${goal}">${goal}</label></div>`).join('');
        equipmentContainer.innerHTML = equipmentData.map(equip => `
            <div><input type="radio" id="equip-${equip.replace(/ /g,'')}" name="equipment" value="${equip}" class="hidden peer" required><label for="equip-${equip.replace(/ /g,'')}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Equipment option for ${equip}">${equip}</label></div>`).join('');
        genderContainer.innerHTML = genderData.map(gender => `
            <div><input type="radio" id="gender-${gender}" name="gender" value="${gender}" class="hidden peer" required><label for="gender-${gender}" class="block text-center p-4 rounded-lg border border-gray-600 cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-900/50" aria-label="Gender option for ${gender}">${gender}</label></div>`).join('');
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
You are a certified strength and conditioning coach, clinical exercise physiologist, and precision nutrition expert. Your job is to return a fully customized **weekly training and meal plan**, built around the user's input. The response must be **strictly formatted** as a valid JSON object. No markdown, no text, no headers — only JSON.

-------------------
✅ JSON STRUCTURE (Strictly Follow):
{
  "plan": [ { "day": "Day 1", "focus": "Pull (Back, Biceps)", "exercises": [ { "name": "Dumbbell Bent-Over Row", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Use moderate weight. Avoid jerking motion.", "youtube_search_query": "how to do dumbbell bent over row", "instructions": ["Hinge at your hips, keeping your back straight.", "Pull the dumbbells towards your lower chest.", "Squeeze your back muscles at the top."] } ], "cardio": { "type": "MISS – Incline Walk", "duration_minutes": 30, "intensity": "Moderate (RPE 6/10)", "timing": "Post-weight training", "notes": "Supports fat loss via steady-state effort." } } ],
  "meals": { "daily_calories": 2100, "macros": { "protein_g": 160, "carbs_g": 180, "fats_g": 70 } },
  "summary": { "goal": "Fat Loss", "style": "Push/Pull/Legs", "days_per_week": 5, "volume_type": "Low volume, high intensity", "equipment_used": ["Dumbbells", "Resistance Bands"], "adjustments": ["Avoid deep lunges due to mild knee discomfort"], "user_profile": { "sex": "Male", "weight_kg": 82 } }
}
-------------------

✅ LOGIC RULES:
1.  **Workout Plan:** For each exercise, you MUST include "name", "sets", "reps", "rest_seconds", "notes", a "youtube_search_query", and a detailed "instructions" array with at least 3 steps. Match the training style and goal with appropriate exercises. Prioritize compound lifts. Only use available "equipment". Respect injury "notes".
2.  **Nutrition logic:** Use **Mifflin-St Jeor formula** as a base for daily calories. Set macros as: **Protein**: 1.8–2.2g/kg for fat loss, 2–2.5g/kg for muscle gain; **Fats**: 25–30% total calories; **Carbs**: Remaining cals.
3.  Return **only valid JSON**, no explanations, markdown, or commentary.

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
            const swapPrompt = `Provide a single suitable alternative exercise for "${exerciseToSwap.name}". The user has access to a "${equipment}". Return a single valid JSON object for the new exercise, with no explanation. The JSON object must have the exact same structure as the original: { "name": "...", "sets": ..., "reps": ..., "rest_seconds": ..., "notes": "...", "youtube_search_query": "...", "instructions": ["..."] }. Original exercise for context: ${JSON.stringify(exerciseToSwap)}`;
            let resultText = await callGeminiAPI(swapPrompt);
            const startIndex = resultText.indexOf('{');
            const endIndex = resultText.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                resultText = resultText.substring(startIndex, endIndex + 1);
            }
            const newExercise = JSON.parse(resultText);
            currentPlanData.plan[dayIndex].exercises[exIndex] = newExercise;
            displayPlan(currentPlanData);
        } catch (error) {
            console.error("Error swapping exercise:", error);
            let msg = 'Could not swap the exercise.';
            if (error.message && error.message.includes('Failed to parse')) {
                msg += ' The AI response was not in the correct format.';
            } else if (error.message && error.message.includes('Function call failed')) {
                msg += ' The AI service is currently unavailable. Please try again later.';
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
            const exercisesHtml = day.exercises.map((ex, exIndex) => `
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
            planDetailsContainer.innerHTML += `<div class="plan-card transition-all duration-500"><h4 class="text-xl font-bold text-blue-400">${day.day}</h4><h5 class="text-lg font-semibold mb-4 text-white">${day.focus}</h5><ul class="space-y-2 flex-grow">${exercisesHtml}</ul></div>`;
        });

        if (meals && meals.macros) {
            const macros = meals.macros;
            nutritionSection.innerHTML = `
                <div class="nutrition-card mt-12 transition-all duration-500">
                    <h3 class="text-3xl font-bold text-center text-white mb-6">AI Nutrition Guidance</h3>
                    <div class="grid grid-cols-1 gap-6 text-center">
                        <div class="bg-gray-800 p-6 rounded-xl">
                            <p class="text-lg text-gray-400">Calories</p>
                            <p class="text-4xl font-bold text-blue-400">${macros.daily_calories || meals.daily_calories} kcal</p>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div class="bg-gray-800 p-6 rounded-xl">
                                <p class="text-lg text-gray-400">Protein</p>
                                <p class="text-4xl font-bold text-blue-400">${macros.protein_g}g</p>
                            </div>
                            <div class="bg-gray-800 p-6 rounded-xl">
                                <p class="text-lg text-gray-400">Carbs</p>
                                <p class="text-4xl font-bold text-blue-400">${macros.carbs_g}g</p>
                            </div>
                            <div class="bg-gray-800 p-6 rounded-xl">
                                <p class="text-lg text-gray-400">Fats</p>
                                <p class="text-4xl font-bold text-blue-400">${macros.fats_g}g</p>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
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
        if (summary) {
            const lines = [
                `Goal: ${summary.goal || ''}`,
                `Training Style: ${summary.style || ''}`,
                `Days per Week: ${summary.days_per_week || ''}`,
                `Equipment Used: ${(summary.equipment_used || []).join(', ')}`,
                `User Profile: ${summary.user_profile ? `${summary.user_profile.sex || ''}${summary.user_profile.sex ? ', ' : ''}${summary.user_profile.age ? summary.user_profile.age + ' years old, ' : ''}${summary.user_profile.weight_kg ? summary.user_profile.weight_kg + ' kg' : ''}${summary.user_profile.height_cm ? summary.user_profile.height_cm + ' cm' : ''}` : ''}`,
                summary.adjustments && summary.adjustments.length ? `Adjustments: ${summary.adjustments.join('; ')}` : ''
            ].filter(Boolean);
            lines.forEach(line => {
                if (y > pageHeight - 20) { doc.addPage(); y = margin; }
                doc.setFont("times", "bold").text(line.split(':')[0] + ':', margin, y);
                doc.setFont("times", "normal").text(line.slice(line.indexOf(':') + 1).trim(), margin + 45, y);
                y += 8;
            });
        }
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
}); 