document.addEventListener('DOMContentLoaded', () => {
    //Cargar los elementos del DOM
    const elements = {
        inputs: {
            arribo: document.getElementById('arriboId'),
            servicio: document.getElementById('servicioId'),
            poblacion: document.getElementById('poblacionId'),
        },
        submitButton: document.getElementById('submitId'),
        resultsContainer: document.getElementById('results'),
        loadingIndicator: document.createElement('div')
    };

    //Crear el indicador de carga
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
        const inputElement = document.getElementById(inputId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        inputElement.classList.add('error');
        return false;
    }

    function clearError(inputId) {
        const errorElement = document.getElementById(`error-${inputId}`);
        const inputElement = document.getElementById(inputId);
        errorElement.style.display = 'none';
        inputElement.classList.remove('error');
        return true;
    }

    //Validar entradas
    function validateInput(value, inputId) {
        if (inputId === 'poblacionId') {
            //Permitir que N sea vacío
            if (!value.trim()) {
                clearError(inputId);
                return true;
            }
        } else {
            if (!value.trim()) {
                return showError(inputId, 'Este campo es requerido');
            }
        }
        //Sanitizar entrada
        const sanitizedValue = sanitizeInput(value);
        if (sanitizedValue !== value) {
            document.getElementById(inputId).value = sanitizedValue;
        }
        const numValue = parseFloat(sanitizedValue);
        if (inputId !== 'poblacionId') {
            if (isNaN(numValue)) {
                return showError(inputId, 'Debe ser un número válido');
            }
            if (numValue <= 0) {
                return showError(inputId, 'Debe ser mayor que cero');
            }
        } else {
            //Para N, permitir un número válido >= 0
            if (value.trim() && (isNaN(numValue) || numValue < 0)) {
                return showError(inputId, 'Debe ser un número válido mayor o igual a cero');
            }
        }
        //Validar decimales
        if (sanitizedValue.split('.')[1]?.length > 4) {
            return showError(inputId, 'Máximo 4 decimales permitidos');
        }
        if (inputId === 'arriboId') {
            const serviceRate = parseFloat(elements.inputs.servicio.value);
            if (serviceRate && numValue >= serviceRate) {
                return showError(inputId, 'La tasa de arribo debe ser menor que la tasa de servicio');
            }
        }
        if (inputId === 'servicioId') {
            const arrivalRate = parseFloat(elements.inputs.arribo.value);
            if (arrivalRate && numValue <= arrivalRate) {
                return showError(inputId, 'La tasa de servicio debe ser mayor que la tasa de arribo');
            }
        }
        return clearError(inputId);
    }

    function calculateMM1(λ, μ, N) {
        try {
            //Validad datos de entrada
            if (λ >= μ) {
                throw new Error('La tasa de arribo debe ser menor que la tasa de servicio');
            }
            //Utilización del sistema
            const rho = λ / μ;
            //Validar probabilidad
            if (rho >= 1) {
                throw new Error('El sistema está sobrecargado');
            }
            //Probabilidad de no clientes en el sistema
            const p0 = 1 - rho;
            //Número promedio de clientes en la cola
            const lq = (λ * λ) / (μ * (μ - λ));
            //Número promedio de clientes en el sistema
            const l = λ / (μ - λ);
            //Tiempo promedio de espera en la cola
            const wq = λ / (μ * (μ - λ));
            //Tiempo promedio en el sistema
            const w = l / (μ - λ);
            //Probabilidad de N clientes en el sistema
            const pn = p0 * Math.pow(rho, N);
            // Probabilidad de al menos N clientes en el sistema: sum_{n=N}^{∞} Pn
            let sumAtMostNMinus1 = 0;
            for (let n = 0; n < N; n++) {
                sumAtMostNMinus1 += p0 * Math.pow(rho, n);
            }
            const pAtLeastN = 1 - sumAtMostNMinus1;
            // Probabilidad de como máximo N clientes en el sistema: sum_{n=0}^{N} Pn
            let sumAtMostN = 0;
            for (let n = 0; n <= N; n++) {
                sumAtMostN += p0 * Math.pow(rho, n);
            }
            const pAtMostN = sumAtMostN;

            return { rho, p0, lq, l, wq, w, pn, pAtLeastN, pAtMostN };
        } catch (error) {
            throw new Error(`Error en el cálculo: ${error.message}`);
        }
    }

    //Limpiar resultados
    function clearResults() {
        const resultElements = [
            'result-rho', 'result-p0', 'result-lq', 'result-l',
            'result-wq', 'result-w', 'result-n', 'result-pn',
            'result-pn-at-least', 'result-pn-at-most'
        ];

        resultElements.forEach(id => {
            document.getElementById(id).textContent = '';
        });

        elements.resultsContainer.style.display = 'none';
    }

    //Mostrar resultados con manejo de errores
    function displayResults(results, N) {
        try {
            clearResults();
            
            //Formatear números a 4 decimales
            const formatNumber = (num) => {
                if (isNaN(num) || !isFinite(num)) {
                    return 'Error';
                }
                return num.toFixed(4);
            };

            document.getElementById('result-rho').textContent = formatNumber(results.rho);
            document.getElementById('result-p0').textContent = 
                `${formatNumber(results.p0)} = ${(results.p0 * 100).toFixed(2)}%`;
            document.getElementById('result-lq').textContent = formatNumber(results.lq);
            document.getElementById('result-l').textContent = formatNumber(results.l);
            document.getElementById('result-wq').textContent = formatNumber(results.wq);
            document.getElementById('result-w').textContent = formatNumber(results.w);

            // Mostrar probabilidades relacionadas con N solo si N está definido
            if (N !== undefined && N !== null && N !== '' && !isNaN(N)) {
                document.getElementById('result-n').textContent = N;
                // Actualizar encabezados para mostrar N
                document.querySelectorAll('h4').forEach(h4 => {
                    if (h4.textContent.includes('al menos')) {
                        h4.innerHTML = `Probabilidad de que haya en el sistema <b>al menos</b> <span id='result-n'>${N}</span> clientes:`;
                    }
                    if (h4.textContent.includes('como máximo')) {
                        h4.innerHTML = `Probabilidad de que haya en el sistema <b>como máximo</b> <span id='result-n'>${N}</span> clientes:`;
                    }
                });
                document.getElementById('result-pn').textContent = 
                    `${formatNumber(results.pn)} = ${(results.pn * 100).toFixed(2)}%`;
                // Calcular los primeros tres valores de la sumatoria
                const pn0 = results.p0 * Math.pow(results.rho, N);
                const pn1 = results.p0 * Math.pow(results.rho, Number(N) + 1);
                const pn2 = results.p0 * Math.pow(results.rho, Number(N) + 2);
                // Mostrar la ecuación de la sumatoria para al menos N clientes con los valores numéricos
                document.getElementById('result-pn-at-least').innerHTML =
                    `$$P(\\geq ${N}) = P_{${N}} + P_{${Number(N)+1}} + P_{${Number(N)+2}} + \\ldots = ${pn0.toFixed(4)} + ${pn1.toFixed(4)} + ${pn2.toFixed(4)} + \\ldots$$`;
                document.getElementById('result-pn-at-most').textContent = 
                    `${formatNumber(results.pAtMostN)} = ${(results.pAtMostN * 100).toFixed(2)}%`;
                if (window.MathJax) {
                    MathJax.typesetPromise();
                }
            } else {
                // Si N no está definido, limpiar los campos relacionados
                document.getElementById('result-n').textContent = '';
                document.querySelectorAll('h4').forEach(h4 => {
                    if (h4.textContent.includes('al menos')) {
                        h4.innerHTML = `Probabilidad de que haya en el sistema <b>al menos</b> <span id='result-n'></span> clientes:`;
                    }
                    if (h4.textContent.includes('como máximo')) {
                        h4.innerHTML = `Probabilidad de que haya en el sistema <b>como máximo</b> <span id='result-n'></span> clientes:`;
                    }
                });
                document.getElementById('result-pn').textContent = '';
                document.getElementById('result-pn-at-least').textContent = '';
                document.getElementById('result-pn-at-most').textContent = '';
            }

            elements.resultsContainer.style.display = 'block';
        } catch (error) {
            showError('submitId', `Error al mostrar resultados: ${error.message}`);
        }
    }

    //Agregar eventos de entrada con debounce
    let debounceTimer;
    Object.entries(elements.inputs).forEach(([key, input]) => {
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                validateInput(input.value, input.id);
            }, 300);
        });
    });

    //Iniciar el cálculo
    elements.submitButton.addEventListener('click', async () => {
        try {
            clearResults();
            
            //Validar todas las entradas
            const isValid = Object.entries(elements.inputs).every(([key, input]) => 
                validateInput(input.value, input.id)
            );

            if (isValid) {
                //Mostrar el estado de carga
                elements.loadingIndicator.style.display = 'block';
                elements.submitButton.disabled = true;

                //Obtener los valores de las entradas
                const λ = parseFloat(elements.inputs.arribo.value);
                const μ = parseFloat(elements.inputs.servicio.value);
                const N_raw = elements.inputs.poblacion.value;
                const N = N_raw.trim() === '' ? undefined : parseFloat(N_raw);

                //Calcular los resultados
                const results = calculateMM1(λ, μ, N);
                displayResults(results, N);
            }
        } catch (error) {
            showError('submitId', error.message);
        } finally {
            //Ocultar el estado de carga
            elements.loadingIndicator.style.display = 'none';
            elements.submitButton.disabled = false;
        }
    });
});