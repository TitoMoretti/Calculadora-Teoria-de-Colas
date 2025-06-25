document.addEventListener('DOMContentLoaded', () => {    
    //Elementos del DOM
    const elements = {
        inputs: {
            arribo: document.getElementById('arriboId'),
            servicio1: document.getElementById('servicio1Id'),
            servicio2: document.getElementById('servicio2Id'),
            clientes: document.getElementById('clientesId'),
        },
        submitButton: document.getElementById('submitId'),
        resultsContainer: document.getElementById('results'),
        equalServersSection: document.querySelector('.results-section'),
        differentServersSection: document.getElementById('different-servers-section'),
        loadingIndicator: document.createElement('div')
    };

    //Indicador de carga
    elements.loadingIndicator.className = 'loading-indicator';
    elements.loadingIndicator.style.display = 'none';
    elements.submitButton.parentNode.insertBefore(elements.loadingIndicator, elements.submitButton);

    //Sanitización de entradas
    function sanitizeInput(value) {
        return value.replace(/[^0-9.]/g, '');
    }

    //Mostrar y ocultar errores
    function showError(inputId, message) {
        const errorElement = document.getElementById(`error-${inputId}`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                inputElement.classList.add('error');
            }
        }
        return false;
    }

    function clearError(inputId) {
        const errorElement = document.getElementById(`error-${inputId}`);
        if (errorElement) {
            errorElement.style.display = 'none';
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                inputElement.classList.remove('error');
            }
        }
        return true;
    }

    //Validación
    function validateInput(value, inputId) {
        if (inputId === 'clientesId') {
            if (!value.trim()) {
                return clearError(inputId);
            }
        } else {
            if (!value.trim()) {
                return showError(inputId, 'Este campo es requerido');
            }
        }

        const sanitizedValue = sanitizeInput(value);
        if (sanitizedValue !== value) {
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                inputElement.value = sanitizedValue;
            }
        }

        const numValue = parseFloat(sanitizedValue);

        if (inputId !== 'clientesId') {
            if (isNaN(numValue)) {
                return showError(inputId, 'Debe ser un número válido');
            }
            if (numValue <= 0) {
                return showError(inputId, 'Debe ser mayor que cero');
            }
        } else {
            if (value.trim() && (isNaN(numValue) || numValue < 0)) {
                return showError(inputId, 'Debe ser un número válido mayor o igual a cero');
            }
        }

        if (sanitizedValue.split('.')[1]?.length > 4) {
            return showError(inputId, 'Máximo 4 decimales permitidos');
        }

        if (inputId === 'arriboId') {
            const service1Rate = parseFloat(elements.inputs.servicio1.value);
            const service2Rate = parseFloat(elements.inputs.servicio2.value);
            if (service1Rate && service2Rate && numValue >= (service1Rate + service2Rate)) {
                return showError(inputId, 'La tasa de arribo debe ser menor que la suma de las tasas de servicio');
            }
        }

        return clearError(inputId);
    }

    //Cálculos para servidores a la misma velocidad
    function calculateMM2EqualServers(λ, μ1, μ2, n) {
        //Tasa de servicio individual
        const μ = μ1;
        //Tasa de servicio total
        const μs = 2 * μ;
        //Utilización del sistema
        const ρ = λ / μs;
        //Probabilidad del sistema vacío
        const π0 = 1 - ρ;
        //Número promedio de clientes en el sistema
        const N = λ / ((1 - ρ) * (λ + (1 - ρ) * μs));
        //Probabilidad de N clientes en el sistema
        const pn = n !== undefined ? π0 * Math.pow(ρ, n) : null;

        return { ρ, π0, N, pn };
    }

    //Cálculos para servidores a diferentes velocidades sin selección
    function calculateMM2NoSelection(λ, μ1, μ2, n) {
        //Tasa de servicio total
        const μs = μ1 + μ2;
        //Utilización del sistema
        const ρ = λ / μs;
        //Relación entre las tasas de servicio
        const r = μ2 / μ1;
        //Umbral crítico de utilización
        const ρc = 1 - Math.pow((r * (1 + r)) / (1 + Math.pow(r, 2)), 0.5);
        //Factor de utilización
        const a = (2 * μ1 * μ2) / (μ1 + μ2);
        //Probabilidad del sistema vacío
        const π0 = (1 - ρ) / (1 - ρ + λ/a);
        //Número promedio de clientes en el sistema
        const N = λ / ((1 - ρ) * (λ + (1 - ρ) * a));
        //Probabilidad de N clientes en el sistema
        const pn = n !== undefined ? π0 * Math.pow(ρ, n) : null;

        return { ρ, ρc, π0, N, pn };
    }

    //Cálculos para servidores a diferentes velocidades con selección
    function calculateMM2WithSelection(λ, μ1, μ2, n) {
        //Tasa de servicio total
        const μs = μ1 + μ2;
        //Utilización del sistema
        const ρ = λ / μs;
        //Relación entre las tasas de servicio
        const r = μ2 / μ1;
        //Factor de utilización
        const a = 1 + Math.pow(r, 2);
        //Factor de utilización
        const b = -(2 + Math.pow(r, 2));
        //Factor de utilización
        const c = -(2 * r - 1) * (1 + r);
        //Discriminante
        const discriminant = Math.pow(b, 2) - 4 * a * c;
        //Umbral crítico de utilización
        const ρc = (-b + Math.sqrt(discriminant)) / (2 * a);
        //Tasa de servicio individual
        const μ = μ1;
        //Factor de utilización
        const aPrime = ((2 * λ + μ) * (μ1 * μ2)) / (μ * (λ + μ2));
        //Probabilidad del sistema vacío
        const π0 = (1 - ρ) / (1 - ρ + λ/aPrime);
        //Número promedio de clientes en el sistema
        const N = λ / ((1 - ρ) * (λ + (1 - ρ) * aPrime));
        //Probabilidad de N clientes en el sistema
        const pn = n !== undefined ? π0 * Math.pow(ρ, n) : null;

        return { ρ, ρc, π0, N, pn };
    }

    //Formateo para Número y Probabilidades
    function formatNumber(num) {
        if (isNaN(num) || !isFinite(num)) {
            return 'Error';
        }
        return num.toFixed(4);
    }

    function formatPercentage(value) {
        return `${formatNumber(value)} = ${(value * 100).toFixed(2)}%`;
    }

    //Mostrar resultados
    function displayResults(equalResults, noSelectionResults, withSelectionResults, n) {
        //Limpiar resultados anteriores
        elements.equalServersSection.style.display = 'none';
        elements.differentServersSection.style.display = 'none';

        if (equalResults) {
            //Servidores iguales
            elements.equalServersSection.style.display = 'block';
            
            document.getElementById('result-rho-equal').textContent = formatNumber(equalResults.ρ);
            document.getElementById('result-pi0-equal').textContent = formatPercentage(equalResults.π0);
            document.getElementById('result-N-equal').textContent = formatNumber(equalResults.N);
            if (equalResults.pn !== null) {
                document.getElementById('result-pn-equal').textContent = formatPercentage(equalResults.pn);
            } else{
                document.getElementById('result-pn-equal').textContent = '';
            }
        } else if (noSelectionResults && withSelectionResults) {
            //Servidores diferentes
            elements.differentServersSection.style.display = 'block';

            //Sin selección
            document.getElementById('result-rho-no-selection').textContent = formatNumber(noSelectionResults.ρ);
            document.getElementById('result-rho-c-no-selection').textContent = formatNumber(noSelectionResults.ρc);
            document.getElementById('result-pi0-no-selection').textContent = formatPercentage(noSelectionResults.π0);
            document.getElementById('result-N-no-selection').textContent = formatNumber(noSelectionResults.N);
            if (noSelectionResults.pn !== null) {
                document.getElementById('result-pn-no-selection').textContent = formatPercentage(noSelectionResults.pn);
            } else {
                document.getElementById('result-pn-no-selection').textContent = '';
            }

            //Con selección
            document.getElementById('result-rho-selection').textContent = formatNumber(withSelectionResults.ρ);
            document.getElementById('result-rho-c-selection').textContent = formatNumber(withSelectionResults.ρc);
            document.getElementById('result-pi0-selection').textContent = formatPercentage(withSelectionResults.π0);
            document.getElementById('result-N-selection').textContent = formatNumber(withSelectionResults.N);
            if (withSelectionResults.pn !== null) {
                document.getElementById('result-pn-selection').textContent = formatPercentage(withSelectionResults.pn);
            } else {
                document.getElementById('result-pn-selection').textContent = '';
            }
        }

        elements.resultsContainer.style.display = 'block';

        //Adicional: Actualizar MathJax si está disponible
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    }

    //Validación (en tiempo real)
    Object.keys(elements.inputs).forEach(key => {
        const input = elements.inputs[key];
        if (input) {
            input.addEventListener('input', () => {
                validateInput(input.value, input.id);
            });
        }
    });

    //Botón de cálculo
    if (elements.submitButton) {
        elements.submitButton.addEventListener('click', () => {
            try {
                //Validación
                const isValid = Object.keys(elements.inputs).every(key => {
                    const input = elements.inputs[key];
                    return input && validateInput(input.value, input.id);
                });

                if (!isValid) {
                    throw new Error('Por favor, corrija los errores antes de calcular');
                }

                const λ = parseFloat(elements.inputs.arribo.value);
                const μ1 = parseFloat(elements.inputs.servicio1.value);
                const μ2 = parseFloat(elements.inputs.servicio2.value);
                const n = elements.inputs.clientes.value ? parseFloat(elements.inputs.clientes.value) : undefined;

                //Indicador de carga
                elements.loadingIndicator.style.display = 'block';

                //Cálculos
                let equalResults = null;
                let noSelectionResults = null;
                let withSelectionResults = null;

                if (μ1 === μ2) {
                    //Servidores iguales
                    equalResults = calculateMM2EqualServers(λ, μ1, μ2, n);
                } else {
                    //Servidores diferentes
                    noSelectionResults = calculateMM2NoSelection(λ, μ1, μ2, n);
                    withSelectionResults = calculateMM2WithSelection(λ, μ1, μ2, n);
                }

                //Resultados
                displayResults(equalResults, noSelectionResults, withSelectionResults, n);

            } catch (error) {
                console.error('Error en el cálculo:', error);
                showError('submitId', `Error en el cálculo: ${error.message}`);
            } finally {
                //Indicador de carga
                elements.loadingIndicator.style.display = 'none';
            }
        });
    }
});