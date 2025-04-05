document.addEventListener('DOMContentLoaded', () => {
    // --- DOM References ---
    const prevStepBtn = document.getElementById('prevStepBtn');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const resetBtn = document.getElementById('resetBtn');
    const goToExplanationBtn = document.getElementById('goToExplanationBtn'); // *** NUEVO ***
    const explanationText = document.getElementById('explanation-text');
    const htmlCode = document.getElementById('html-code');
    const cssCode = document.getElementById('css-code');
    const cssHighlight = document.getElementById('css-highlight');
    const cssPanelPre = cssCode.parentElement;
    const specificityLog = document.getElementById('specificity-log');
    const renderedParagraph = document.getElementById('rendered-paragraph');
    const resolutionDetails = document.getElementById('resolution-details');
    const explanationSection = document.getElementById('explanation-section'); // *** NUEVO ***

    // --- Simulation Data ---
    // (Sin cambios aquí...)
    const targetElementInfo = {
        id: 'texto-ejemplo',
        classes: ['destacado', 'importante'],
        type: 'p',
        inlineStyle: {
            'text-decoration': { value: 'underline', important: false, sourceOrder: Infinity }
        },
        originalInlineStyle: renderedParagraph.getAttribute('style') || ''
    };
    const cssRules = [
        { selector: 'p', properties: { 'color': 'black', 'font-size': '16px' }, isImportant: false, specificity: [0, 0, 0, 1], sourceOrder: 0, lineStart: 1, lineEnd: 4 },
        { selector: '.destacado', properties: { 'background-color': 'yellow', 'color': 'purple' }, isImportant: false, specificity: [0, 0, 1, 0], sourceOrder: 1, lineStart: 7, lineEnd: 10 },
        { selector: '.destacado.importante', properties: { 'font-size': '20px', 'text-decoration': 'none' }, isImportant: false, specificity: [0, 0, 2, 0], sourceOrder: 2, lineStart: 13, lineEnd: 16 },
        { selector: '#texto-ejemplo', properties: { 'color': 'red', 'background-color': 'lightblue' }, isImportant: true, specificity: [0, 1, 0, 0], sourceOrder: 3, lineStart: 19, lineEnd: 22 }, // Marcada como !important
        { selector: '.importante', properties: { 'font-size': '18px'}, isImportant: false, specificity: [0, 0, 1, 0], sourceOrder: 4, lineStart: 25, lineEnd: 27 },
    ];

    // Modificación para marcar !important a nivel de regla (simplificado para el ejemplo)
    // En un caso real, !important se marca por declaración, no por regla completa.
    // Aquí asumimos que si una prop es important, toda la regla se considera así para la demo.
    // Corregir la regla 4 para que !important sea parte de la propiedad 'color'
     cssRules[3].properties.color = { value: 'red', important: true }; // Corrección
     cssRules[3].properties['background-color'] = { value: 'lightblue', important: false }; // Asegurar que bg no es important


    const inlineRule = {
        selector: 'inline style', properties: targetElementInfo.inlineStyle, isImportant: false, // Regla inline nunca es !important globalmente
        specificity: [1, 0, 0, 0], sourceOrder: Infinity, lineStart: -1, lineEnd: -1
    };
    const propertiesToResolve = ['color', 'font-size', 'background-color', 'text-decoration'];

    // --- Simulation State ---
    // (Sin cambios aquí...)
    let currentStep = -1;
    let logLines = [];
    let resolution = {};
    let finalStyles = {};
    let matchingRules = [];
    let simulationSteps = [];

    // --- Core Functions ---
    // (Sin cambios en matchSelector, compareSpecificity, createSimulationSteps)
     function matchSelector(selector, element) {
        // Simplificación: no maneja selectores complejos (>, +, ~), atributos, pseudo-elementos etc.
        if (selector === 'inline style') return true; // Siempre aplica al elemento

        // Intenta parsear selectores simples: tipo, id, clase, clase.clase
        const typeMatch = selector === element.type;
        const idMatch = selector.startsWith('#') && selector === ('#' + element.id);

        const classParts = selector.split('.').filter(s => s !== '');
        let classMatch = false;
        if (classParts.length > 0 && !selector.includes('#') && selector !== element.type) {
             // Verifica si *todas* las clases del selector están en el elemento
            classMatch = classParts.every(cls => element.classes.includes(cls));
            // Si el selector *solo* contiene clases (empieza con .)
            if (!selector.startsWith('.')) classMatch = false; // Evitar que 'p.destacado' matchee solo con clase
        }

        // Caso especial: selector de tipo + clase(s) (ej: p.importante)
        let typeAndClassMatch = false;
        if (selector.includes('.') && !selector.startsWith('.') && !selector.includes('#')) {
            const parts = selector.split('.');
            const typePart = parts[0];
            const classPartsFromType = parts.slice(1);
            if (typePart === element.type && classPartsFromType.every(cls => element.classes.includes(cls))) {
                typeAndClassMatch = true;
            }
        }


        return typeMatch || idMatch || classMatch || typeAndClassMatch;
    }

    function compareSpecificity(specA, specB) {
        for (let i = 0; i < 4; i++) {
            if (specA[i] > specB[i]) return 1;
            if (specA[i] < specB[i]) return -1;
        }
        return 0;
    }

    function createSimulationSteps() {
        let steps = [];
        steps.push({ action: 'INITIAL', explanation: 'Haz clic en "Siguiente Paso" para iniciar la simulación.' });
        steps.push({ action: 'READ_HTML', explanation: 'Leyendo HTML. Elemento objetivo: <code>p#texto-ejemplo.destacado.importante</code> con estilo inline.' });

        cssRules.forEach((rule, index) => {
            steps.push({ action: 'PROCESS_RULE_START', ruleIndex: index, explanation: `Procesando Regla ${index + 1}: selector <code>${rule.selector}</code>...` });
            steps.push({ action: 'MATCH_RULE', ruleIndex: index, explanation: `Comprobando si <code>${rule.selector}</code> coincide con el elemento...` });
            steps.push({ action: 'CALC_SPECIFICITY', ruleIndex: index, explanation: `Mostrando especificidad para <code>${rule.selector}</code>...` });
        });

        steps.push({ action: 'PROCESS_RULE_START', ruleIndex: 'inline', explanation: `Procesando Estilo Inline...` });
        steps.push({ action: 'MATCH_RULE', ruleIndex: 'inline', explanation: `Estilo inline siempre coincide.` }); // Inline siempre coincide
        steps.push({ action: 'CALC_SPECIFICITY', ruleIndex: 'inline', explanation: `Mostrando especificidad para Estilo Inline...` });


        propertiesToResolve.forEach(prop => {
            steps.push({ action: 'RESOLVE_PROPERTY_START', property: prop, explanation: `Iniciando resolución para la propiedad <code>${prop}</code>...` });
            steps.push({ action: 'COMPARE_RULES', property: prop, explanation: `Identificando reglas aplicables para <code>${prop}</code>...` });
            steps.push({ action: 'DECLARE_WINNER', property: prop, explanation: `Comparando reglas para <code>${prop}</code> y determinando ganador según la cascada...` });
        });

        steps.push({ action: 'APPLY_STYLES', explanation: 'Aplicando los estilos finales calculados al elemento renderizado...' });
        steps.push({ action: 'END', explanation: 'Simulación completada. El párrafo muestra los estilos finales.' });
        return steps;
    }

    // --- UI Update Function ---
    // (Sin cambios aquí, excepto asegurarse que usa innerHTML para explanationText si contiene <code>)
    function updateUI() {
        if (currentStep < 0 || currentStep >= simulationSteps.length) {
            explanationText.innerHTML = simulationSteps[0]?.explanation || 'Cargando...'; // Usar innerHTML
            specificityLog.textContent = "[Esperando simulación...]";
            resolutionDetails.innerHTML = "";
            cssHighlight.style.display = 'none';
            renderedParagraph.removeAttribute('style');
            if(targetElementInfo.originalInlineStyle) { // Reaplicar estilo original si existía
                 renderedParagraph.setAttribute('style', targetElementInfo.originalInlineStyle);
            }
             // Resetear estilos que podrían haber sido aplicados por JS
             renderedParagraph.style.color = '';
             renderedParagraph.style.fontSize = '';
             renderedParagraph.style.backgroundColor = '';
             renderedParagraph.style.textDecoration = '';

             prevStepBtn.disabled = true;
             nextStepBtn.disabled = false;
             resetBtn.disabled = true;
            return;
        }

        const step = simulationSteps[currentStep];

        // 1. Explanation (Usar innerHTML porque puede contener <code>)
        explanationText.innerHTML = step.explanation || '';

        // 2. Specificity Log
        specificityLog.innerHTML = logLines.map(line => {
            // Resaltar palabras clave usando <strong> y clases para colores
             return line.replace(/MATCH/g, '<strong class="match">$&</strong>')
                        .replace(/NO MATCH/g, '<strong class="no-match">$&</strong>')
                        .replace(/Specificity|Comparing|Winner|Reason|!important/gi, '<strong>$&</strong>'); // Hacer !important bold
        }).join('\n');
        specificityLog.scrollTop = specificityLog.scrollHeight;


        // 3. CSS Highlight
        let ruleToHighlight = null;
         if (step.action.includes('RULE') || step.action.includes('SPECIFICITY')) {
             if(step.ruleIndex !== 'inline' && step.ruleIndex !== undefined && cssRules[step.ruleIndex]) {
                 ruleToHighlight = cssRules[step.ruleIndex];
             }
         }
          if (ruleToHighlight && ruleToHighlight.lineStart >= 0 && cssPanelPre && cssCode) {
             try { // Envuelve en try-catch por si algo falla con getComputedStyle
                 const preStyles = window.getComputedStyle(cssPanelPre);
                 const codeStyles = window.getComputedStyle(cssCode);
                 // Usar valores por defecto si getComputedStyle falla o retorna NaN/invalid
                 const fontSize = parseFloat(codeStyles.fontSize) || 14.4; // 0.9rem * 16px (aprox)
                 const lineHeight = parseFloat(codeStyles.lineHeight) || (fontSize * 1.6);
                 const paddingTop = parseFloat(preStyles.paddingTop) || 15; // Valor del CSS
                 const highlightHeight = (ruleToHighlight.lineEnd - ruleToHighlight.lineStart + 1) * lineHeight;
                 const highlightTop = paddingTop + (ruleToHighlight.lineStart -1) * lineHeight; // Ajuste: lineStart es 1-based

                 cssHighlight.style.top = `${highlightTop}px`;
                 cssHighlight.style.height = `${highlightHeight}px`;
                 cssHighlight.style.display = 'block';
             } catch (e) {
                 console.error("Error calculating highlight position:", e);
                 cssHighlight.style.display = 'none'; // Ocultar si hay error
             }
         } else {
             cssHighlight.style.display = 'none';
         }


        // 4. Resolution Details
        let resolutionHTML = '<ul>';
        propertiesToResolve.forEach(prop => {
            const res = resolution[prop];
            if (res && res.stepIndex <= currentStep) { // Solo mostrar si ya se resolvió en este paso o antes
                 resolutionHTML += `<li><strong class="prop-name">${prop}:</strong> <span class="value">${res.value}</span>`;
                 const isImportant = res.winnerImportant ? ' !important' : '';
                 const specString = Array.isArray(res.rule.specificity) ? res.rule.specificity.join(',') : 'N/A';
                 resolutionHTML += `<span class="rule">Ganador: ${res.rule.selector || 'inline style'} (Especificidad: ${specString}${isImportant})</span>`;
                 resolutionHTML += `<span class="reason">Razón: ${res.reason}</span></li>`;
             } else {
                 // No mostrar nada o un placeholder si aún no se ha resuelto
                 // resolutionHTML += `<li><strong class="prop-name">${prop}:</strong> <span class="value"><em>(pendiente)</em></span></li>`;
             }
        });
        resolutionHTML += '</ul>';
        resolutionDetails.innerHTML = resolutionHTML;

        // 5. Rendered Paragraph Styles
        // Resetear estilos antes de aplicar los finales para evitar acumulación
        if (currentStep >= simulationSteps.findIndex(s => s.action === 'RESOLVE_PROPERTY_START')) {
             renderedParagraph.removeAttribute('style');
             if(targetElementInfo.originalInlineStyle) {
                renderedParagraph.setAttribute('style', targetElementInfo.originalInlineStyle);
             }
             // Limpiar estilos individuales aplicados por JS previamente
             renderedParagraph.style.color = '';
             renderedParagraph.style.fontSize = '';
             renderedParagraph.style.backgroundColor = '';
             renderedParagraph.style.textDecoration = '';


             // Aplicar estilos finales acumulados hasta el paso actual
             Object.keys(finalStyles).forEach(prop => {
                  if (finalStyles[prop].stepIndex <= currentStep) { // Solo aplicar si se determinó en este paso o antes
                      const styleProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                      const isWinnerImportant = finalStyles[prop].important;
                      renderedParagraph.style.setProperty(prop, finalStyles[prop].value, isWinnerImportant ? 'important' : '');
                  }
             });
        }


        // 6. Button States
        prevStepBtn.disabled = (currentStep <= 0);
        nextStepBtn.disabled = (currentStep >= simulationSteps.length - 1);
        resetBtn.disabled = (currentStep < 0); // Habilitar Reset tan pronto como currentStep sea 0 o más

    }

    // --- Simulation Logic (Ejecuta un solo paso) ---
    function runSimulationStep() {
        if (currentStep < 0 || currentStep >= simulationSteps.length) {
            updateUI();
            return;
        }

        const step = simulationSteps[currentStep];
        let rule = null;
         if (step.ruleIndex !== undefined) {
            rule = (step.ruleIndex === 'inline') ? inlineRule : cssRules[step.ruleIndex];
         }


        // Resetear estados solo al INICIO REAL de la simulación (paso después de INITIAL)
        if (currentStep === 1 && step.action === 'READ_HTML') {
            logLines = [];
            resolution = {};
            finalStyles = {};
            matchingRules = []; // Reiniciar reglas coincidentes
             // Re-añadir la regla inline a matchingRules si estamos procesándola o después
             if (inlineRule) matchingRules.push(inlineRule); // Inline siempre coincide
        }

        switch (step.action) {
             case 'INITIAL':
                 // No hace nada lógico, solo muestra UI inicial
                 break;
             case 'READ_HTML':
                 logLines.push(`Elemento HTML: <${targetElementInfo.type} id="${targetElementInfo.id}" class="${targetElementInfo.classes.join(' ')}">`);
                 logLines.push(`Estilo Inline: ${JSON.stringify(targetElementInfo.inlineStyle)}`);
                 // Asegurarse de que la regla inline está en matchingRules desde el principio
                 if (inlineRule && !matchingRules.find(r => r.selector === 'inline style')) {
                    matchingRules.push(inlineRule);
                 }
                 break;

             case 'PROCESS_RULE_START':
                  logLines.push(`\n<span class="rule-header">--- Procesando Regla ${step.ruleIndex === 'inline' ? '[INLINE]' : step.ruleIndex + 1} ---</span>`);
                  if (rule) { // Añadido check por si rule es null
                     logLines.push(`Selector: ${rule.selector}`);
                  }
                  break;

             case 'MATCH_RULE':
                  if (!rule) break; // Salir si no hay regla (ej. inline ya procesado)
                  if (rule.selector === 'inline style') {
                      logLines.push(`<span class="match">MATCH</span> (Estilo Inline siempre aplica)`);
                      // Asegurarse que está en matchingRules (aunque ya debería estar)
                       if (!matchingRules.find(r => r.selector === 'inline style')) {
                           matchingRules.push(inlineRule);
                       }
                  } else {
                      const isMatch = matchSelector(rule.selector, targetElementInfo);
                      logLines.push(`Coincide con el elemento? ${isMatch ? '<span class="match">MATCH</span>' : '<span class="no-match">NO MATCH</span>'}`);
                      if (isMatch && !matchingRules.find(r => r.sourceOrder === rule.sourceOrder)) { // Evitar duplicados
                          matchingRules.push(rule);
                           // Ordenar matchingRules por sourceOrder para la resolución
                           matchingRules.sort((a, b) => a.sourceOrder - b.sourceOrder);
                      }
                  }
                  break;

             case 'CALC_SPECIFICITY':
                  if (!rule) break;
                  // Determinar si alguna propiedad de ESTA regla es !important
                  // let ruleHasImportant = Object.values(rule.properties).some(prop => prop.important);
                  // Simplificación: Usamos el flag 'isImportant' de la regla (como estaba antes)
                  // O chequeamos si la propiedad *actual* es important
                   const propActual = simulationSteps[currentStep-1]?.property || simulationSteps[currentStep-2]?.property; // Intentar obtener propiedad si estamos en resolución
                   let isPropImportant = false;
                   if(propActual && rule.properties[propActual]?.important) {
                       isPropImportant = true;
                   } else if (rule.isImportant) { // Usar el flag global si existe (para la regla ID)
                       isPropImportant = true;
                   }

                  logLines.push(`Specificity [inline, id, class, type]: [${rule.specificity.join(', ')}]${isPropImportant ? ' <strong class="important-flag">(!important relevante)</strong>' : ''}`);
                  break;

             case 'RESOLVE_PROPERTY_START':
                  logLines.push(`\n<strong class="comparison">--- Resolviendo propiedad: ${step.property} ---</strong>`);
                  // No limpiar resolución aquí, se hace en DECLARE_WINNER si se encuentra un nuevo ganador
                  break;

             case 'COMPARE_RULES':
                  const prop = step.property;
                  const contenders = matchingRules.filter(r => r.properties[prop] !== undefined);
                   if (contenders.length > 0) {
                      logLines.push(`Reglas contendientes para <code>${prop}</code>: ${contenders.map(r => `<code>${r.selector}</code>`).join(', ')}`);
                   } else {
                       logLines.push(`Ninguna regla coincidente define <code>${prop}</code>. Se usará valor inicial o heredado (no simulado aquí).`);
                       // Marcar como no definido si no hay contendientes
                       resolution[prop] = {
                           value: '<i>(no definido/heredado)</i>',
                           rule: { selector: 'none', specificity: [-1, -1, -1, -1], isImportant: false, sourceOrder: -1 },
                           winnerImportant: false,
                           reason: 'Ninguna regla aplicable encontrada.',
                           stepIndex: currentStep // Marcar en qué paso se resolvió
                       };
                   }
                  break;

             case 'DECLARE_WINNER':
                  const currentProp = step.property;
                  let winner = null;
                  let winnerImportant = false;
                  let reason = '';

                  // Filtrar solo reglas que definan la propiedad actual
                  const propContenders = matchingRules.filter(r => r.properties[currentProp] !== undefined);

                  if (propContenders.length === 0) {
                       if (!resolution[currentProp]) { // Solo añadir si no se marcó antes
                           reason = 'No se encontró ninguna regla aplicable.';
                           logLines.push(`Propiedad <code>${currentProp}</code> no definida por ninguna regla.`);
                           resolution[currentProp] = { value: '<i>(no definido/heredado)</i>', rule: { selector:'none', specificity: [-1,-1,-1,-1], isImportant: false, sourceOrder: -1 }, winnerImportant: false, reason: reason, stepIndex: currentStep };
                       }
                  } else {
                       // Separar por !important a nivel de DECLARACIÓN
                       const importantDeclarations = propContenders.filter(r => r.properties[currentProp]?.important);
                       const normalDeclarations = propContenders.filter(r => !r.properties[currentProp]?.important);

                       let listToCompare = [];
                       let comparingImportant = false;

                       logLines.push("Evaluando declaraciones:");
                       if (importantDeclarations.length > 0) {
                           logLines.push(` - Declaraciones !important encontradas: ${importantDeclarations.map(r => `<code>${r.selector}</code>`).join(', ')}`);
                           listToCompare = importantDeclarations;
                           comparingImportant = true;
                       } else if (normalDeclarations.length > 0) {
                           logLines.push(` - Declaraciones normales encontradas: ${normalDeclarations.map(r => `<code>${r.selector}</code>`).join(', ')}`);
                           listToCompare = normalDeclarations;
                       } else {
                           logLines.push(` - No hay declaraciones válidas (esto no debería pasar si propContenders > 0).`);
                       }


                       if (listToCompare.length > 0) {
                            // Ordenar por especificidad y luego por sourceOrder
                            listToCompare.sort((a, b) => {
                               const specDiff = compareSpecificity(b.specificity, a.specificity); // Mayor especificidad primero
                               if (specDiff !== 0) return specDiff;
                               return b.sourceOrder - a.sourceOrder; // Mayor sourceOrder (más tardío) primero
                            });

                            winner = listToCompare[0]; // El primero después de ordenar es el ganador
                            winnerImportant = comparingImportant; // El ganador es !important si vino de esa lista

                            // Determinar razón
                            if (listToCompare.length === 1) {
                                reason = `Única declaración ${comparingImportant ? '!important ' : ''}aplicable.`;
                            } else {
                                const runnerUp = listToCompare[1];
                                const specComparison = compareSpecificity(winner.specificity, runnerUp.specificity);
                                if (specComparison > 0) {
                                    reason = `Mayor especificidad (${winner.specificity.join(',')}) ${comparingImportant ? 'entre reglas !important' : ''}.`;
                                } else if (specComparison === 0 && winner.sourceOrder > runnerUp.sourceOrder) {
                                    reason = `Misma especificidad, pero aparece más tarde en el código ${comparingImportant ? '(declaración !important)' : ''}.`;
                                } else {
                                    // Caso especial: estilo inline vs ID !important (aunque aquí no aplica)
                                    // O estilo inline vs otras reglas (gana por especificidad [1,0,0,0])
                                     if (winner.selector === 'inline style') {
                                         reason = 'Estilo Inline tiene la mayor especificidad.';
                                     } else {
                                         reason = `Regla ganadora determinada por cascada (Especificidad: ${winner.specificity.join(',')}, Orden: ${winner.sourceOrder}).`; // Razón genérica si falla la lógica anterior
                                     }
                                }
                                // Log de comparación detallado (opcional)
                                logLines.push(`  Comparando <code>${winner.selector}</code> (${winner.specificity.join(',')}) vs <code>${runnerUp.selector}</code> (${runnerUp.specificity.join(',')})...`);
                                logLines.push(`  -> <code>${winner.selector}</code> gana.`);

                            }

                           // Almacenar resultado
                           const propData = winner.properties[currentProp];
                           const finalValue = typeof propData === 'object' && propData !== null ? propData.value : propData;
                           resolution[currentProp] = { value: finalValue, rule: winner, winnerImportant: winnerImportant, reason: reason, stepIndex: currentStep };
                           finalStyles[currentProp] = { value: finalValue, important: winnerImportant, stepIndex: currentStep }; // Guardar para aplicar

                           logLines.push(`<strong class="winner">Ganador para <code>${currentProp}</code>: <code>${winner.selector}</code> (Valor: ${finalValue})${winnerImportant ? ' !important' : ''}</strong>`);
                           logLines.push(`<em class="reason">   Razón: ${reason}</em>`);

                       } else if (!resolution[currentProp]) {
                             // Si después de filtrar por !important no queda nada, y no había resolución previa.
                             resolution[currentProp] = { value: '<i>(no definido/heredado)</i>', rule: { selector:'none', specificity: [-1,-1,-1,-1], isImportant: false, sourceOrder: -1 }, winnerImportant: false, reason: 'No se encontró regla aplicable final.', stepIndex: currentStep };
                             logLines.push(`Propiedad <code>${currentProp}</code> no definida.`);
                       }
                  }
                  break;


             case 'APPLY_STYLES':
                 logLines.push("\n--- Aplicando Estilos Finales al Elemento Renderizado ---");
                 // La aplicación real ocurre en updateUI al detectar este paso o el final
                 break;
             case 'END':
                 logLines.push("\n--- Simulación Finalizada ---");
                 break;
        }

        updateUI();
    }


    // --- Reset Function ---
    // (Sin cambios aquí...)
    function resetSimulation() {
        currentStep = -1;
        logLines = [];
        resolution = {};
        finalStyles = {};
        matchingRules = [];
        // Log inicial para la próxima simulación
         logLines = ["[Simulación reseteada. Haz clic en 'Siguiente Paso'."];
         updateUI(); // Llamar a updateUI para limpiar todo y resetear botones
    }

    // --- Event Listeners ---
    // (Listeners para next, prev, reset sin cambios...)
     nextStepBtn.addEventListener('click', () => {
        if (currentStep < simulationSteps.length - 1) {
            currentStep++;
            runSimulationStep();
        }
    });

    prevStepBtn.addEventListener('click', () => {
       // Retroceder recalculando todo hasta el paso anterior
       if (currentStep > 0) {
           const targetStep = currentStep - 1;
           // Resetear estado
            logLines = [];
            resolution = {};
            finalStyles = {};
            matchingRules = []; // Importante resetear esto

            // Simular todos los pasos hasta el objetivo SIN actualizar UI
            for(let i = 0; i <= targetStep; i++) {
                currentStep = i; // Establecer el paso actual para la lógica
                executeStepLogicOnly(i); // Ejecutar solo la lógica
            }
            // Establecer el paso final y ejecutar con actualización de UI
            currentStep = targetStep;
            runSimulationStep();
       } else if (currentStep === 0) {
           // Si estamos en el primer paso (index 0) y vamos atrás, reseteamos
           resetSimulation();
       }
    });

    resetBtn.addEventListener('click', resetSimulation);

    // *** NUEVO LISTENER PARA EL BOTÓN DE EXPLICACIÓN ***
    goToExplanationBtn.addEventListener('click', () => {
        if (explanationSection) {
            explanationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });


    // Función auxiliar para recalcular estado sin tocar UI (para el botón 'anterior')
    // (Adaptada para reflejar la lógica de runSimulationStep)
     function executeStepLogicOnly(stepIndex) {
         if (stepIndex < 0 || stepIndex >= simulationSteps.length) return;
         const step = simulationSteps[stepIndex];
          let rule = null;
          if (step.ruleIndex !== undefined) {
             rule = (step.ruleIndex === 'inline') ? inlineRule : cssRules[step.ruleIndex];
          }

         // Resetear estados solo al INICIO REAL de la simulación (paso después de INITIAL)
         if (stepIndex === 1 && step.action === 'READ_HTML') {
             logLines = []; resolution = {}; finalStyles = {}; matchingRules = [];
              if (inlineRule) matchingRules.push(inlineRule);
         }


          // Re-ejecuta la lógica relevante del switch en runSimulationStep
          // pero solo actualizando las variables de estado (logLines, resolution, finalStyles, matchingRules)
          // SIN llamar a updateUI()
           switch (step.action) {
               // Copiar la lógica relevante de runSimulationStep, actualizando las variables de estado
                case 'READ_HTML':
                    logLines.push(`Elemento HTML: ...`); logLines.push(`Estilo Inline: ...`);
                    if (inlineRule && !matchingRules.find(r => r.selector === 'inline style')) matchingRules.push(inlineRule);
                    break;
                case 'PROCESS_RULE_START':
                    logLines.push(`\n<span class="rule-header">--- Procesando Regla ...`);
                    if(rule) logLines.push(`Selector: ${rule.selector}`);
                    break;
                case 'MATCH_RULE':
                    if(!rule) break;
                     if (rule.selector === 'inline style') {
                        logLines.push(`MATCH (Inline)`);
                        if (!matchingRules.find(r => r.selector === 'inline style')) matchingRules.push(inlineRule);
                    } else {
                        const isMatch = matchSelector(rule.selector, targetElementInfo);
                        logLines.push(`Coincide...? ${isMatch ? 'MATCH' : 'NO MATCH'}`);
                        if (isMatch && !matchingRules.find(r => r.sourceOrder === rule.sourceOrder)) {
                             matchingRules.push(rule);
                             matchingRules.sort((a, b) => a.sourceOrder - b.sourceOrder);
                         }
                    }
                    break;
                case 'CALC_SPECIFICITY':
                    if(!rule) break;
                     const propActual = simulationSteps[stepIndex-1]?.property || simulationSteps[stepIndex-2]?.property;
                     let isPropImportant = false;
                     if(propActual && rule.properties[propActual]?.important) isPropImportant = true;
                     else if (rule.isImportant) isPropImportant = true;
                    logLines.push(`Specificity: [${rule.specificity.join(', ')}]${isPropImportant ? ' (!important)' : ''}`);
                    break;
                case 'RESOLVE_PROPERTY_START':
                    logLines.push(`\n<strong class="comparison">--- Resolviendo propiedad: ${step.property} ---</strong>`);
                    break;
                case 'COMPARE_RULES':
                    const prop = step.property;
                    const contenders = matchingRules.filter(r => r.properties[prop] !== undefined);
                    if (contenders.length > 0) logLines.push(`Reglas contendientes para ${prop}: ...`);
                    else {
                        logLines.push(`Ninguna regla define ${prop}.`);
                         if (!resolution[prop]) resolution[prop] = { value: '<i>(no definido/heredado)</i>', rule: { selector:'none', specificity: [-1,-1,-1,-1], isImportant: false, sourceOrder: -1 }, winnerImportant: false, reason: 'Ninguna regla aplicable.', stepIndex: stepIndex };
                    }
                    break;
                 case 'DECLARE_WINNER':
                    // --- Re-ejecutar lógica completa de comparación ---
                    const currentProp = step.property;
                    let winner = null; let winnerImportant = false; let reason = '';
                    const propContenders = matchingRules.filter(r => r.properties[currentProp] !== undefined);
                    if (propContenders.length > 0) {
                        const importantDeclarations = propContenders.filter(r => r.properties[currentProp]?.important);
                        const normalDeclarations = propContenders.filter(r => !r.properties[currentProp]?.important);
                        let listToCompare = []; let comparingImportant = false;
                         if (importantDeclarations.length > 0) { listToCompare = importantDeclarations; comparingImportant = true; logLines.push("Evaluando !important..."); }
                         else if (normalDeclarations.length > 0) { listToCompare = normalDeclarations; logLines.push("Evaluando normales..."); }

                         if (listToCompare.length > 0) {
                              listToCompare.sort((a, b) => { const sd = compareSpecificity(b.specificity, a.specificity); return sd !== 0 ? sd : b.sourceOrder - a.sourceOrder; });
                              winner = listToCompare[0]; winnerImportant = comparingImportant;
                              // Calcular razón (simplificado aquí para brevedad)
                              reason = `Ganador determinado por cascada (Especificidad/Orden).`;
                               if (winner.selector === 'inline style') reason = 'Estilo Inline.';

                              const propData = winner.properties[currentProp];
                              const finalValue = typeof propData === 'object' ? propData.value : propData;
                              resolution[currentProp] = { value: finalValue, rule: winner, winnerImportant: winnerImportant, reason: reason, stepIndex: stepIndex };
                              finalStyles[currentProp] = { value: finalValue, important: winnerImportant, stepIndex: stepIndex };
                              logLines.push(`Ganador para ${currentProp}: ${winner.selector} (Valor: ${finalValue})`);
                         } else if (!resolution[currentProp]) {
                              resolution[currentProp] = { value: '<i>(no def/heredado)</i>', rule: { selector:'none', specificity: [-1,-1,-1,-1], sourceOrder: -1 }, reason: 'No aplicable.', stepIndex: stepIndex };
                              logLines.push(`Prop ${currentProp} no definida.`);
                         }
                    } else if (!resolution[currentProp]) {
                          resolution[currentProp] = { value: '<i>(no def/heredado)</i>', rule: { selector:'none', specificity: [-1,-1,-1,-1], sourceOrder: -1 }, reason: 'No aplicable.', stepIndex: stepIndex };
                          logLines.push(`Prop ${currentProp} no definida.`);
                    }
                    break;
                case 'APPLY_STYLES': logLines.push("\n--- Aplicando Estilos Finales ---"); break;
                case 'END': logLines.push("\n--- Simulación Finalizada ---"); break;
           }
    }


    // --- Initial Setup ---
    simulationSteps = createSimulationSteps();
    resetSimulation(); // Establecer estado inicial limpio

});